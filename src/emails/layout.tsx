import { ReactNode } from "react";

interface EmailLayoutProps {
  preview?: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {preview && (
          <div
            style={{
              display: "none",
              overflow: "hidden",
              maxHeight: 0,
              opacity: 0,
            }}
          >
            {preview}
          </div>
        )}
      </head>
      <body
        style={{
          backgroundColor: "#111111",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: "40px 16px",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ maxWidth: 480, margin: "0 auto" }}
        >
          <tbody>
            {/* Header */}
            <tr>
              <td
                style={{
                  paddingBottom: 24,
                  textAlign: "center" as const,
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: "-0.5px",
                    color: "#E24B4A",
                  }}
                >
                  TCGMarket
                </span>
              </td>
            </tr>

            {/* Card */}
            <tr>
              <td
                style={{
                  backgroundColor: "#1E1E1E",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "32px 36px",
                }}
              >
                {children}
              </td>
            </tr>

            {/* Footer */}
            <tr>
              <td
                style={{
                  paddingTop: 24,
                  textAlign: "center" as const,
                  color: "#9A9A9A",
                  fontSize: 12,
                }}
              >
                TCGMarket PH · Philippines&apos; TCG Marketplace
                <br />
                <span style={{ fontSize: 11 }}>
                  If you didn&apos;t request this, you can safely ignore this email.
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
