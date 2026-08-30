import { ImageResponse } from "next/og";

export const runtime = "edge";

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
        <div
          style={{
            width: "62%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 76,
            paddingRight: 30,
          }}
        >
          <img
            src="https://www.amirdamshekan.com/ad-logo.png"
            width="115"
            height="115"
            style={{
              objectFit: "contain",
              marginBottom: 30,
            }}
          />

          <div
            style={{
              fontSize: 22,
              letterSpacing: 5,
              color: "#0b716e",
              marginBottom: 18,
            }}
          >
            CIVIL ENGINEERING • VANCOUVER, BC
          </div>

          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#44545b",
              maxWidth: 670,
            }}
          >
            Engineering from
            <span style={{ color: "#15918b" }}> design to delivery.</span>
          </div>

          <div
            style={{
              fontSize: 25,
              lineHeight: 1.4,
              color: "#66757b",
              marginTop: 28,
              maxWidth: 660,
            }}
          >
            Structural • Marine • Construction • Project Management • Surveying
          </div>

          <div
            style={{
              fontSize: 23,
              fontWeight: 600,
              color: "#32474c",
              marginTop: 34,
            }}
          >
            Amir Damshekan
          </div>
        </div>

        <div
          style={{
            width: "38%",
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: "rgba(30, 151, 143, 0.14)",
              right: 25,
              top: 105,
            }}
          />

          <img
            src="https://www.amirdamshekan.com/amir-engineer.png"
            width="480"
            height="620"
            style={{
              objectFit: "contain",
              objectPosition: "bottom center",
              position: "relative",
              zIndex: 2,
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