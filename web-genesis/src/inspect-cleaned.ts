import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: { name: 'fit-airline' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { fragment: true }
      }
    }
  });

  const page = (project.messages[0].fragment.files as Record<string, string>)['app/page.tsx'];
  
  let cleaned = page
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");

  // Fix leading quote if any
  if (cleaned.startsWith('"') && !cleaned.startsWith('"use client"')) {
    cleaned = cleaned.slice(1);
  }

  console.log('--- CLEANED FIRST 500 CHARS ---');
  console.log(cleaned.slice(0, 500));
  console.log('--- CLEANED LAST 500 CHARS ---');
  console.log(cleaned.slice(-500));
}

main().catch(console.error).finally(() => prisma.$disconnect());
