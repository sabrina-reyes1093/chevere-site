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
  get postalAddress() { return required("NEWSLETTER_POSTAL_ADDRESS"); },
  get sendTime() { return process.env.NEWSLETTER_SEND_TIME || "08:30"; },
  get resendWebhookSecret() { return required("RESEND_WEBHOOK_SECRET"); },
  get tokenSecret() { return required("TOKEN_SECRET"); },
  get cronSecret() { return required("CRON_SECRET"); },
  get cronEnabled() { return process.env.NEWSLETTER_CRON_ENABLED === "true"; },
};
