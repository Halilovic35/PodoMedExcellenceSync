import type { Metadata } from "next";
import { MailAccessPanel } from "@/components/mail-access-panel";

export const metadata: Metadata = {
  title: "Mail Access, PodoMedExcellence Sync",
};

const DEFAULT_IONOS_WEBMAIL_URL =
  "https://email.ionos.de/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX";

export default function MailPage() {
  const webmailUrl = process.env.IONOS_WEBMAIL_URL?.trim() || DEFAULT_IONOS_WEBMAIL_URL;
  return <MailAccessPanel webmailUrl={webmailUrl} />;
}
