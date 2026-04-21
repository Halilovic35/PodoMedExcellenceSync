-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cabin" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "date" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "patientName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'confirmed',
ADD COLUMN     "time" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "treatment" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "title" SET DEFAULT '';

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Appointment_date_time_idx" ON "Appointment"("date", "time");

-- CreateIndex
CREATE INDEX "Appointment_patientName_idx" ON "Appointment"("patientName");
