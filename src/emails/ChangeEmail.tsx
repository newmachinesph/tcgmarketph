import { EmailLayout } from "./layout";

interface ChangeEmailProps {
  name: string;
  newEmail: string;
  url: string;
}

export function ChangeEmail({ name, newEmail, url }: ChangeEmailProps) {
  return (
    <EmailLayout preview="Verify your new email address — TCGMarket PH">
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: 22,
          fontWeight: 700,
          color: "#F2F2F2",
          letterSpacing: "-0.3px",
        }}
      >
        Verify your new email
      </h1>
      <p style={{ margin: "0 0 24px", color: "#9A9A9A", fontSize: 14 }}>
        Hi {name}, you requested to change your TCGMarket PH email to{" "}
        <strong style={{ color: "#F2F2F2" }}>{newEmail}</strong>. Click the
        button below to confirm.
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
        Confirm Email Change
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
        <strong style={{ color: "#F2F2F2" }}>30 minutes</strong>. If you
        didn&apos;t request this change, ignore this email — your account is
        safe.
      </p>
    </EmailLayout>
  );
}
