import prisma from '../utils/prisma';

interface JournalLineInput {
    accountCode: string;
    debit?: number;
    credit?: number;
    description?: string;
    thirdPartyId?: number;
}

interface JournalEntryInput {
    date: Date;
    description: string;
    reference?: string;
    lines: JournalLineInput[];
}

export class AccountingService {
    /**
     * Crear asiento contable en el diario
     * Valida que débitos = créditos
     */
    async createJournalEntry(data: JournalEntryInput) {
        // Validar balance
        const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Asiento desbalanceado: Débito=${totalDebit}, Crédito=${totalCredit}`);
        }

        // Obtener IDs de cuentas
        const accountCodes = data.lines.map(l => l.accountCode);
        const accounts = await prisma.account.findMany({
            where: { code: { in: accountCodes } }
        });

        if (accounts.length !== accountCodes.length) {
            const foundCodes = accounts.map(a => a.code);
            const missingCodes = accountCodes.filter(c => !foundCodes.includes(c));
            throw new Error(`Cuentas no encontradas: ${missingCodes.join(', ')}`);
        }

        // Validar que sean cuentas de movimiento
        const nonMovementAccounts = accounts.filter(a => !a.isMovement);
        if (nonMovementAccounts.length > 0) {
            throw new Error(`Las siguientes cuentas no son de movimiento: ${nonMovementAccounts.map(a => a.code).join(', ')}`);
        }

        // Crear asiento
        const entry = await prisma.journalEntry.create({
            data: {
                date: data.date,
                description: data.description,
                reference: data.reference,
                status: 'POSTED',
                lines: {
                    create: data.lines.map(line => {
                        const account = accounts.find(a => a.code === line.accountCode)!;
                        return {
                            accountId: account.id,
                            debit: line.debit || 0,
                            credit: line.credit || 0,
                            description: line.description,
                            thirdPartyId: line.thirdPartyId,
                        };
                    })
                }
            },
            include: {
                lines: {
                    include: {
                        account: true,
                        thirdParty: true
                    }
                }
            }
        });

        console.log(`✅ Asiento contable creado: ${entry.description}`);
        return entry;
    }

    /**
     * Registrar devengo de factura
     * Crea asiento: Débito Gasto, Crédito Cuentas por Pagar
     * Mueve presupuesto de comprometido a devengado
     */
    async recordInvoiceAccrual(invoice: any, expenseAccountCode: string = '5195') {
        const amount = Number(invoice.totalAmount);

        // Resolve ThirdParty ID
        let thirdPartyId = invoice.supplierId ? Number(invoice.supplierId) : undefined;
        if (!thirdPartyId && invoice.supplierName) {
            const tp = await prisma.thirdParty.findFirst({
                where: { name: invoice.supplierName }
            });
            if (tp) thirdPartyId = tp.id;
        }

        await this.createJournalEntry({
            date: new Date(invoice.date),
            description: `Factura ${invoice.number} - ${invoice.supplierName}`,
            reference: invoice.number,
            lines: [
                {
                    accountCode: expenseAccountCode, // Gasto
                    debit: amount,
                    description: invoice.description || 'Gasto por factura',
                    thirdPartyId: thirdPartyId
                },
                {
                    accountCode: '2335', // Cuentas por Pagar
                    credit: amount,
                    description: 'Cuenta por pagar',
                    thirdPartyId: thirdPartyId
                }
            ]
        });

        // Mover presupuesto si está vinculado a una OC
        // TODO: Implementar cuando se agregue budgetAccountId a PurchaseOrder schema
        /*
        if (invoice.purchaseOrderId) {
            const po = await prisma.purchaseOrder.findUnique({
                where: { id: invoice.purchaseOrderId }
            });

            if (po && po.budgetAccountId) {
                await this.moveBudgetToExecuted(
                    po.budgetAccountId,
                    amount,
                    `Devengo Factura ${invoice.number}`
                );
            }
        }
        */

        console.log(`✅ Devengo registrado para factura ${invoice.number}`);
    }

    /**
     * Registrar pago de factura
     * Crea asiento: Débito Cuentas por Pagar, Crédito Bancos
     * Actualiza saldo de cuenta bancaria
     */
    async recordInvoicePayment(
        invoice: any,
        bankAccountId: number,
        paymentRef?: string,
        paymentDate?: Date
    ) {
        return await prisma.$transaction(async (tx) => {
            // Obtener cuenta bancaria
            const bankAccount = await tx.bankAccount.findUnique({
                where: { id: bankAccountId }
            });

            if (!bankAccount) {
                throw new Error('Cuenta bancaria no encontrada');
            }

            if (!bankAccount.isActive) {
                throw new Error('Cuenta bancaria inactiva');
            }

            const amount = Number(invoice.totalAmount);

            if (Number(bankAccount.currentBalance) < amount) {
                throw new Error(
                    `Saldo insuficiente. Disponible: ${bankAccount.currentBalance} FCFA, Requerido: ${amount} FCFA`
                );
            }

            // Resolve ThirdParty ID
            let thirdPartyId = invoice.supplierId ? Number(invoice.supplierId) : undefined;
            if (!thirdPartyId && invoice.supplierName) {
                const tp = await tx.thirdParty.findFirst({
                    where: { name: invoice.supplierName }
                });
                if (tp) thirdPartyId = tp.id;
            }

            // Crear asiento contable
            await this.createJournalEntry({
                date: paymentDate || new Date(),
                description: `Pago Factura ${invoice.number} - ${invoice.supplierName}`,
                reference: paymentRef || `Pago-${invoice.number}`,
                lines: [
                    {
                        accountCode: '2335', // Cuentas por Pagar
                        debit: amount,
                        description: 'Pago de cuenta por pagar',
                        thirdPartyId: thirdPartyId
                    },
                    {
                        accountCode: '1110', // Bancos
                        credit: amount,
                        description: `Pago desde ${bankAccount.name}`,
                    }
                ]
            });

            // Actualizar saldo de cuenta bancaria
            const newBalance = Number(bankAccount.currentBalance) - amount;
            await tx.bankAccount.update({
                where: { id: bankAccountId },
                data: { currentBalance: newBalance }
            });

            // Registrar transacción bancaria
            await tx.bankTransaction.create({
                data: {
                    bankAccountId: bankAccountId,
                    type: 'EXPENSE',
                    amount: -amount,
                    description: `Pago Factura ${invoice.number} - ${invoice.supplierName}`,
                    reference: paymentRef,
                    date: paymentDate || new Date(),
                }
            });

            // Registrar pago en tabla Payment (para historial)
            await tx.payment.create({
                data: {
                    invoiceId: invoice.id,
                    bankAccountId: bankAccountId,
                    amount: amount,
                    reference: paymentRef,
                    date: paymentDate || new Date(),
                    status: 'PENDING'
                }
            });

            // Actualizar estado de factura
            await tx.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: 'PAID'
                    // TODO: Add paidDate field to Invoice schema
                }
            });

            console.log(`✅ Pago registrado para factura ${invoice.number}. Nuevo saldo: ${newBalance} FCFA`);

            return {
                success: true,
                newBalance,
                invoice: { ...invoice, status: 'PAID' }
            };
        });
    }

    /**
     * Conciliar pago de factura
     * Marca el pago como conciliado y ejecuta el presupuesto
     */
    async reconcilePayment(paymentId: number) {
        return await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: { id: paymentId },
                include: {
                    invoice: {
                        include: {
                            purchaseOrder: {
                                include: {
                                    expenseRequest: true // Include Expense Linked to PO
                                }
                            }
                        }
                    }
                }
            });

            if (!payment) throw new Error('Pago no encontrado');
            if (payment.status === 'RECONCILED') throw new Error('Pago ya conciliado');

            // 1. Marcar como conciliado
            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'RECONCILED',
                    reconciledAt: new Date()
                }
            });

            // 2. Mover presupuesto (Si hay OC vinculada)
            const po = payment.invoice.purchaseOrder;
            if (po) {
                // Fallback: Use PO's budgetAccountId OR Expense's budgetAccountId
                const budgetAccountId = po.budgetAccountId || po.expenseRequest?.budgetAccountId;

                if (budgetAccountId) {
                    await this.moveBudgetToExecuted(
                        budgetAccountId,
                        Number(payment.amount),
                        `Ejecución por Pago Conciliado #${payment.id} (Factura ${payment.invoice.number})`
                    );
                } else {
                    console.warn(`⚠️ Pago #${payment.id} conciliado pero sin cuenta presupuestal vinculada (OC #${po.id})`);
                }
            }

            console.log(`✅ Pago #${paymentId} conciliado correctamente`);
            return updatedPayment;
        });
    }

    /**
     * Mover presupuesto de comprometido a devengado
     */
    async moveBudgetToExecuted(budgetAccountId: number, amount: number, description: string) {
        await prisma.budgetTransaction.create({
            data: {
                budgetAccountId,
                amount: -amount, // Negativo para restar del comprometido
                description,
                referenceType: 'EXECUTION'
            }
        });

        console.log(`✅ Presupuesto movido a devengado: ${amount} FCFA`);
    }

    /**
     * Comprometer presupuesto al crear OC
     */
    async commitBudget(budgetAccountId: number, amount: number, description: string) {
        await prisma.budgetTransaction.create({
            data: {
                budgetAccountId,
                amount: -amount, // Negativo para comprometer
                description,
                referenceType: 'COMMITMENT'
            }
        });

        console.log(`✅ Presupuesto comprometido: ${amount} FCFA`);
    }

    /**
     * Obtener libro mayor (ledger) para una cuenta
     */
    async getAccountLedger(accountId: number, startDate?: Date, endDate?: Date) {
        const account = await prisma.account.findUnique({
            where: { id: accountId }
        });

        if (!account) {
            throw new Error('Cuenta no encontrada');
        }

        const where: any = { accountId };
        if (startDate || endDate) {
            where.journalEntry = {};
            if (startDate) where.journalEntry.date = { gte: startDate };
            if (endDate) where.journalEntry.date = { ...where.journalEntry.date, lte: endDate };
        }

        const lines = await prisma.journalLine.findMany({
            where,
            include: {
                journalEntry: true,
                account: true,
                thirdParty: true
            },
            orderBy: {
                journalEntry: {
                    date: 'asc'
                }
            }
        });

        let balance = 0;
        const entries = lines.map(line => {
            const debit = Number(line.debit);
            const credit = Number(line.credit);

            // Calculate running balance based on account nature
            if (account.nature === 'ACTIVE' || account.nature === 'EXPENSE') {
                balance += debit - credit;
            } else {
                balance += credit - debit;
            }

            return {
                date: line.journalEntry.date,
                description: line.journalEntry.description,
                reference: line.journalEntry.reference,
                debit,
                credit,
                balance
            };
        });

        return {
            account,
            entries,
            finalBalance: balance
        };
    }
}

export const accountingService = new AccountingService();
