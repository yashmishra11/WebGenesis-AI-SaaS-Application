import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.message.findMany({
    orderBy: { createdAt: 'asc' },
    include: { fragment: true }
  });
  for (const m of msgs) {
    console.log('=== MSG ===', m.id, m.createdAt, m.role, m.content);
    if (m.fragment) {
      const page = (m.fragment.files as Record<string, string>)?.['app/page.tsx'];
      console.log('Length:', page?.length);
      console.log('Repr:', JSON.stringify(page?.slice(0, 200)));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
