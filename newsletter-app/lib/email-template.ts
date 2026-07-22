import type { IssueInput } from "@/lib/types";
import { config } from "@/lib/config";

function escape(value: string | undefined | null) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char] || char));
}

function paragraphs(value: string) {
  if (!value) return "";
  return escape(value).split(/\n{2,}/).filter(Boolean).map((text) => `<p style="margin:0 0 16px;line-height:1.7">${text.replace(/\n/g, "<br>")}</p>`).join("");
}

export function renderNewsletter(issue: IssueInput, unsubscribeUrl: string, manageUrl = unsubscribeUrl) {
  const items = (issue.roundup_items || []).filter((item) => item.title && item.text).map((item) => `
    <tr><td style="padding:0 0 24px">
      ${item.image_url ? `<img src="${escape(item.image_url)}" alt="" width="552" style="display:block;width:100%;height:auto;margin:0 0 14px;border-radius:8px">` : ""}
      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a6b57">${escape(item.category)}</div>
      <h3 style="font-family:Georgia,serif;font-size:22px;line-height:1.25;margin:6px 0 8px;color:#3d3830">${escape(item.title)}</h3>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;margin:0 0 8px;color:#544b43">${escape(item.text)}</p>
      ${item.url ? `<p style="margin:6px 0 0"><a href="${escape(item.url)}" style="color:#6b4a36;text-decoration:underline;text-underline-offset:3px">Explore →</a></p>` : ""}
    </td></tr>`).join("");

  return `<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>@media(max-width:600px){.email-pad{padding:28px 22px!important}.email-title{font-size:32px!important}.email-shell{border-left:0!important;border-right:0!important}}</style></head><body style="margin:0;background:#f4efe7;color:#3d3830">
  <div style="display:none;max-height:0;overflow:hidden">${escape(issue.preview_text || "Get Chévere in your inbox—a weekly curation of finds worth discovering.")}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4efe7"><tr><td align="center" style="padding:28px 12px">
    <table class="email-shell" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffdf8;border:1px solid #ded3c7">
      <tr><td class="email-pad" style="padding:42px 44px 34px;text-align:center;border-bottom:1px solid #ded3c7">
        <div class="email-title" style="font-family:Georgia,serif;font-size:38px;font-weight:bold">The Edit, Delivered</div>
        <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;margin-top:10px;color:#7b6658">A weekly curation by Chévere</div>
      </td></tr>
      <tr><td class="email-pad" style="padding:40px 44px">
        ${issue.note_from_sabrina ? `<h2 style="font-family:Georgia,serif;font-size:27px;margin:0 0 16px">From the Editor</h2><div style="font-family:Arial,sans-serif;font-size:16px;color:#544b43">${paragraphs(issue.note_from_sabrina)}</div><hr style="border:0;border-top:1px solid #ded3c7;margin:32px 0">` : ""}
        ${issue.featured_image_url ? `<img src="${escape(issue.featured_image_url)}" alt="" width="552" style="display:block;width:100%;height:auto;margin:0 0 20px;border-radius:8px">` : ""}
        <h2 style="font-family:Georgia,serif;font-size:29px;margin:0 0 12px">${escape(issue.featured_title)}</h2>
        <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#544b43;margin:0 0 18px">${escape(issue.featured_preview)}</p>
        <p style="margin:0 0 34px"><a href="${escape(issue.featured_url)}" style="display:inline-block;padding:12px 28px;background:#6b4a36;color:#fffdf8;font-family:Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;border-radius:8px">Read the story</a></p>
        ${items ? `<hr style="border:0;border-top:1px solid #ded3c7;margin:0 0 34px">
        <h2 style="font-family:Georgia,serif;font-size:27px;margin:0 0 22px">Weekly Chévere Picks</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${items}</table>` : ""}
        ${items ? '<hr style="border:0;border-top:1px solid #ded3c7;margin:0 0 34px">' : ""}
        <h2 style="font-family:Georgia,serif;font-size:27px;margin:0 0 16px">Before You Go</h2>
        <div style="font-family:Arial,sans-serif;font-size:16px;color:#544b43">${paragraphs(issue.closing_note)}</div>
        <p style="font-family:Georgia,serif;font-size:20px;font-style:italic;margin:28px 0 0">${escape(issue.signoff || "Until next week,\nStay CHÉVERE").replace(/\n/g, "<br>")}</p>
      </td></tr>
      <tr><td class="email-pad" style="padding:28px 44px;text-align:center;background:#afa095;font-family:Arial,sans-serif;font-size:12px;line-height:1.65;color:#3d3830">
        <p style="margin:0 0 10px">Get Chévere in your inbox — a weekly curation of finds worth discovering.</p>
        <p style="margin:0 0 10px"><a href="${config.siteUrl}" style="color:#3d3830">Visit Chévere</a></p>
        <p style="margin:0 0 10px"><strong>Chévere</strong></p>
        <p style="margin:0 0 10px">${escape(config.businessAddress)}</p>
        <p style="margin:0"><a href="${escape(unsubscribeUrl)}" style="color:#3d3830">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}