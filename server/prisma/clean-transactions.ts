import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTransactions() {
    console.log('🧹 Limpiando datos transaccionales...\n');

    try {
        // Usar TRUNCATE CASCADE para eliminar todas las tablas transaccionales
        // Esto ignora las foreign keys y es más rápido

        console.log('🗑️  Truncando tablas transaccionales...');

        await prisma.$executeRawUnsafe(`
            TRUNCATE TABLE 
                "JournalLine",
                "JournalEntry",
                "BankTransaction",
                "Payment",
                "Invoice",
                "PurchaseOrder",
                "ExpenseRequest",
                "Asset"
            CASCADE;
        `);

        console.log('   ✓ Todas las tablas transaccionales limpiadas');

        console.log('\n🔄 Reseteando saldos bancarios...');
        await prisma.bankAccount.updateMany({
            where: { name: 'Cuenta Corriente' },
            data: { currentBalance: 50000000 }
        });
        await prisma.bankAccount.updateMany({
            where: { name: 'Cuenta de Ahorros' },
            data: { currentBalance: 25000000 }
        });
        await prisma.bankAccount.updateMany({
            where: { name: 'Cuenta Nómina' },
            data: { currentBalance: 10000000 }
        });
        console.log('   ✓ Saldos bancarios reseteados');

        console.log('\n✅ Limpieza completada exitosamente!\n');
        console.log('📋 Datos preservados (nomencladores):');
        console.log('   ✓ Usuarios');
        console.log('   ✓ Plan de cuentas contables');
        console.log('   ✓ Áreas');
        console.log('   ✓ Programas');
        console.log('   ✓ Bancos y cuentas bancarias');
        console.log('   ✓ Terceros (proveedores/clientes)');
        console.log('   ✓ Cuentas presupuestarias\n');

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

cleanTransactions()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
