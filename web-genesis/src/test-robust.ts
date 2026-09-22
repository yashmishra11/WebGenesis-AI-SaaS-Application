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
    
  console.log('Cleaned last 15 lines:');
  console.log(cleaned.split('\n').slice(-15).join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
