import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const MAESTROS_DIR = path.join(__dirname, '../../maestros');

async function seedMasters() {
    console.log('Starting Masters Seeding...');

    // 1. Terceros (ThirdParties)
    try {
        const data = JSON.parse(fs.readFileSync(path.join(MAESTROS_DIR, 'terceros.json'), 'utf-8'));
        console.log(`Seeding ${data.length} ThirdParties...`);
        for (const item of data) {
            const f = item.fields;
            await prisma.thirdParty.create({
                data: {
                    type: f.tipo,
                    identification: f.identificacion,
                    name: f.nombre,
                    email: f.email,
                    phone: f.telefono,
                    address: f.direccion,
                    isActive: f.activo
                }
            });
        }
    } catch (e) { console.error('Error seeding Terceros:', e); }

    // 2. Programas (Programs)
    try {
        const data = JSON.parse(fs.readFileSync(path.join(MAESTROS_DIR, 'programas.json'), 'utf-8'));
        console.log(`Seeding ${data.length} Programs...`);
        for (const item of data) {
            const f = item.fields;
            await prisma.program.create({
                data: {
                    code: f.codigo,
                    name: f.nombre,
                    isActive: f.activo
                }
            });
        }
    } catch (e) { console.error('Error seeding Programas:', e); }

    // 3. Bancos (Banks)
    try {
        const data = JSON.parse(fs.readFileSync(path.join(MAESTROS_DIR, 'bancos_base.json'), 'utf-8'));
        console.log(`Seeding ${data.length} Banks...`);
        for (const item of data) {
            const f = item.fields;
            await prisma.bank.create({
                data: {
                    name: f.nombre,
                    swift: f.swift,
                    isActive: f.activo
                }
            });
        }
    } catch (e) { console.error('Error seeding Banks:', e); }

    // 4. Accounts (Plan Contable)
    try {
        const data = JSON.parse(fs.readFileSync(path.join(MAESTROS_DIR, 'plan_basico.json'), 'utf-8'));
        console.log(`Seeding ${data.length} Accounts...`);

        // Map pk (from JSON) to DB ID
        const pkMap = new Map<number, number>();

        // Pass 1: Create accounts without parent
        for (const item of data) {
            const f = item.fields;
            const account = await prisma.account.create({
                data: {
                    code: f.codigo,
                    name: f.nombre,
                    level: f.nivel,
                    nature: f.naturaleza,
                    isMovement: f.es_movimiento,
                    // parentId: null initially
                }
            });
            pkMap.set(item.pk, account.id);
        }

        // Pass 2: Update parents
        for (const item of data) {
            const f = item.fields;
            if (f.padre) {
                // Find parent DB ID
                // Note: f.padre in JSON refers to the 'pk' of the parent
                // In the JSON example: child has {"padre": 10}, parent has "pk": 10
                // Wait, the JSON view showed: {"padre": 1} or {"padre": "12"} in some lines (quoted vs unquoted).
                // Let's handle both string and number parsing if needed.
                // Actually line 90: "padre": "6". Line 3: "padre": 1.

                let parentPk = Number(f.padre);
                const parentId = pkMap.get(parentPk);
                const childId = pkMap.get(item.pk);

                if (parentId && childId) {
                    await prisma.account.update({
                        where: { id: childId },
                        data: { parentId: parentId }
                    });
                }
            }
        }

    } catch (e) { console.error('Error seeding Accounts:', e); }

    console.log('Seeding completed.');
}

seedMasters()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
