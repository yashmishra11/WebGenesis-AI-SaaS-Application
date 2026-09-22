import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: { name: 'fit-airline' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { fragment: true }
      }
    }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('Project ID:', project.id);
  for (const m of project.messages) {
    console.log('--- Message ---', m.role, m.type, m.content);
    if (m.fragment) {
      console.log('Fragment Title:', m.fragment.title);
      console.log('Sandbox URL:', m.fragment.sandboxUrl);
      const files = m.fragment.files as Record<string, string>;
      for (const [k, v] of Object.entries(files)) {
        console.log(`File: ${k} (length: ${v.length})`);
        console.log(`First 200 chars:\n${v.slice(0, 200)}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
