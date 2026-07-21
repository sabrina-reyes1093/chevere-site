export type RoundupItem = {
  category: string;
  title: string;
  text: string;
  url: string;
  image_url: string;
};

export type IssueInput = {
  title: string;
  subject: string;
  preview_text: string;
  scheduled_for: string;
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