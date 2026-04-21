import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("podomed2026", 10);
  await prisma.user.upsert({
    where: { email: "clinic@podomed.local" },
    update: { passwordHash, name: "Clinic" },
    create: {
      email: "clinic@podomed.local",
      passwordHash,
      name: "Clinic",
    },
  });
  await prisma.user.upsert({
    where: { email: "family@podomed.local" },
    update: { passwordHash, name: "Family" },
    create: {
      email: "family@podomed.local",
      passwordHash,
      name: "Family",
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
