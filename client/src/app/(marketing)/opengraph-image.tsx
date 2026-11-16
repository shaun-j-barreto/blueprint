import { ImageResponse } from "next/og";

export const alt = "BluePrint — plan projects and ship together";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * The social card is generated at build time, so it always matches the brand
 * palette without shipping another binary asset to maintain.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #f7f8fa 0%, #e3e7ee 100%)",
          padding: "72px 80px",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#0f172a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            B
          </div>
          <span style={{ fontSize: 32, fontWeight: 600 }}>BluePrint</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: -2,
              maxWidth: 920,
            }}
          >
            Turn a messy sprint into a plan everyone can follow.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: "#475569",
              maxWidth: 860,
            }}
          >
            Projects, tasks, and your team in one shared workspace.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            color: "#475569",
          }}
        >
          <div
            style={{
              width: 160,
              height: 10,
              borderRadius: 999,
              background: "#4f46e5",
            }}
          />
          Board · List · Table · Timeline
        </div>
      </div>
    ),
    size,
  );
}
