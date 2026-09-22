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
  console.log('END OF LINE 3 (last 300 chars):');
  console.log(page.slice(-300));
}

main().catch(console.error).finally(() => prisma.$disconnect());
