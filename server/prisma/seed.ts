import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed AVANZADO (V3) de la base de datos...\n');

    // ================= CLEANUP =================
    console.log('🧹 Limpiando datos anteriores...');
    // Asset cleanup
    await prisma.assetMovement.deleteMany({});
    await prisma.asset.deleteMany({});

    // Procurement & Billing cleanup
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.reception.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});

    // Expense cleanup
    await prisma.expenseQuotation.deleteMany({});
    await prisma.expenseAttachment.deleteMany({});
    await prisma.expenseItem.deleteMany({});
    await prisma.expenseRequest.deleteMany({});

    // Budget & Treasury cleanup
    await prisma.budgetTransaction.deleteMany({});
    await prisma.budgetAccount.deleteMany({});
    await prisma.bankTransaction.deleteMany({});
    await prisma.bankAccount.deleteMany({});
    await prisma.bank.deleteMany({});

    // Accounting cleanup
    await prisma.journalLine.deleteMany({});
    await prisma.journalEntry.deleteMany({});
    await prisma.account.deleteMany({});

    // Masters cleanup
    await prisma.thirdParty.deleteMany({});
    await prisma.program.deleteMany({});
    await prisma.area.deleteMany({});
    // Users are upserted
    console.log('✅ Datos anteriores eliminados\n');

    // ================= 1. USUARIOS =================
    console.log('👥 Creando usuarios...');
    const password = await bcrypt.hash('Cndes2026*', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@cndes.ge' }, update: {},
        create: { email: 'admin@cndes.ge', fullName: 'Administrador Sistema', password, role: 'ADMIN' },
    });
    const accountant = await prisma.user.upsert({
        where: { email: 'contador@example.com' }, update: {},
        create: { email: 'contador@example.com', fullName: 'María González - Contador', password, role: 'ACCOUNTANT' },
    });
    const director = await prisma.user.upsert({
        where: { email: 'director@example.com' }, update: {},
        create: { email: 'director@example.com', fullName: 'Carlos Rodríguez - Director', password, role: 'DIRECTOR' },
    });
    const member = await prisma.user.upsert({
        where: { email: 'miembro@example.com' }, update: {},
        create: { email: 'miembro@example.com', fullName: 'Laura Pérez - Miembro', password, role: 'MEMBER' },
    });
    const user = await prisma.user.upsert({
        where: { email: 'usuario@example.com' }, update: {},
        create: { email: 'usuario@example.com', fullName: 'Ana Martínez - Usuario', password, role: 'USER' },
    });
    console.log('✅ Usuarios creados\n');

    // ================= 2. PLAN DE CUENTAS =================
    console.log('📊 Creando plan de cuentas...');
    const accountsData: Array<{ code: string; name: string; nature: 'ACTIVE' | 'PASSIVE' | 'INCOME' | 'EXPENSE'; level: number; parentCode?: string; isMovement?: boolean; }> = [
        // ACTIVOS
        { code: '1', name: 'ACTIVO', nature: 'ACTIVE', level: 1 },
        { code: '11', name: 'EFECTIVO Y EQUIVALENTES', nature: 'ACTIVE', level: 2, parentCode: '1' },
        { code: '1105', name: 'CAJA GENERAL', nature: 'ACTIVE', level: 3, parentCode: '11', isMovement: true },
        { code: '1110', name: 'BANCOS', nature: 'ACTIVE', level: 3, parentCode: '11', isMovement: true },
        { code: '15', name: 'PROPIEDAD PLANTA Y EQUIPO', nature: 'ACTIVE', level: 2, parentCode: '1' },
        { code: '1524', name: 'EQUIPO DE OFICINA', nature: 'ACTIVE', level: 3, parentCode: '15', isMovement: true },
        { code: '1528', name: 'EQUIPO DE COMPUTACIÓN', nature: 'ACTIVE', level: 3, parentCode: '15', isMovement: true },
        // PASIVOS
        { code: '2', name: 'PASIVO', nature: 'PASSIVE', level: 1 },
        { code: '23', name: 'CUENTAS POR PAGAR', nature: 'PASSIVE', level: 2, parentCode: '2' },
        { code: '2335', name: 'COSTOS Y GASTOS POR PAGAR', nature: 'PASSIVE', level: 3, parentCode: '23', isMovement: true },
        // PATRIMONIO
        { code: '3', name: 'PATRIMONIO', nature: 'PASSIVE', level: 1 },
        { code: '31', name: 'CAPITAL SOCIAL', nature: 'PASSIVE', level: 2, parentCode: '3' },
        { code: '3105', name: 'CAPITAL AUTORIZADO', nature: 'PASSIVE', level: 3, parentCode: '31', isMovement: true },
        // INGRESOS
        { code: '4', name: 'INGRESOS', nature: 'INCOME', level: 1 },
        { code: '41', name: 'INGRESOS OPERACIONALES', nature: 'INCOME', level: 2, parentCode: '4' },
        { code: '4155', name: 'ACTIVIDADES INMOBILIARIAS', nature: 'INCOME', level: 3, parentCode: '41', isMovement: true },
        // GASTOS
        { code: '5', name: 'GASTOS', nature: 'EXPENSE', level: 1 },
        { code: '51', name: 'GASTOS DE ADMINISTRACIÓN', nature: 'EXPENSE', level: 2, parentCode: '5' },
        { code: '5105', name: 'GASTOS DE PERSONAL', nature: 'EXPENSE', level: 3, parentCode: '51', isMovement: true },
        { code: '5110', name: 'HONORARIOS', nature: 'EXPENSE', level: 3, parentCode: '51', isMovement: true },
        { code: '5120', name: 'ARRENDAMIENTOS', nature: 'EXPENSE', level: 3, parentCode: '51', isMovement: true },
        { code: '5135', name: 'SERVICIOS', nature: 'EXPENSE', level: 3, parentCode: '51', isMovement: true },
        { code: '5195', name: 'DIVERSOS', nature: 'EXPENSE', level: 3, parentCode: '51', isMovement: true },
    ];

    const accountMap = new Map<string, number>();

    for (const acc of accountsData) {
        let parentId = null;
        if (acc.parentCode) {
            const parent = await prisma.account.findUnique({ where: { code: acc.parentCode } });
            parentId = parent?.id;
        }
        const created = await prisma.account.create({
            data: { code: acc.code, name: acc.name, nature: acc.nature, level: acc.level, isMovement: acc.isMovement || false, parentId: parentId },
        });
        accountMap.set(acc.code, created.id);
    }
    console.log('✅ Plan de cuentas creado\n');

    // ================= 3. ÁREAS =================
    console.log('🏢 Creando áreas...');
    const areasData = ['Dirección General', 'Contabilidad y Finanzas', 'Recursos Humanos', 'Tecnología (TI)', 'Compras y Adquisiciones', 'Bodega Central'];
    for (const name of areasData) {
        await prisma.area.create({ data: { name } });
    }

    // ================= 4. PROGRAMAS =================
    console.log('📋 Creando programas...');
    const p1 = await prisma.program.create({ data: { code: 'P001', name: 'Fortalecimiento Institucional', isActive: true } });
    await prisma.program.create({ data: { code: 'P002', name: 'Desarrollo Comunitario', isActive: true } });

    console.log('✅ Maestros estructurales creados. \n');
    console.log('✨ Seed completado! Solo Usuarios, Plan de Cuentas, Áreas y Programas básicos.');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
