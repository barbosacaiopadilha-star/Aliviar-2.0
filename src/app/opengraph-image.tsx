import { ImageResponse } from "next/og";

export const alt = "Aliviar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf6ef",
          color: "#6b5f52",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "rgba(216, 102, 74, 0.42)",
            boxShadow: "0 0 48px rgba(244, 223, 214, 0.95)",
            marginBottom: 48,
          }}
        />
        <div style={{ fontSize: 72, fontWeight: 500, color: "#2b2420" }}>Aliviar</div>
        <div style={{ marginTop: 20, fontSize: 32, fontWeight: 400 }}>
          A luz ficou acesa.
        </div>
      </div>
    ),
    { ...size },
  );
}
