import { EmailLayout } from "./layout";

interface ResetPasswordProps {
  name: string;
  url: string;
}

export function ResetPassword({ name, url }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Reset your TCGMarket password">
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: 22,
          fontWeight: 700,
          color: "#F2F2F2",
          letterSpacing: "-0.3px",
        }}
      >
        Reset your password
      </h1>
      <p style={{ margin: "0 0 24px", color: "#9A9A9A", fontSize: 14 }}>
        Hi {name}, we received a request to reset your password.
      </p>

      <a
        href={url}
        style={{
          display: "inline-block",
          backgroundColor: "#E24B4A",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          padding: "12px 28px",
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        Reset Password
      </a>

      <p style={{ margin: 0, color: "#9A9A9A", fontSize: 12 }}>
        Or paste this link in your browser:
        <br />
        <a href={url} style={{ color: "#E24B4A", wordBreak: "break-all" }}>
          {url}
        </a>
      </p>

      <hr
        style={{
          margin: "24px 0",
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      />

      <p style={{ margin: 0, color: "#9A9A9A", fontSize: 12 }}>
        This link expires in{" "}
        <strong style={{ color: "#F2F2F2" }}>1 hour</strong>. If you
        didn&apos;t request a password reset, ignore this email — your account
        is safe.
      </p>
    </EmailLayout>
  );
}
