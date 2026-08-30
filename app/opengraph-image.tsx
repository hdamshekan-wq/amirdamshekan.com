import { ImageResponse } from "next/og";

export const alt = "Amir Damshekan - Civil Engineer";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(120deg, #f5f7f6 0%, #edf3f1 55%, #d9ebe7 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* LEFT SIDE */}
        <div
          style={{
            width: "64%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 76,
            paddingRight: 20,
          }}
        >
          <img
            src="https://www.amirdamshekan.com/ad-logo.png"
            width={115}
            height={115}
            style={{
              objectFit: "contain",
              marginBottom: 28,
            }}
          />

          <div
            style={{
              display: "flex",
              fontSize: 21,
              letterSpacing: 4,
              color: "#0b716e",
              marginBottom: 18,
            }}
          >
            CIVIL ENGINEERING • VANCOUVER, BC
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#44545b",
            }}
          >
            <div style={{ display: "flex" }}>
              Engineering from
            </div>

            <div
              style={{
                display: "flex",
                color: "#15918b",
              }}
            >
              design to delivery.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 24,
              lineHeight: 1.4,
              color: "#66757b",
              marginTop: 28,
              maxWidth: 690,
            }}
          >
            Structural • Marine • Construction • Project Management • Surveying
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 23,
              fontWeight: 600,
              color: "#32474c",
              marginTop: 34,
            }}
          >
            Amir Damshekan
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            width: "36%",
            height: "100%",
            display: "flex",
            position: "relative",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              display: "flex",
              width: 420,
              height: 420,
              borderRadius: 9999,
              background: "rgba(30, 151, 143, 0.14)",
              right: 10,
              top: 105,
            }}
          />

          <img
            src="https://www.amirdamshekan.com/amir-engineer.png"
            width={480}
            height={620}
            style={{
              objectFit: "contain",
              position: "relative",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}