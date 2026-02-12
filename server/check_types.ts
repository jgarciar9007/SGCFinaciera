
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const types = await prisma.thirdParty.groupBy({
        by: ['type'],
        _count: {
            type: true
        }
    });

    console.log('ThirdParty Types found in DB:');
    console.log(JSON.stringify(types, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
