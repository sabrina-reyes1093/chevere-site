export type Recommendation = { title: string; text: string; url: string; image_url?: string };

export type IssueInput = {
  title: string;
  subject: string;
  preview_text: string;
  note_from_sabrina: string;
  recommendations: Recommendation[];
  featured_title: string;
  featured_preview: string;
  featured_url: string;
  featured_image_url: string;
  obsessed_title: string;
  obsessed_text: string;
  obsessed_url: string;
  weekend_title: string;
  weekend_text: string;
  weekend_url: string;
  last_thing: string;
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
