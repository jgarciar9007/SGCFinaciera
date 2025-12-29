

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JSON_PATH = path.join(__dirname, '../../../maestros/lineas_2025_aefpres.json');

interface BudgetLineRaw {
    model: string;
    pk: number;
    fields: {
        presupuesto: number;
        descripcion: string;
        programa: number;
        partida: number; // Mapping to code
        fuente: number;
        credito_inicial: string; // "217271000.00"
    }
}

async function main() {
    console.log('Seeding Budget Accounts from:', JSON_PATH);

    try {
        const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
        const items: BudgetLineRaw[] = JSON.parse(rawData);

        console.log(`Found ${items.length} items to process.`);

        for (const item of items) {
            const code = item.fields.partida.toString();
            const name = item.fields.descripcion;
            const allocatedAmount = parseFloat(item.fields.credito_inicial);
            const year = 2025; // Hardcoded content from filename/context

            // Upsert
            await prisma.budgetAccount.upsert({
                where: { code },
                update: {
                    name,
                    allocatedAmount,
                    year
                },
                create: {
                    code,
                    name,
                    allocatedAmount,
                    year
                }
            });
        }

        console.log('Budget seeding completed successfully.');

    } catch (error) {
        console.error('Error seeding budget:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
