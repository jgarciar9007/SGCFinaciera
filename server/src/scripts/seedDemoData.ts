
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Demo Data for User Manual Flow ---');

    // 1. Ensure Budget for 2026 (Current System Time)
    console.log('1. Seeding Budget 2026...');
    const year = 2026;

    // Find or create Budget Account "Materiales de Oficina"
    // We need a base account first? Or just BudgetAccount.
    // Schema: BudgetAccount -> optional accountId.

    // Let's create a few Budget Lines
    const budgets = [
        { code: '601', name: 'Gastos de Personal', amount: 50000000, accountCode: '601xxx' },
        { code: '602', name: 'Materiales y Suministros', amount: 15000000, accountCode: '602xxx' },
        { code: '603', name: 'Servicios Generales', amount: 20000000, accountCode: '603xxx' },
        { code: '604', name: 'Equipos Informáticos', amount: 30000000, accountCode: '604xxx' },
    ];

    for (const b of budgets) {
        // Check if exists
        const exists = await prisma.budgetAccount.findFirst({
            where: { code: b.code, year: year }
        });

        if (!exists) {
            await prisma.budgetAccount.create({
                data: {
                    code: b.code,
                    name: b.name,
                    year: year,
                    allocatedAmount: b.amount,
                    // accountId: linked to GL account if we find it, skipping for now
                }
            });
            console.log(`   + Created Budget: ${b.name}`);
        } else {
            console.log(`   . Budget ${b.name} already exists.`);
        }
    }

    // 2. Add realistic Suppliers
    console.log('2. Seeding Suppliers...');
    const suppliers = [
        { name: 'Papelería Moderna S.L.', type: 'PROV', identification: 'PROV-002', email: 'ventas@papeleria.demo' },
        { name: 'Tech Solutions GE', type: 'PROV', identification: 'PROV-003', email: 'contact@techge.demo' },
    ];

    for (const s of suppliers) {
        const exists = await prisma.thirdParty.findFirst({
            where: { name: s.name }
        });

        if (!exists) {
            await prisma.thirdParty.create({
                data: {
                    name: s.name,
                    type: s.type,
                    identification: s.identification,
                    email: s.email,
                    isActive: true
                }
            });
            console.log(`   + Created Supplier: ${s.name}`);
        }
    }

    console.log('--- Demo Data Seeding Complete ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
