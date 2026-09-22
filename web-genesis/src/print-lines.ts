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
  console.log('Total length:', page.length);
  const lines = page.split('\n');
  console.log('Number of lines when split by real newline (\\n):', lines.length);
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    console.log(`Line ${i + 1} (length: ${lines[i].length}):`, JSON.stringify(lines[i].slice(0, 150)));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
