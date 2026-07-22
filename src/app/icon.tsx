import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf6ef",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "rgba(216, 102, 74, 0.55)",
            boxShadow: "0 0 18px rgba(244, 223, 214, 0.9)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
