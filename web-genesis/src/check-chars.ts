import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const msg = await prisma.message.findUnique({
    where: { id: '6d0e6372-6db8-45eb-962b-64848d88e330' },
    include: { fragment: true }
  });
  if (msg?.fragment) {
    const page = (msg.fragment.files as Record<string, string>)['app/page.tsx'];
    console.log('STARTS WITH:', JSON.stringify(page.slice(0, 30)));
    console.log('ENDS WITH:', JSON.stringify(page.slice(-30)));
    console.log('LAST CHAR CODE:', page.charCodeAt(page.length - 1));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
