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
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' }, update: {},
        create: { email: 'admin@example.com', fullName: 'Administrador Sistema', password, role: 'ADMIN' },
    });
    const accountant = await prisma.user.upsert({
        where: { email: 'contador@example.com' }, update: {},
        create: { email: 'contador@example.com', fullName: 'María González - Contador', password, role: 'ACCOUNTANT' },
    });
    const director = await prisma.user.upsert({
        where: { email: 'director@example.com' }, update: {},
        create: { email: 'director@example.com', fullName: 'Carlos Rodríguez - Director', password, role: 'DIRECTOR' },
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

    // ================= 5. BANCOS =================
    console.log('🏦 Creando bancos...');
    await prisma.bank.create({ data: { name: 'Banco Nacional', swift: 'BNAC123', isActive: true } });
    await prisma.bank.create({ data: { name: 'Banco Internacional', swift: 'BINT456', isActive: true } });

    const bankAccount = await prisma.bankAccount.create({
        data: { name: 'Cuenta Corriente Operativa', accountNumber: '1001-2001-3001-4001', bankName: 'Banco Nacional', currentBalance: new Prisma.Decimal(500000000), isActive: true }
    });

    // ================= 6. TERCEROS =================
    console.log('👔 Creando terceros...');
    const supplier1 = await prisma.thirdParty.create({ data: { name: 'Papelería Central S.A.', type: 'SUPPLIER', phone: '3001234567', email: 'ventas@papeleriacentral.com', isActive: true } });
    const supplier2 = await prisma.thirdParty.create({ data: { name: 'Servicios Tecnológicos Ltd.', type: 'SUPPLIER', phone: '3009876543', email: 'info@servitec.com', isActive: true } });
    const supplier3 = await prisma.thirdParty.create({ data: { name: 'Muebles y Enseres SAS', type: 'SUPPLIER', phone: '3105556677', email: 'contacto@muebles.com', isActive: true } });

    // ================= 7. PRESUPUESTO =================
    console.log('💰 Creando cuentas presupuestales...');
    const budget1 = await prisma.budgetAccount.create({
        data: { code: 'BP-001', name: 'Nómina y Salarios', year: 2026, allocatedAmount: new Prisma.Decimal(500000000), transactions: { create: { amount: new Prisma.Decimal(500000000), description: 'Asignación Inicial 2026', referenceType: 'INITIAL' } } }
    });
    const budget2 = await prisma.budgetAccount.create({
        data: { code: 'BP-002', name: 'Gastos Generales', year: 2026, allocatedAmount: new Prisma.Decimal(200000000), transactions: { create: { amount: new Prisma.Decimal(200000000), description: 'Asignación Inicial 2026', referenceType: 'INITIAL' } } }
    });
    const budget3 = await prisma.budgetAccount.create({
        data: { code: 'BP-003', name: 'Equipos y Tecnología', year: 2026, allocatedAmount: new Prisma.Decimal(300000000), transactions: { create: { amount: new Prisma.Decimal(300000000), description: 'Asignación Inicial 2026', referenceType: 'INITIAL' } } }
    });

    console.log('✅ Maestros creados. Iniciando Transacciones...\n');

    // ================= HELPER: CREATE FULL TRANSACTION =================
    async function createTransaction(
        date: Date,
        desc: string,
        amount: number,
        supplier: any,
        budget: any,
        expenseType: 'SERVICE' | 'GOODS' | 'ASSET',
        stage: 'PO_ONLY' | 'UNPAID' | 'FULL', // New parameter to control lifecycle
        assetName?: string
    ) {
        // 1. Expense Request
        const expense = await prisma.expenseRequest.create({
            data: {
                requesterId: user.id, approverId: director.id, status: 'APPROVED',
                description: desc, totalAmount: new Prisma.Decimal(amount),
                budgetAccountId: budget.id,
                createdAt: date, updatedAt: date,
                items: { create: [{ description: 'Item Principal', quantity: 1, unitPrice: amount, totalPrice: amount }] }
            }
        });

        // 2. Purchase Order
        // If PO_ONLY, status is ISSUED or PENDING, not RECEIVED
        const poStatus = stage === 'PO_ONLY' ? 'ISSUED' : 'RECEIVED';
        const po = await prisma.purchaseOrder.create({
            data: {
                expenseRequestId: expense.id, supplierName: supplier.name, supplierTaxId: '900.000.000',
                status: poStatus, totalAmount: new Prisma.Decimal(amount), budgetAccountId: budget.id,
                date: date,
                // Only add reception if RECEIVED
                receptions: poStatus === 'RECEIVED' ? { create: { date: date, note: 'Recibido a satisfacción' } } : undefined
            }
        });

        if (stage === 'PO_ONLY') {
            console.log(`   🔸 Op. Pendiente (Solo OC): ${desc} ($${amount})`);
            return;
        }

        // 3. Invoice
        const dueDate = new Date(date);
        dueDate.setDate(dueDate.getDate() + 30);

        // If UNPAID, status is UNPAID
        const invStatus = stage === 'UNPAID' ? 'UNPAID' : 'PAID';
        const invoice = await prisma.invoice.create({
            data: {
                purchaseOrderId: po.id,
                number: `FAC-${Math.floor(Math.random() * 10000)}`,
                supplierName: supplier.name, date: date, dueDate: dueDate,
                totalAmount: new Prisma.Decimal(amount), status: invStatus
            }
        });

        // Journal Entry for Accrual (Causación) happens when Invoice is registered
        let debitAccount = accountMap.get('5195'); // Default Diversos
        if (expenseType === 'SERVICE') debitAccount = accountMap.get('5135');
        if (expenseType === 'ASSET') debitAccount = accountMap.get('1524');

        await prisma.journalEntry.create({
            data: {
                date: date, description: `Causación Factura ${invoice.number} - ${desc}`, status: 'POSTED',
                lines: {
                    create: [
                        { accountId: debitAccount!, description: desc, debit: amount, credit: 0 },
                        { accountId: accountMap.get('2335')!, description: 'Cuentas por Pagar', debit: 0, credit: amount }
                    ]
                }
            }
        });

        if (stage === 'UNPAID') {
            console.log(`   🔸 Op. Pendiente (Facturado sin pagar): ${desc} ($${amount})`);
            return;
        }

        // 4. Payment (Only if FULL)
        const payDate = new Date(date);
        payDate.setDate(payDate.getDate() + 5);

        await prisma.payment.create({
            data: {
                invoiceId: invoice.id, bankAccountId: bankAccount.id, amount: new Prisma.Decimal(amount),
                reference: `TF-${Math.floor(Math.random() * 100000)}`, status: 'RECONCILED', reconciledAt: payDate, date: payDate
            }
        });

        // 5. Update Bank Balance
        await prisma.bankAccount.update({ where: { id: bankAccount.id }, data: { currentBalance: { decrement: amount } } });

        // 6. Record Bank Transaction
        await prisma.bankTransaction.create({
            data: {
                bankAccountId: bankAccount.id, type: 'WITHDRAWAL', amount: new Prisma.Decimal(amount),
                description: `Pago Factura ${invoice.number} - ${supplier.name}`, date: payDate, reference: `TF-${Math.floor(Math.random() * 100000)}`
            }
        });

        // 7. Budget Transaction
        // CORRECTED: referenceType is 'EXECUTION' to trigger dashboard logic
        await prisma.budgetTransaction.create({
            data: {
                budgetAccountId: budget.id, amount: new Prisma.Decimal(amount).negated(),
                description: `Ejecución Factura ${invoice.number}`, referenceType: 'EXECUTION', referenceId: invoice.id, date: date
            }
        });

        // 8. Accounting Journal (Payment)
        await prisma.journalEntry.create({
            data: {
                date: payDate, description: `Pago Factura ${invoice.number}`, status: 'POSTED',
                lines: {
                    create: [
                        { accountId: accountMap.get('2335')!, description: 'Cancelación CXP', debit: amount, credit: 0 },
                        { accountId: accountMap.get('1110')!, description: 'Salida Banco', debit: 0, credit: amount }
                    ]
                }
            }
        });

        // 10. Assets
        if (expenseType === 'ASSET' && assetName) {
            await prisma.asset.create({
                data: {
                    code: `ACT-${Math.floor(Math.random() * 1000)}`, name: assetName, description: desc,
                    purchaseDate: date, unitValue: new Prisma.Decimal(amount), quantity: 1,
                    location: 'Oficina Principal', status: 'ACTIVE', purchaseOrderId: po.id, invoiceId: invoice.id
                }
            });
        }

        console.log(`   ✅ Op. COMPLETADA: ${date.toISOString().split('T')[0]} - ${desc} ($${amount})`);
    }

    // ================= GENERATE DATA (MIXED STATES) =================

    // --- ENERO 2026 ---
    console.log('\n📅 Generando operaciones ENERO 2026...');
    await createTransaction(new Date('2026-01-05'), 'Suministros Aseo', 450000, supplier1, budget2, 'GOODS', 'FULL');
    await createTransaction(new Date('2026-01-10'), 'Mant. Aires', 1200000, supplier2, budget2, 'SERVICE', 'FULL');
    await createTransaction(new Date('2026-01-15'), 'Sillas Ergonómicas', 3500000, supplier3, budget1, 'ASSET', 'FULL', 'Silla Gerencial');
    // Pending items in Jan? usually cleared by now, but let's leave one unpaid/late
    await createTransaction(new Date('2026-01-25'), 'Papelería Pendiente', 600000, supplier1, budget2, 'GOODS', 'UNPAID');

    // --- FEBRERO 2026 ---
    console.log('\n📅 Generando operaciones FEBRERO 2026...');
    await createTransaction(new Date('2026-02-02'), 'Licencias Software', 5000000, supplier2, budget3, 'SERVICE', 'FULL');
    await createTransaction(new Date('2026-02-08'), 'Computador Portátil', 4200000, supplier2, budget3, 'ASSET', 'FULL', 'Laptop HP');
    // Pending items in Feb
    await createTransaction(new Date('2026-02-14'), 'Material Didáctico', 1500000, supplier1, budget1, 'GOODS', 'PO_ONLY');
    await createTransaction(new Date('2026-02-20'), 'Arrendamiento Impresoras', 900000, supplier2, budget2, 'SERVICE', 'UNPAID');
    await createTransaction(new Date('2026-02-22'), 'Muebles Recepción (En Proceso)', 2800000, supplier3, budget1, 'ASSET', 'PO_ONLY', 'Escritorio L');
    await createTransaction(new Date('2026-02-25'), 'Consultoría TI (Finales Feb)', 3000000, supplier2, budget3, 'SERVICE', 'FULL');

    console.log('\n✨ Seed completado! Operaciones mixtas (Completas y Pendientes) generadas.');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
