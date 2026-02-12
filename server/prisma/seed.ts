import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de la base de datos...\n');

    // Limpiar datos existentes (excepto usuarios admin)
    console.log('🧹 Limpiando datos anteriores...');
    await prisma.budgetTransaction.deleteMany({});
    await prisma.budgetAccount.deleteMany({});
    await prisma.journalLine.deleteMany({});
    await prisma.journalEntry.deleteMany({});
    await prisma.thirdParty.deleteMany({});
    await prisma.payment.deleteMany({}); // Added cleanup for Payment
    await prisma.bankTransaction.deleteMany({}); // Added cleanup
    await prisma.bankAccount.deleteMany({});
    await prisma.bank.deleteMany({});
    await prisma.program.deleteMany({});
    await prisma.area.deleteMany({});
    await prisma.account.deleteMany({});
    console.log('✅ Datos anteriores eliminados\n');

    // 1. USUARIOS
    console.log('👥 Creando usuarios...');
    const password = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            fullName: 'Administrador Sistema',
            password,
            role: 'ADMIN',
        },
    });

    await prisma.user.upsert({
        where: { email: 'contador@example.com' },
        update: {},
        create: {
            email: 'contador@example.com',
            fullName: 'María González - Contador',
            password,
            role: 'ACCOUNTANT',
        },
    });

    await prisma.user.upsert({
        where: { email: 'director@example.com' },
        update: {},
        create: {
            email: 'director@example.com',
            fullName: 'Carlos Rodríguez - Director',
            password,
            role: 'DIRECTOR',
        },
    });

    await prisma.user.upsert({
        where: { email: 'usuario@example.com' },
        update: {},
        create: {
            email: 'usuario@example.com',
            fullName: 'Ana Martínez - Usuario',
            password,
            role: 'USER',
        },
    });

    console.log('✅ Usuarios creados\n');

    // 2. PLAN DE CUENTAS CONTABLES
    console.log('📊 Creando plan de cuentas...');
    const accountsData: Array<{
        code: string;
        name: string;
        nature: 'ACTIVE' | 'PASSIVE' | 'INCOME' | 'EXPENSE';
        level: number;
        parentCode?: string;
        isMovement?: boolean;
    }> = [
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

    for (const acc of accountsData) {
        let parentId = null;
        if (acc.parentCode) {
            const parent = await prisma.account.findUnique({ where: { code: acc.parentCode } });
            parentId = parent?.id;
        }

        await prisma.account.create({
            data: {
                code: acc.code,
                name: acc.name,
                nature: acc.nature,
                level: acc.level,
                isMovement: acc.isMovement || false,
                parentId: parentId,
            },
        });
    }
    console.log('✅ Plan de cuentas creado\n');

    // 3. ÁREAS
    console.log('🏢 Creando áreas...');
    const areasData = [
        'Dirección General',
        'Contabilidad y Finanzas',
        'Recursos Humanos',
        'Tecnología (TI)',
        'Compras y Adquisiciones',
        'Bodega Central'
    ];

    for (const name of areasData) {
        await prisma.area.create({ data: { name } });
    }
    console.log('✅ Áreas creadas\n');

    // 4. PROGRAMAS
    console.log('📋 Creando programas...');
    const programsData = [
        { code: 'P001', name: 'Fortalecimiento Institucional' },
        { code: 'P002', name: 'Desarrollo Comunitario' },
        { code: 'P003', name: 'Infraestructura' },
    ];

    for (const prog of programsData) {
        await prisma.program.create({
            data: {
                code: prog.code,
                name: prog.name,
                isActive: true,
            },
        });
    }
    console.log('✅ Programas creados\n');

    // 5. BANCOS Y CUENTAS BANCARIAS
    console.log('🏦 Creando bancos y cuentas bancarias...');
    await prisma.bank.create({
        data: { name: 'Banco Nacional', swift: 'BNAC123', isActive: true }
    });

    await prisma.bank.create({
        data: { name: 'Banco Internacional', swift: 'BINT456', isActive: true }
    });

    await prisma.bankAccount.create({
        data: {
            name: 'Cuenta Corriente Operativa',
            accountNumber: '1001-2001-3001-4001',
            bankName: 'Banco Nacional',
            currentBalance: new Prisma.Decimal(50000000),
            isActive: true,
        }
    });

    await prisma.bankAccount.create({
        data: {
            name: 'Cuenta de Ahorros',
            accountNumber: '2002-3002-4002-5002',
            bankName: 'Banco Internacional',
            currentBalance: new Prisma.Decimal(25000000),
            isActive: true,
        }
    });

    console.log('✅ Bancos y cuentas creados\n');

    // 6. TERCEROS
    console.log('👔 Creando terceros...');
    await prisma.thirdParty.create({
        data: {
            name: 'Papelería Central S.A.',
            type: 'SUPPLIER',
            // contact removed
            phone: '+237 6 70 00 00 01',
            email: 'ventas@papeleriacentral.com',
            isActive: true,
        }
    });

    await prisma.thirdParty.create({
        data: {
            name: 'Servicios Tecnológicos Ltd.',
            type: 'SUPPLIER',
            // contact removed
            phone: '+237 6 70 00 00 02',
            email: 'info@servitec.com',
            isActive: true,
        }
    });

    await prisma.thirdParty.create({
        data: {
            name: 'Cliente Corporativo A',
            type: 'CLIENT',
            // contact removed
            phone: '+237 6 70 00 01 01',
            email: 'ana@clientea.com',
            isActive: true,
        }
    });

    console.log('✅ Terceros creados\n');

    // 7. PRESUPUESTO
    console.log('💰 Creando cuentas presupuestales...');
    await prisma.budgetAccount.create({
        data: {
            code: 'BP-001',
            name: 'Nómina y Salarios',
            year: 2026,
            allocatedAmount: new Prisma.Decimal(120000000),
            transactions: {
                create: {
                    amount: new Prisma.Decimal(120000000),
                    description: 'Asignación Inicial 2026',
                    referenceType: 'INITIAL',
                }
            }
        }
    });

    await prisma.budgetAccount.create({
        data: {
            code: 'BP-002',
            name: 'Gastos Generales y Servicios',
            year: 2026,
            allocatedAmount: new Prisma.Decimal(40000000),
            transactions: {
                create: {
                    amount: new Prisma.Decimal(40000000),
                    description: 'Asignación Inicial 2026',
                    referenceType: 'INITIAL',
                }
            }
        }
    });

    console.log('✅ Presupuesto creado\n');

    console.log('✨ Seed completado exitosamente!\n');
    console.log('📝 Credenciales de acceso:');
    console.log('   Admin:     admin@example.com / admin123');
    console.log('   Contador:  contador@example.com / admin123');
    console.log('   Director:  director@example.com / admin123');
    console.log('   Usuario:   usuario@example.com / admin123\n');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
