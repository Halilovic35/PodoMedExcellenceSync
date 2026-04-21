import type { Metadata } from "next";
import { ChatPanel } from "@/components/chat-panel";

export const metadata: Metadata = {
  title: "Chat · PodoMedExcellence Sync",
};

export default function ChatPage() {
  return <ChatPanel />;
}
