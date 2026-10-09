"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#ffffff",
          color: "#171717",
        }}
      >
        <div style={{ maxWidth: 420, padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 600, margin: "0 0 20px" }}>
            Cognity
          </p>
          <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#737373", margin: "0 0 24px" }}>
            Please reload the page. If the problem persists, sign in again.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#171717",
              color: "#ffffff",
              border: 0,
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
