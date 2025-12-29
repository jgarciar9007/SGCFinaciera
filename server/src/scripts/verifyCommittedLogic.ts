
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Budget Commitment Logic ---');

    // 1. Setup Phase: Create/Get Budget Account
    const budgetCode = 'TEST-999';
    console.log(`1. Setting up Budget Account: ${budgetCode}`);

    // Clean up previous run
    await prisma.budgetTransaction.deleteMany({ where: { budgetAccount: { code: budgetCode } } });
    await prisma.budgetAccount.deleteMany({ where: { code: budgetCode } });
    // Note: We might leave lingering Expenses/POs if we aren't careful, but for dev it's fine or we can cascade delete if schema supported it.

    const budget = await prisma.budgetAccount.create({
        data: {
            code: budgetCode,
            name: 'Test Budget Item for Commitment',
            allocatedAmount: 1000000, // 1 Million
            year: 2025
        }
    });
    console.log(`   Created Budget: ${budget.name} (Allocated: ${budget.allocatedAmount})`);

    // 2. Create User for Requester
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('No users found to act as requester.');
        return;
    }

    // 3. Create Expense Request linked to Budget
    const expenseAmount = 250000;
    console.log(`2. Creating Expense Request for ${expenseAmount} linked to Budget...`);
    const expense = await prisma.expenseRequest.create({
        data: {
            requesterId: user.id,
            description: 'Test Expense for Commitment',
            totalAmount: expenseAmount,
            status: 'APPROVED',
            budgetAccountId: budget.id
        }
    });

    // 4. Create Purchase Order (This triggers the "Commitment" usually)
    // The controller logic sums PurchaseOrders linked to Expenses linked to Budget.
    console.log(`3. Creating Purchase Order linked to Expense...`);
    const po = await prisma.purchaseOrder.create({
        data: {
            expenseRequestId: expense.id,
            supplierName: 'Test Supplier',
            totalAmount: expenseAmount,
            status: 'ISSUED' // or APPROVED/RECEIVED
        }
    });

    // 5. Verify Logic (Simulate BudgetController)
    console.log(`4. Verifying Calculated Fields...`);

    const budgetCheck = await prisma.budgetAccount.findUnique({
        where: { id: budget.id },
        include: {
            expenseRequests: {
                include: { purchaseOrder: true }
            }
        }
    });

    if (!budgetCheck) throw new Error("Budget not found");

    let committed = 0;
    budgetCheck.expenseRequests.forEach(req => {
        if (req.purchaseOrder && req.purchaseOrder.status !== 'REJECTED') {
            committed += req.purchaseOrder.totalAmount.toNumber();
        }
    });

    console.log(`   Expected Committed: ${expenseAmount}`);
    console.log(`   Actual Committed:   ${committed}`);

    if (committed === expenseAmount) {
        console.log('SUCCESS: Committed amount matches Purchase Order.');
    } else {
        console.error('FAILURE: Committed amount mismatch.');
    }

    // 6. Test Alert Logic
    const currentBalance = budgetCheck.allocatedAmount.toNumber(); // No execution yet
    const isAlert = committed > currentBalance;
    console.log(`   Alert Status: ${isAlert} (Expected: false)`);

    // 7. Over-commit
    console.log('5. Testing Over-commitment...');
    const hugeAmount = 2000000;
    const expense2 = await prisma.expenseRequest.create({
        data: {
            requesterId: user.id,
            description: 'Huge Expense',
            totalAmount: hugeAmount,
            status: 'APPROVED',
            budgetAccountId: budget.id
        }
    });
    await prisma.purchaseOrder.create({
        data: {
            expenseRequestId: expense2.id,
            supplierName: 'Big Supplier',
            totalAmount: hugeAmount,
            status: 'ISSUED'
        }
    });

    // Re-calc
    const budgetRecheck = await prisma.budgetAccount.findUnique({
        where: { id: budget.id },
        include: { expenseRequests: { include: { purchaseOrder: true } } }
    });

    let committed2 = 0;
    budgetRecheck?.expenseRequests.forEach(req => {
        if (req.purchaseOrder && req.purchaseOrder.status !== 'REJECTED') {
            committed2 += req.purchaseOrder.totalAmount.toNumber();
        }
    });

    const isAlert2 = committed2 > currentBalance;
    console.log(`   New Committed: ${committed2}`);
    console.log(`   Alert Status: ${isAlert2} (Expected: true)`);

    if (isAlert2) {
        console.log('SUCCESS: Alert triggered correctly.');
    } else {
        console.error('FAILURE: Alert not triggered.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
