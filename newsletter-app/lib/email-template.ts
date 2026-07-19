import type { IssueInput } from "@/lib/types";
import { config } from "@/lib/config";

function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char] || char));
}

function paragraphs(value: string) {
  return escape(value).split(/\n{2,}/).map((text) => `<p style="margin:0 0 16px;line-height:1.7">${text.replace(/\n/g, "<br>")}</p>`).join("");
}

function link(url: string, label: string) {
  return url ? `<a href="${escape(url)}" style="color:#6b4a36;text-decoration:underline;text-underline-offset:3px">${escape(label)}</a>` : "";
}

export function renderNewsletter(issue: IssueInput, unsubscribeUrl: string) {
  const recs = issue.recommendations.filter((item) => item.title && item.text && item.url).map((item) => `
    <tr><td style="padding:0 0 22px">
      <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a6b57">Worth discovering</div>
      <h3 style="font-family:Georgia,serif;font-size:22px;line-height:1.25;margin:7px 0;color:#3d3830">${escape(item.title)}</h3>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;margin:0 0 8px;color:#544b43">${escape(item.text)}</p>
      ${link(item.url, "Discover more →")}
    </td></tr>`).join("");

  const optionalLink = (url: string) => url ? `<p style="margin:10px 0 0">${link(url, "Explore →")}</p>` : "";
  return `<!doctype html><html><body style="margin:0;background:#f4efe7;color:#3d3830">
  <div style="display:none;max-height:0;overflow:hidden">${escape(issue.preview_text || "Get Chévere in your inbox—a weekly curation of finds worth discovering.")}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4efe7"><tr><td align="center" style="padding:28px 12px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffdf8;border:1px solid #ded3c7">
      <tr><td style="padding:42px 44px 34px;text-align:center;border-bottom:1px solid #ded3c7">
        <div style="font-family:Georgia,serif;font-size:38px;font-weight:bold">The Edit, Delivered</div>
        <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;margin-top:10px;color:#7b6658">A weekly curation by Chévere</div>
      </td></tr>
      <tr><td style="padding:40px 44px">
        <h2 style="font-family:Georgia,serif;font-size:29px;margin:0 0 16px">A Note from Sabrina</h2>
        <div style="font-family:Arial,sans-serif;font-size:16px;color:#544b43">${paragraphs(issue.note_from_sabrina)}</div>
        <hr style="border:0;border-top:1px solid #ded3c7;margin:34px 0">
        <h2 style="font-family:Georgia,serif;font-size:29px;margin:0 0 22px">This Week’s Edit</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${recs}</table>
        <hr style="border:0;border-top:1px solid #ded3c7;margin:20px 0 34px">
        <h2 style="font-family:Georgia,serif;font-size:29px;margin:0 0 16px">The Chévere Read</h2>
        ${issue.featured_image_url ? `<img src="${escape(issue.featured_image_url)}" alt="" width="552" style="display:block;width:100%;height:auto;margin:0 0 20px">` : ""}
        <h3 style="font-family:Georgia,serif;font-size:24px;margin:0 0 10px">${escape(issue.featured_title)}</h3>
        <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#544b43">${escape(issue.featured_preview)}</p>
        ${link(issue.featured_url, "Read the full edit →")}
        <hr style="border:0;border-top:1px solid #ded3c7;margin:34px 0">
        <h2 style="font-family:Georgia,serif;font-size:27px;margin:0 0 10px">Currently Obsessed</h2>
        <h3 style="font-family:Georgia,serif;font-size:21px;margin:0 0 8px">${escape(issue.obsessed_title)}</h3>
        <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#544b43">${paragraphs(issue.obsessed_text)}${optionalLink(issue.obsessed_url)}</div>
        <hr style="border:0;border-top:1px solid #ded3c7;margin:34px 0">
        <h2 style="font-family:Georgia,serif;font-size:27px;margin:0 0 10px">For the Weekend</h2>
        <h3 style="font-family:Georgia,serif;font-size:21px;margin:0 0 8px">${escape(issue.weekend_title)}</h3>
        <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#544b43">${paragraphs(issue.weekend_text)}${optionalLink(issue.weekend_url)}</div>
        <hr style="border:0;border-top:1px solid #ded3c7;margin:34px 0">
        <h2 style="font-family:Georgia,serif;font-size:27px;margin:0 0 10px">One Last Thing</h2>
        <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.7;color:#544b43">${paragraphs(issue.last_thing)}</div>
        <p style="font-family:Georgia,serif;font-size:20px;font-style:italic;margin:28px 0 0">Stay chévere,<br>Sabrina</p>
      </td></tr>
      <tr><td style="padding:28px 44px;text-align:center;background:#afa095;font-family:Arial,sans-serif;font-size:12px;line-height:1.65;color:#3d3830">
        <p style="margin:0 0 10px">Get Chévere in your inbox—a weekly curation of finds worth discovering.</p>
        <p style="margin:0 0 10px"><a href="${config.siteUrl}" style="color:#3d3830">Visit Chévere</a> &nbsp;·&nbsp; <a href="mailto:${escape(config.replyTo)}" style="color:#3d3830">Reply to Sabrina</a></p>
        <p style="margin:0 0 10px">${escape(config.postalAddress)}</p>
        <p style="margin:0"><a href="${escape(unsubscribeUrl)}" style="color:#3d3830">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}
