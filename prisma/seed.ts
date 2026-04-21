import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ACCOUNTS = [
  { email: "haris@podomed.local", name: "Haris", password: "Lukadoncic77" },
  { email: "dzan@podomed.local", name: "Dzan", password: "Revolucija1" },
  { email: "kanita@podomed.local", name: "Kanita", password: "Harisdzan" },
] as const;

async function main() {
  for (const account of ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 10);
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
