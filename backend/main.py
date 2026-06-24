from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model, Model
from PIL import Image

import tensorflow as tf
import numpy as np
import cv2
import io
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading model...")
model = load_model("model.h5")
print("Model loaded!")
model.summary()

CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]

# ── GRAD-CAM SETUP (MobileNetV2 fix for Keras 3) ────────────
# MobileNetV2 last conv layer is "out_relu" inside the base model
# We need to reach INSIDE the nested MobileNetV2 layer

def build_grad_model(model):
    """
    Finds the MobileNetV2 sub-model inside the Sequential wrapper
    and builds a grad model pointing to its last conv output.
    """
    try:
        # Try to get the MobileNetV2 base layer by name
        base = None
        for layer in model.layers:
            if "mobilenetv2" in layer.name.lower():
                base = layer
                break

        if base is not None:
            # Get the last conv-like layer inside MobileNetV2
            # "out_relu" is the activation after the last depthwise conv
            last_conv_output = base.get_layer("out_relu").output
            grad_model = Model(
                inputs=model.input,
                outputs=[last_conv_output, model.output]
            )
            print("✅ Grad-CAM model built using MobileNetV2 > out_relu")
            return grad_model

        # Fallback: scan all layers for last Conv2D or DepthwiseConv2D
        last_conv_layer = None
        for layer in model.layers:
            if isinstance(layer, (tf.keras.layers.Conv2D,
                                  tf.keras.layers.DepthwiseConv2D)):
                last_conv_layer = layer

        if last_conv_layer:
            grad_model = Model(
                inputs=model.input,
                outputs=[last_conv_layer.output, model.output]
            )
            print(f"✅ Grad-CAM fallback: using layer {last_conv_layer.name}")
            return grad_model

    except Exception as e:
        print(f"⚠️ Grad-CAM setup failed: {e}")

    return None

grad_model = build_grad_model(model)


# ── PREPROCESSING ────────────────────────────────────────────
def preprocess_image(contents):
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image = image.resize((128, 128))
    img_array = np.array(image).astype("float32") / 255.0
    tensor = np.expand_dims(img_array, axis=0)
    return image, tensor


# ── GRAD-CAM GENERATION ──────────────────────────────────────
def generate_gradcam(input_tensor, class_idx):
    if grad_model is None:
        return None

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(input_tensor)
        loss = predictions[:, class_idx]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    conv_outputs = conv_outputs[0]
    heatmap = tf.reduce_sum(pooled_grads * conv_outputs, axis=-1)
    heatmap = np.maximum(heatmap.numpy(), 0)

    max_val = np.max(heatmap)
    if max_val != 0:
        heatmap /= max_val

    return heatmap


# ── OVERLAY CREATION ─────────────────────────────────────────
def create_overlay(original_image, heatmap):
    original = np.array(original_image)
    heatmap_resized = cv2.resize(heatmap, (original.shape[1], original.shape[0]))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(original, 0.6, heatmap_colored, 0.4, 0)
    overlay_bgr = cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR)
    success, buffer = cv2.imencode(".png", overlay_bgr)
    if not success:
        raise Exception("Failed to encode Grad-CAM image")
    return base64.b64encode(buffer).decode("utf-8")


# ── ROUTES ───────────────────────────────────────────────────
@app.get("/")
def home():
    return {"message": "NeuraScan API Running"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Please upload an image.")

        contents = await file.read()
        original_image, input_tensor = preprocess_image(contents)

        predictions = model.predict(input_tensor, verbose=0)[0]
        class_idx = int(np.argmax(predictions))
        label = CLASS_NAMES[class_idx]
        confidence = float(predictions[class_idx])

        scores = {CLASS_NAMES[i]: float(predictions[i]) for i in range(len(CLASS_NAMES))}

        # Grad-CAM
        gradcam_image = ""
        try:
            heatmap = generate_gradcam(input_tensor, class_idx)
            if heatmap is not None:
                gradcam_image = create_overlay(original_image, heatmap)
                print("✅ Grad-CAM generated successfully")
        except Exception as e:
            print(f"⚠️ Grad-CAM failed silently: {e}")
            gradcam_image = ""

        return {
            "label": label,
            "confidence": confidence,
            "all_scores": scores,
            "gradcam_image": gradcam_image
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))