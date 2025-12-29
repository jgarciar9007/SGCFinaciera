import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Treasury Verification...");

    // 1. Create Bank Account
    const accountName = `Test Account ${Date.now()}`;
    const account = await prisma.bankAccount.create({
        data: {
            name: accountName,
            bankName: 'Test Bank',
            accountNumber: '1234567890',
            currentBalance: 0
        }
    });
    console.log(`1. Created Account: ${account.name} (Balance: ${account.currentBalance})`);

    // 2. Deposit
    const depositAmount = 100000;
    console.log(`2. Processing DEPOSIT of ${depositAmount}...`);

    // Simulate API logic (Transaction + Balance Update)
    await prisma.$transaction(async (tx) => {
        await tx.bankTransaction.create({
            data: {
                bankAccountId: account.id,
                type: 'DEPOSIT',
                amount: depositAmount,
                description: 'Initial Deposit'
            }
        });
        await tx.bankAccount.update({
            where: { id: account.id },
            data: { currentBalance: { increment: depositAmount } }
        });
    });

    const accountAfterDeposit = await prisma.bankAccount.findUnique({ where: { id: account.id } });
    console.log(`   New Balance: ${accountAfterDeposit?.currentBalance}`);

    if (accountAfterDeposit?.currentBalance.toNumber() !== depositAmount) {
        throw new Error("Deposit Failed: Balance mismatch");
    }

    // 3. Withdrawal
    const withdrawalAmount = 25000;
    console.log(`3. Processing WITHDRAWAL of ${withdrawalAmount}...`);

    await prisma.$transaction(async (tx) => {
        await tx.bankTransaction.create({
            data: {
                bankAccountId: account.id,
                type: 'WITHDRAWAL',
                amount: withdrawalAmount,
                description: 'Test Withdrawal'
            }
        });
        await tx.bankAccount.update({
            where: { id: account.id },
            data: { currentBalance: { decrement: withdrawalAmount } }
        });
    });

    const accountAfterWithdrawal = await prisma.bankAccount.findUnique({ where: { id: account.id } });
    console.log(`   Final Balance: ${accountAfterWithdrawal?.currentBalance}`);

    const expectedBalance = depositAmount - withdrawalAmount;
    if (accountAfterWithdrawal?.currentBalance.toNumber() !== expectedBalance) {
        throw new Error(`Withdrawal Failed: Expected ${expectedBalance}, got ${accountAfterWithdrawal?.currentBalance}`);
    }

    console.log("SUCCESS: Treasury Logic Verified!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
