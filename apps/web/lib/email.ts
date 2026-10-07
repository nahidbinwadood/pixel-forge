import "server-only";

interface Mail {
  to: string;
  subject: string;
  text: string;
}

/** Resend over plain fetch (no SDK). Without RESEND_API_KEY (dev/test), mail is logged to the console. */
export async function sendEmail({ to, subject, text }: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email:dev] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) throw new Error(`email send failed: ${res.status} ${await res.text()}`);
}
