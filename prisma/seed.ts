import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ACCOUNTS = [
  { email: "haris@podomed.local", name: "Haris" },
  { email: "dzan@podomed.local", name: "Dzan" },
  { email: "kanita@podomed.local", name: "Kanita" },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("podomed2026", 10);

  for (const account of ACCOUNTS) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, name: account.name },
      create: {
        email: account.email,
        passwordHash,
        name: account.name,
      },
    });
  }

  await prisma.user.deleteMany({
    where: {
      email: { in: ["clinic@podomed.local", "family@podomed.local"] },
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
