export type RoundupItem = {
  id: string;
  category: string;
  title: string;
  text: string;
  url: string;
  image_url: string;
  image_alt: string;
  link_type: "internal" | "external";
  cta_label: string;
  display_order: number;
};

export type IssueInput = {
  note_from_sabrina: string;
  title: string;
  subject: string;
  preview_text: string;
  issue_date: string;
  scheduled_for: string;
  homepage_publish_at: string;
  roundup_status: "draft" | "scheduled" | "published" | "archived";
  featured_title: string;
  featured_preview: string;
  featured_url: string;
  featured_image_url: string;
  roundup_items: RoundupItem[];
  closing_note: string;
  signoff: string;
};

export type Issue = IssueInput & {
  id: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  approved_at: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  recipient_count: number;
  attempt_count: number;
  next_retry_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};
