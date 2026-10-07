import { APP_NAME } from "@pixelforge/shared";

/**
 * Shared email shell, built as plain template-literal HTML (no JSX): Next's App Router bundler
 * flatly refuses to import `react-dom/server` anywhere in its module graph — even in a server-only
 * lib used only by a route handler — so `renderToStaticMarkup` isn't an option here. Inline styles
 * only: email clients don't load external stylesheets or Tailwind's CSS-variable tokens, so brand
 * colors are hardcoded to match apps/web/app/globals.css's light-theme `--primary-solid` (#5b3fe0).
 */
const INK = "#10112A";
const MUTED = "#5E6180";
const BORDER = "#E5E5F5";
const PRIMARY = "#5B3FE0";
const BG = "#F7F7FC";

const FONT_STACK = "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface EmailButton {
  label: string;
  url: string;
}

export interface EmailContent {
  previewText: string;
  heading: string;
  paragraphs: string[];
  button?: EmailButton;
  /** Shown under the button as a plain-text fallback link, for clients that strip buttons. */
  fallbackNote?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Renders the shared shell to a full HTML document string, plus a plain-text fallback. */
export function renderEmail({ previewText, heading, paragraphs, button, fallbackNote }: EmailContent): {
  html: string;
  text: string;
} {
  const paragraphsHtml = paragraphs
    .map((p) => `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${MUTED};">${escapeHtml(p)}</p>`)
    .join("");

  const buttonHtml = button
    ? `<div style="padding:16px 0 8px;">
        <a href="${escapeHtml(button.url)}" style="display:inline-block;background-color:${PRIMARY};color:#FFFFFF;font-weight:600;font-size:15px;text-decoration:none;padding:12px 24px;border-radius:999px;">${escapeHtml(button.label)}</a>
      </div>`
    : "";

  const fallbackHtml = fallbackNote
    ? `<p style="margin:4px 0 24px;font-size:12px;line-height:1.6;color:${MUTED};word-break:break-all;">${escapeHtml(fallbackNote)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(APP_NAME)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:${FONT_STACK};">
<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;">${escapeHtml(previewText)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border-radius:20px;border:1px solid ${BORDER};overflow:hidden;">
<tr><td style="padding:28px 32px 0;">
<span style="font-size:18px;font-weight:700;color:${INK};letter-spacing:-0.02em;">${escapeHtml(APP_NAME)}</span>
</td></tr>
<tr><td style="padding:20px 32px 8px;">
<h1 style="margin:0;font-size:22px;line-height:1.3;color:${INK};font-weight:700;">${escapeHtml(heading)}</h1>
</td></tr>
<tr><td style="padding:0 32px 8px;">
${paragraphsHtml}
</td></tr>
<tr><td style="padding:0 32px;">
${buttonHtml}
${fallbackHtml}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid ${BORDER};">
<p style="margin:0;font-size:12px;color:${MUTED};">${escapeHtml(APP_NAME)} &middot; you're receiving this because of activity on your account.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const lines = [heading, "", ...paragraphs];
  if (button) lines.push("", `${button.label}: ${button.url}`);
  lines.push("", `${APP_NAME} · you're receiving this because of activity on your account.`);
  return { html, text: lines.join("\n") };
}
