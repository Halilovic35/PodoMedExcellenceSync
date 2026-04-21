import type { Metadata } from "next";
import { DocumentsPanel } from "@/components/documents-panel";

export const metadata: Metadata = {
  title: "Documents, PodoMedExcellence Sync",
};

export default function DocumentsPage() {
  return <DocumentsPanel />;
}
