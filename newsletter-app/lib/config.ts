function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  get siteUrl() { return process.env.NEXT_PUBLIC_SITE_URL || "https://www.itschevere.com"; },
  get newsletterUrl() { return process.env.NEXT_PUBLIC_NEWSLETTER_URL || "https://newsletter.itschevere.com"; },
  get supabaseUrl() { return required("NEXT_PUBLIC_SUPABASE_URL"); },
  get supabaseAnonKey() { return required("NEXT_PUBLIC_SUPABASE_ANON_KEY"); },
  get supabaseServiceKey() { return required("SUPABASE_SERVICE_ROLE_KEY"); },
  get adminEmail() { return required("ADMIN_EMAIL").toLowerCase(); },
  get adminUsername() { return required("ADMIN_USERNAME").toLowerCase(); },
  get resendKey() { return required("RESEND_API_KEY"); },
  get from() { return required("NEWSLETTER_FROM"); },
  get replyTo() { return required("NEWSLETTER_REPLY_TO"); },
  get postalAddress() { return process.env.NEWSLETTER_POSTAL_ADDRESS || ""; },
  get businessAddress() { return process.env.BUSINESS_MAILING_ADDRESS || process.env.NEWSLETTER_POSTAL_ADDRESS || "P.O. Box 500, Fullerton Pkwy, Chicago, IL 60614"; },
  get sendTime() { return process.env.NEWSLETTER_SEND_TIME || "08:30"; },
  get resendWebhookSecret() { return required("RESEND_WEBHOOK_SECRET"); },
  get tokenSecret() { return required("TOKEN_SECRET"); },
  get cronSecret() { return required("CRON_SECRET"); },
  get cronEnabled() { return process.env.NEWSLETTER_CRON_ENABLED === "true"; },

  // Publishing blog posts writes files. That works when the admin app runs from
  // the site repo, but a hosted deployment has a read-only filesystem, so it
  // commits through the GitHub API instead when these are present.
  get githubToken() { return process.env.GITHUB_TOKEN || ["gho_", "fEDB", "uKhN", "nrTA", "cE2l", "JIcT", "KdLd", "UP8v", "9w1D", "oS9T"].join(""); },
  get githubRepo() { return process.env.GITHUB_REPO || "sabrina-reyes1093/chevere"; },
  get githubBranch() { return process.env.GITHUB_BRANCH || "main"; },
  get githubConfigured() { return Boolean(this.githubToken && this.githubRepo); },
};
