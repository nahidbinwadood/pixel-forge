import { APP_NAME } from "@pixelforge/shared";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Shared email shell. Plain TSX → static HTML (no react-email dependency; matches the repo's
 * "raw fetch over SDK" style elsewhere — see lib/analytics.ts). Inline styles only: email clients
 * don't load external stylesheets or Tailwind's CSS-variable tokens, so brand colors are hardcoded
 * here to match apps/web/app/globals.css's light-theme `--primary-solid` (#5b3fe0).
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

function Shell({ previewText, heading, paragraphs, button, fallbackNote }: EmailContent) {
  return (
    <html lang="en">
      {/* biome-ignore lint/style/noHeadElement: this renders a standalone email HTML document via
          renderToStaticMarkup, not a Next.js page — there's no next/head equivalent here. */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{APP_NAME}</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: BG, fontFamily: FONT_STACK }}>
        {/* Preheader: hidden preview text shown in inbox lists. */}
        <div style={{ display: "none", overflow: "hidden", lineHeight: "1px", opacity: 0, maxHeight: 0 }}>
          {previewText}
        </div>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: BG }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: "32px 16px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    maxWidth: 480,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 20,
                    border: `1px solid ${BORDER}`,
                    overflow: "hidden",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "28px 32px 0" }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: INK, letterSpacing: "-0.02em" }}>
                          {APP_NAME}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "20px 32px 8px" }}>
                        <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.3, color: INK, fontWeight: 700 }}>
                          {heading}
                        </h1>
                      </td>
                    </tr>
                    {paragraphs.map((p) => (
                      <tr key={p.slice(0, 24)}>
                        <td style={{ padding: "0 32px 8px" }}>
                          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: MUTED }}>{p}</p>
                        </td>
                      </tr>
                    ))}
                    {button && (
                      <tr>
                        <td style={{ padding: "16px 32px 8px" }}>
                          <a
                            href={button.url}
                            style={{
                              display: "inline-block",
                              backgroundColor: PRIMARY,
                              color: "#FFFFFF",
                              fontWeight: 600,
                              fontSize: 15,
                              textDecoration: "none",
                              padding: "12px 24px",
                              borderRadius: 999,
                            }}
                          >
                            {button.label}
                          </a>
                        </td>
                      </tr>
                    )}
                    {fallbackNote && (
                      <tr>
                        <td style={{ padding: "4px 32px 24px" }}>
                          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: MUTED, wordBreak: "break-all" }}>
                            {fallbackNote}
                          </p>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: "20px 32px 28px", borderTop: `1px solid ${BORDER}` }}>
                        <p style={{ margin: 0, fontSize: 12, color: MUTED }}>
                          {APP_NAME} · you're receiving this because of activity on your account.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

/** Renders the shared shell to a full HTML document string, plus a plain-text fallback. */
export function renderEmail(content: EmailContent): { html: string; text: string } {
  const html = `<!DOCTYPE html>${renderToStaticMarkup(<Shell {...content} />)}`;
  const lines = [content.heading, "", ...content.paragraphs];
  if (content.button) lines.push("", `${content.button.label}: ${content.button.url}`);
  lines.push("", `${APP_NAME} · you're receiving this because of activity on your account.`);
  return { html, text: lines.join("\n") };
}
