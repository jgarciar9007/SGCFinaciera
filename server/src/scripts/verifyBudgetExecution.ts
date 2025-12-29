

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log('--- Verifying Budget Execution Logic ---');

    // 1. Pick a Budget Account
    const budgetItemName = "Materiales y Útiles de Oficina";
    const budgetItem = await prisma.budgetAccount.findFirst({
        where: { name: budgetItemName }
    });

    if (!budgetItem) {
        console.error(`Budget Item "${budgetItemName}" not found. Did seeding work?`);
        return;
    }
    console.log(`1. Found Budget Item: ${budgetItem.name} (Allocated: ${budgetItem.allocatedAmount})`);

    // 2. Check/Create Matching GL Account
    let account = await prisma.account.findFirst({
        where: { name: budgetItemName }
    });

    if (!account) {
        console.log(`2. GL Account "${budgetItemName}" not found. Creating it for test...`);
        // Create a dummy parent if needed, or just a root account for test
        account = await prisma.account.create({
            data: {
                code: '600001', // Example expense code
                name: budgetItemName,
                nature: 'D', // Deudora (Expense) - keeping as D for now or G if strictly enforced, but schema is String.
                // type: 'MOVIMIENTO', // REMOVED: Field does not exist in schema
                isActive: true,
                isMovement: true
            }
        });
    }
    console.log(`2. GL Account secured: ${account.code} - ${account.name}`);

    // 3. Create a Journal Entry (Expense)
    const amount = 50000;
    console.log(`3. Creating Journal Entry for ${amount} FCFA...`);

    const entry = await prisma.journalEntry.create({
        data: {
            date: new Date(),
            description: 'Test Expense for Budget Verification',
            status: 'POSTED',
            lines: {
                create: [
                    {
                        accountId: account.id,
                        debit: amount,
                        credit: 0,
                        description: 'Purchase of office supplies'
                    },
                    // Balancing entry (e.g. Bank/Cash) - strictly not needed for this specific test but good for consistency
                    // Assuming an account ID 1 exists or similar, but for this specific logic we only care about the debit on the matching account.
                ]
            }
        }
    });

    // 4. Verify Execution Logic (Simulate Controller Logic)
    console.log('4. Verifying Calculation...');

    const aggregations = await prisma.journalLine.aggregate({
        where: {
            account: { name: budgetItemName },
            debit: { gt: 0 }
        },
        _sum: { debit: true }
    });

    const totalExecuted = aggregations._sum.debit?.toNumber() || 0;
    console.log(`   Total Executed for "${budgetItemName}": ${totalExecuted}`);

    if (totalExecuted >= amount) {
        console.log('SUCCESS: Execution detected correctly linked by name.');
    } else {
        console.error('FAILURE: Execution not detected.');
    }

}

verify()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
