import type { Metadata } from "next";
import { AppointmentsPanel } from "@/components/appointments-panel";

export const metadata: Metadata = {
  title: "Appointments, PodoMedExcellence Sync",
};

export default function AppointmentsPage() {
  return <AppointmentsPanel />;
}
