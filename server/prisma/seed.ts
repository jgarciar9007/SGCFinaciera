import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Users
    const password = 'Cndes2026*';
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@cndes.com' },
        update: {},
        create: {
            email: 'admin@cndes.com',
            fullName: 'Administrador Sistema',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    const accountant = await prisma.user.upsert({
        where: { email: 'contador@cndes.com' },
        update: {},
        create: {
            email: 'contador@cndes.com',
            fullName: 'Contador Principal',
            password: hashedPassword,
            role: 'ACCOUNTANT',
        },
    });

    const director = await prisma.user.upsert({
        where: { email: 'director@cndes.com' },
        update: {},
        create: {
            email: 'director@cndes.com',
            fullName: 'Director General',
            password: hashedPassword,
            role: 'DIRECTOR',
        },
    });

    console.log('Users seeded.');

    // 2. Accounting (Plan de Cuentas Básico)
    const accountsData = [
        // Activos
        { code: '1', name: 'ACTIVO', nature: 'A', level: 1 },
        { code: '11', name: 'EFECTIVO Y EQUIVALENTES', nature: 'A', level: 2, parentCode: '1' },
        { code: '1105', name: 'CAJA', nature: 'A', level: 3, parentCode: '11', isMovement: true },
        { code: '1110', name: 'BANCOS', nature: 'A', level: 3, parentCode: '11', isMovement: true },
        // Pasivos
        { code: '2', name: 'PASIVO', nature: 'P', level: 1 },
        { code: '23', name: 'CUENTAS POR PAGAR', nature: 'P', level: 2, parentCode: '2' },
        { code: '2335', name: 'COSTOS Y GASTOS POR PAGAR', nature: 'P', level: 3, parentCode: '23', isMovement: true },
        // Patrimonio
        { code: '3', name: 'PATRIMONIO', nature: 'K', level: 1 },
        // Ingresos
        { code: '4', name: 'INGRESOS', nature: 'I', level: 1 },
        { code: '41', name: 'INGRESOS OPERACIONALES', nature: 'I', level: 2, parentCode: '4' },
        { code: '4155', name: 'ACTIVIDADES INMOBILIARIAS', nature: 'I', level: 3, parentCode: '41', isMovement: true },
        // Gastos
        { code: '5', name: 'GASTOS', nature: 'G', level: 1 },
        { code: '51', name: 'ADMINISTRACION', nature: 'G', level: 2, parentCode: '5' },
        { code: '5105', name: 'GASTOS DE PERSONAL', nature: 'G', level: 3, parentCode: '51', isMovement: true },
        { code: '5111', name: 'GENERALES', nature: 'G', level: 3, parentCode: '51', isMovement: true },
    ];

    for (const acc of accountsData) {
        let parentId = null;
        if (acc.parentCode) {
            const parent = await prisma.account.findUnique({ where: { code: acc.parentCode } });
            parentId = parent?.id;
        }

        await prisma.account.upsert({
            where: { code: acc.code },
            update: {},
            create: {
                code: acc.code,
                name: acc.name,
                nature: acc.nature,
                level: acc.level,
                isMovement: acc.isMovement || false,
                parentId: parentId,
            },
        });
    }
    console.log('Chart of Accounts seeded.');

    // 3. Areas (Departamentos)
    const areas = [
        'Dirección General',
        'Contabilidad y Finanzas',
        'Recursos Humanos',
        'Tecnología (TI)',
        'Jurídica',
        'Bodega Central',
        'Recepción'
    ];

    for (const name of areas) {
        await prisma.area.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }
    console.log('Areas seeded.');

    // 4. Programs
    await prisma.program.upsert({
        where: { code: 'P01' },
        update: {},
        create: {
            code: 'P01',
            name: 'Fortalecimiento Institucional',
            isActive: true,
        },
    });
    console.log('Programs seeded.');

    // 5. Banks
    const bank = await prisma.bank.create({
        data: {
            name: 'Banco Nacional',
            swift: 'BNAC123',
            isActive: true,
        }
    });

    await prisma.bankAccount.create({
        data: {
            name: 'Cuenta Corriente Operativa',
            accountNumber: '111-222-333-444',
            bankName: bank.name,
            currentBalance: 0, // Start with 0 balance for clean slate? Or maybe 50M is capital? Let's keep 0 or capital. User said "remove movements". Balance IS a movement essentially. But let's leave 0 for purity.
            isActive: true,
        }
    });
    console.log('Banks seeded.');

    // 6. Budget (Master Data - Configuración Inicial)
    // Link Budget Accounts to Expense Accounts (Group 5)
    // Budget Account 1: Personal
    await prisma.budgetAccount.upsert({
        where: { code: 'XP-001' },
        update: {},
        create: {
            code: 'XP-001',
            name: 'Nómina y Salarios',
            year: 2026,
            allocatedAmount: 120000000, // This is 'allocated', arguably a setup value.
            transactions: {
                create: {
                    amount: 120000000,
                    description: 'Asignación Inicial 2026',
                    referenceType: 'INITIAL',
                }
            }
        }
    });

    // Budget Account 2: Generales (Papelería, Servicios)
    await prisma.budgetAccount.upsert({
        where: { code: 'XP-002' },
        update: {},
        create: {
            code: 'XP-002',
            name: 'Gastos Generales y Servicios',
            year: 2026,
            allocatedAmount: 40000000,
            transactions: {
                create: {
                    amount: 40000000,
                    description: 'Asignación Inicial 2026',
                    referenceType: 'INITIAL',
                }
            }
        }
    });
    console.log('Budget Config seeded.');

    console.log('Seeding completed. Sample transactional data removed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
