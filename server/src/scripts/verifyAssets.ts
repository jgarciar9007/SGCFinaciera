
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Asset Module ---');

    // 1. Create an Asset
    const newAsset = await prisma.asset.create({
        data: {
            code: 'TEST-PC-001',
            name: 'Test Computer',
            description: 'Asset created during verification',
            purchaseDate: new Date(),
            value: 500000,
            location: 'Server Room',
            status: 'ACTIVE'
        }
    });
    console.log('1. Created Asset:', newAsset.id, newAsset.code);

    // 2. Fetch Assets
    const assets = await prisma.asset.findMany();
    console.log(`2. Asset List Count: ${assets.length}`);

    const found = assets.find(a => a.id === newAsset.id);
    if (found) {
        console.log('SUCCESS: Asset found in DB.');
    } else {
        console.error('FAILURE: Asset not found.');
    }

    // 3. Cleanup
    await prisma.asset.delete({ where: { id: newAsset.id } });
    console.log('3. Cleanup: Asset deleted.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
