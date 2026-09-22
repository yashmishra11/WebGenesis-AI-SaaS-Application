import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.message.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: { fragment: true }
  });
  for (const m of msgs) {
    console.log('=== MSG ===', m.id, m.role, m.type, m.content);
    if (m.fragment) {
      console.log('URL:', m.fragment.sandboxUrl);
      const page = (m.fragment.files as Record<string, string>)?.['app/page.tsx'];
      if (page) {
        console.log('PAGE (first 500 chars):\n', JSON.stringify(page.slice(0, 500)));
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
