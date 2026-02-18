const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    console.log('🔍 Verifying Clean Database State...');

    const counts = {
        User: await prisma.user.count(),
        Account: await prisma.account.count(), // Plan de Cuentas
        Area: await prisma.area.count(),
        Program: await prisma.program.count(),
        // Should be zero
        Bank: await prisma.bank.count(),
        BankAccount: await prisma.bankAccount.count(),
        ThirdParty: await prisma.thirdParty.count(),
        BudgetAccount: await prisma.budgetAccount.count(),
        Transaction: await prisma.budgetTransaction.count(),
        Invoice: await prisma.invoice.count(),
        Payment: await prisma.payment.count(),
        ExpenseRequest: await prisma.expenseRequest.count(),
        PurchaseOrder: await prisma.purchaseOrder.count(),
        Asset: await prisma.asset.count(),
    };

    console.table(counts);

    const hasExamples =
        counts.Bank > 0 ||
        counts.ThirdParty > 0 ||
        counts.BudgetAccount > 0 ||
        counts.Invoice > 0;

    if (hasExamples) {
        console.error('❌ FAILED: Example data still exists!');
    } else {
        console.log('✅ SUCCESS: Database is clean. Only Users, Accounts, Areas, and Programs exist.');
    }
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
