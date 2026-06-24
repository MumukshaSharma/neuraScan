import { useState, useCallback } from "react";
import axios from "axios";

const CLASS_COLORS = {
  glioma:     "#f87171",
  meningioma: "#60a5fa",
  notumor:    "#4ade80",
  pituitary:  "#c084fc",
};

export default function App() {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [toast, setToast]       = useState("");
  const [dragging, setDragging] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleFile = (f) => {
    if (!f) return;
    if (!["image/png","image/jpeg","image/jpg"].includes(f.type)) { showToast("JPG or PNG only."); return; }
    setFile(f); setPreview(URL.createObjectURL(f)); setResult(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const analyzeScan = async () => {
    if (!file) { showToast("Please upload an MRI image."); return; }
    try {
      setLoading(true);
      const fd = new FormData(); fd.append("file", file);
      const res = await axios.post("http://localhost:8000/predict", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data);
    } catch { showToast("Analysis failed. Check backend server."); }
    finally { setLoading(false); }
  };

  const isNoTumor = result?.label?.toLowerCase() === "notumor";
  const confPct   = result ? (result.confidence * 100).toFixed(1) : 0;
  const vd = isNoTumor
    ? { bg: "rgba(34,197,94,0.05)",  border: "rgba(34,197,94,0.25)",  accent: "#4ade80", dim: "rgba(34,197,94,0.5)" }
    : { bg: "rgba(239,68,68,0.05)",  border: "rgba(239,68,68,0.25)",  accent: "#f87171", dim: "rgba(239,68,68,0.5)" };

  const card = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "28px 32px",
  };

  const sectionLabel = {
    fontSize: 11, fontWeight: 700,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "1px", textTransform: "uppercase", marginBottom: 20,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", fontFamily: "system-ui,-apple-system,sans-serif", position: "relative", overflowX: "hidden" }}>

      {/* Aurora */}
      <div style={{ position: "fixed", bottom: -100, right: -100, width: 700, height: 700, background: "radial-gradient(ellipse, #7c3aed 0%, #2563eb 45%, #06b6d4 100%)", opacity: 0.18, filter: "blur(140px)", zIndex: 0, pointerEvents: "none" }} />

      {/* Toast */}
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 100, background: "#ef4444", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 13 }}>{toast}</div>}

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 10, borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5">
            <path d="M12 2C8 2 5 5 5 9c0 2.3 1.1 4.3 2.8 5.6V18a2 2 0 002 2h.5a2.5 2.5 0 005 0h.5a2 2 0 002-2v-3.4A7 7 0 0019 9c0-4-3-7-7-7z"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>NeuraScan</span>
        </div>
        <span style={{ fontSize: 12, border: "1px solid rgba(255,255,255,0.15)", padding: "4px 14px", borderRadius: 999, color: "rgba(255,255,255,0.5)" }}>Research only</span>
      </nav>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1240, margin: "0 auto", padding: "0 48px 80px" }}>

        {/* Hero — full width */}
        <div style={{ padding: "80px 0 64px", textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-block", fontSize: 12, border: "1px solid rgba(255,255,255,0.12)", padding: "4px 14px", borderRadius: 999, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>
            MobileNetV2 · 4 tumor classes · Grad-CAM
          </div>
          <h1 style={{ fontSize: "clamp(36px,5vw,58px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1.5px", margin: "0 0 20px", color: "#fff" }}>
            AI-powered brain<br/>tumor detection.
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 36px", fontWeight: 400 }}>
            Upload an MRI scan. Get instant classification powered by transfer learning and visual explainability.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => document.getElementById("upload-zone").click()} style={{ background: "#fff", color: "#080808", border: "none", padding: "11px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Analyze scan
            </button>
            <a href="https://github.com" target="_blank" rel="noreferrer" style={{ background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)", padding: "11px 24px", borderRadius: 8, fontSize: 14, cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              View on GitHub
            </a>
          </div>
        </div>

        {/* Three column grid: Upload | Results | Model Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 14, alignItems: "stretch" }}>

          {/* COL 1 — Upload */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...card, flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={sectionLabel}>Upload MRI scan</div>

              <label
                style={{ display: "block", flex: 1, border: `1px solid ${dragging ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, background: dragging ? "rgba(255,255,255,0.04)" : "transparent", cursor: "pointer", overflow: "hidden", transition: "all 0.2s", minHeight: 180 }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                <input id="upload-zone" type="file" accept=".png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
                {!preview ? (
                  <div style={{ padding: "48px 16px", textAlign: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" style={{ margin: "0 auto 14px", display: "block" }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Drag & drop MRI image</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", marginTop: 6 }}>or click to browse · JPG, PNG</div>
                  </div>
                ) : (
                  <div style={{ position: "relative", height: "100%" }}>
                    <img src={preview} alt="MRI" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: 11 }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(8,8,8,0.92))", padding: "32px 14px 14px", borderRadius: "0 0 11px 11px" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>LOADED</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>{file?.name}</div>
                    </div>
                  </div>
                )}
              </label>

              <button
                onClick={analyzeScan}
                disabled={loading || !file}
                style={{ marginTop: 14, width: "100%", background: file && !loading ? "rgba(255,255,255,0.06)" : "transparent", border: "1px solid rgba(255,255,255,0.09)", color: file ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.2)", padding: "12px", borderRadius: 10, fontSize: 14, cursor: file && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}
              >
                {loading
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Analyzing...</>
                  : "Analyze scan"}
              </button>
            </div>

            {/* Grad-CAM below upload */}
            {result?.gradcam_image && (
              <div style={{ ...card, animation: "fadein 0.5s ease" }}>
                <div style={sectionLabel}>Attention heatmap</div>
                <img src={`data:image/png;base64,${result.gradcam_image}`} alt="Grad-CAM" style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }} />
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 12, lineHeight: 1.6 }}>Regions the model focused on during prediction.</p>
              </div>
            )}
          </div>

          {/* COL 2 — Results (wider) */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={sectionLabel}>Analysis result</div>

            {!result ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.1)", fontSize: 14, textAlign: "center", padding: "40px 0" }}>
                Upload and analyze an MRI scan<br/>to see results here
              </div>
            ) : (
              <div style={{ animation: "fadein 0.4s ease", display: "flex", flexDirection: "column", gap: 28 }}>
                {/* Verdict */}
                <div style={{ background: vd.bg, border: `1px solid ${vd.border}`, borderRadius: 12, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, color: vd.dim, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>Prediction</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: vd.accent }}>
                      {isNoTumor ? "No tumor detected" : `Tumor: ${result.label}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 44, fontWeight: 700, color: vd.accent, lineHeight: 1 }}>{confPct}%</div>
                    <div style={{ fontSize: 11, color: vd.dim, marginTop: 4 }}>confidence</div>
                  </div>
                </div>

                {/* Probability bars */}
                <div>
                  <div style={{ ...sectionLabel, marginBottom: 16 }}>Class probabilities</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {Object.entries(result.all_scores)
                      .sort(([,a],[,b]) => b - a)
                      .map(([label, score]) => {
                        const pct   = (score * 100).toFixed(1);
                        const color = CLASS_COLORS[label] || "#fff";
                        const isTop = label === result.label;
                        const name  = label === "notumor" ? "No tumor" : label.charAt(0).toUpperCase() + label.slice(1);
                        return (
                          <div key={label}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                              <span style={{ fontSize: 13, color: isTop ? "#fff" : "rgba(255,255,255,0.38)", fontWeight: isTop ? 700 : 400 }}>{name}</span>
                              <span style={{ fontSize: 13, color: isTop ? color : "rgba(255,255,255,0.28)", fontWeight: isTop ? 700 : 400 }}>{pct}%</span>
                            </div>
                            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COL 3 — Model Info */}
          <div style={{ ...card, display: "flex", flexDirection: "column" }}>
            <div style={sectionLabel}>Model info</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                ["Architecture", "MobileNetV2"],
                ["Input size",   "128 × 128 px"],
                ["Classes",      "4 tumor types"],
                ["Framework",    "TensorFlow / Keras"],
                ["Explainability","Grad-CAM"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", fontWeight: 400 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 400, textAlign: "right", maxWidth: "55%" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Stats strip inside model info */}
            <div style={{ marginTop: "auto", paddingTop: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  ["~91%", "Test accuracy"],
                  ["4", "Tumor classes"],
                  ["7k+", "Training scans"],
                  ["128px", "Input size"],
                ].map(([val, label]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 12px" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{val}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 100, position: "relative", textAlign: "center", paddingBottom: 48, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ fontSize: "clamp(70px,10vw,140px)", fontWeight: 700, color: "#fff", opacity: 0.03, whiteSpace: "nowrap", userSelect: "none", letterSpacing: "-4px" }}>NeuraScan</span>
          </div>
          <p style={{ position: "relative", fontSize: 13, color: "rgba(255,255,255,0.18)", lineHeight: 1.6 }}>
            For research purposes only — not a substitute for medical diagnosis.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @media (max-width: 860px) {
          nav { padding: 14px 20px !important; }
          div[style*="maxWidth: 1240"] { padding: 0 20px 60px !important; }
          div[style*="gridTemplateColumns: \"1fr 1.4fr 1fr\""] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}