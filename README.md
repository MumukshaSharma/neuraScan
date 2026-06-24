<div align="center">

# 🧠 NeuraScan

### AI-Powered Brain Tumor MRI Detection

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-FF6F00?style=flat&logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

**End-to-end MRI classification system with visual explainability via Grad-CAM**

[Demo](#demo) · [Architecture](#architecture) · [Setup](#setup) · [Results](#results)

</div>

---

## Overview

NeuraScan is a full-stack deep learning application that classifies brain MRI scans into 4 categories using transfer learning on MobileNetV2. It features a React frontend with drag-and-drop upload, a FastAPI inference backend, and Grad-CAM heatmap overlays that highlight the regions the model focused on during prediction.

> ⚠️ **Research use only.** Not a substitute for medical diagnosis.

---

## Demo

| Upload MRI | Prediction Result | Grad-CAM Heatmap |
|:---:|:---:|:---:|
| Drag & drop or click to browse | Confidence score + class probabilities | Visual attention overlay |

---

## Architecture

```
┌─────────────────┐     FormData/POST      ┌──────────────────────────┐
│   React + Vite  │ ─────────────────────► │   FastAPI (Python)       │
│   Tailwind CSS  │                         │                          │
│   Axios         │ ◄───────────────────── │   MobileNetV2 (.h5)      │
│                 │   JSON Response         │   Grad-CAM Engine        │
│  · Upload zone  │                         │   OpenCV overlay         │
│  · Prob. bars   │                         │   Base64 image encoder   │
│  · Heatmap view │                         │                          │
└─────────────────┘                         └──────────────────────────┘
```

### Model Architecture

```
Input (128×128×3)
    │
MobileNetV2 (ImageNet pretrained)
    │  └── Last 20 layers fine-tuned
    │
GlobalAveragePooling2D
    │
BatchNormalization + Dropout(0.4)
    │
Dense(128, relu)
    │
Dropout(0.3)
    │
Dense(4, softmax)
    │
Output: [glioma, meningioma, notumor, pituitary]
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Axios |
| **Backend** | FastAPI, Uvicorn, Python 3.10+ |
| **ML Framework** | TensorFlow 2.x / Keras |
| **Model** | MobileNetV2 (transfer learning, ImageNet weights) |
| **Explainability** | Grad-CAM (custom Keras implementation) |
| **Image Processing** | OpenCV, Pillow |
| **Dataset** | Brain Tumor MRI Dataset — Kaggle (7,000+ scans) |

---

## Dataset

**[Brain Tumor MRI Dataset](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset)** by Masoud Nickparvar

| Class | Training | Testing |
|---|---|---|
| Glioma | 1,321 | 300 |
| Meningioma | 1,339 | 306 |
| No Tumor | 1,595 | 405 |
| Pituitary | 1,457 | 300 |
| **Total** | **5,712** | **1,311** |

---

## Results

| Metric | Value |
|---|---|
| Test Accuracy | ~91% |
| Model Parameters | 3.4M |
| Input Size | 128 × 128 px |
| Inference Time | < 200ms |
| Classes | 4 |

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A trained `model.h5` file (see Training section)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/neurascan.git
cd neurascan
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

**`requirements.txt`**
```
fastapi
uvicorn
tensorflow
opencv-python
pillow
numpy
python-multipart
```

Place your `model.h5` in the `backend/` folder, then run:

```bash
uvicorn main:app --reload
# API running at http://localhost:8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

---

## Training

The model was trained on Google Colab (T4 GPU) using the fast training pipeline:

```python
# Key training config
MODEL      = MobileNetV2(input_shape=(128,128,3), weights='imagenet')
IMAGE_SIZE = 128
BATCH_SIZE = 32
EPOCHS     = 15   # EarlyStopping typically halts at 8–10
LR         = 1e-4

# Fine-tune last 20 layers of MobileNetV2
for layer in base_model.layers[-20:]:
    layer.trainable = True
```

**Augmentation pipeline:** horizontal flip, ±15° rotation, brightness ±20%, contrast ±20%

**Callbacks:** EarlyStopping (patience=4), ReduceLROnPlateau (factor=0.5), ModelCheckpoint

---

## API Reference

### `POST /predict`

Upload an MRI image and receive a classification result.

**Request:** `multipart/form-data` with field `file` (JPG or PNG)

**Response:**
```json
{
  "label": "glioma",
  "confidence": 0.94,
  "all_scores": {
    "glioma": 0.94,
    "meningioma": 0.03,
    "notumor": 0.02,
    "pituitary": 0.01
  },
  "gradcam_image": "<base64 PNG string>"
}
```

### `GET /`

Health check — returns `{ "message": "NeuraScan API Running" }`.

---

## Project Structure

```
neurascan/
├── backend/
│   ├── main.py              # FastAPI app, /predict endpoint, Grad-CAM
│   ├── model.h5             # Trained MobileNetV2 weights (not committed)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── App.jsx          # React UI — upload, results, heatmap
│   ├── index.html
│   └── package.json
├── training/
│   └── brainTumorDetection_fast.py   # Colab training notebook
└── README.md
```

---

## Grad-CAM Explainability

NeuraScan uses Gradient-weighted Class Activation Mapping (Grad-CAM) to produce visual explanations of the model's predictions. The heatmap highlights regions of the MRI that most influenced the classification decision.

**Implementation:** Custom Keras gradient tape targeting MobileNetV2's `out_relu` layer — compatible with Keras 3 and TensorFlow 2.x nested model architectures.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built with TensorFlow · FastAPI · React</sub>
</div>
