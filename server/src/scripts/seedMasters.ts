
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const MAESTROS_DIR = path.join(__dirname, '../../../maestros');

async function main() {
    console.log('--- Seeding Master Data ---');

    // 1. Seed Third Parties
    console.log('1. Seeding Third Parties...');
    const tercerosPath = path.join(MAESTROS_DIR, 'terceros.json');
    if (fs.existsSync(tercerosPath)) {
        const terceros = JSON.parse(fs.readFileSync(tercerosPath, 'utf-8'));
        for (const t of terceros) {
            const { tipo, identificacion, nombre, email, telefono, direccion, activo } = t.fields;
            await prisma.thirdParty.upsert({
                where: { id: -1 }, // Use create/update logic via findFirst equivalent or just Create if not exists logic manually? 
                // Prisma upsert needs unique constraint. ThirdParty doesn't seem to have unique taxId enforced in schema shown?
                // Let's use createMany or check existence.
                update: {},
                create: {
                    type: tipo,
                    identification: identificacion,
                    name: nombre,
                    email: email || null,
                    phone: telefono || null,
                    address: direccion || null,
                    isActive: activo
                }
            }).catch(async () => {
                // Fallback if upsert fails on ID, just try find and create
                const exists = await prisma.thirdParty.findFirst({ where: { name: nombre } });
                if (!exists) {
                    await prisma.thirdParty.create({
                        data: {
                            type: tipo,
                            identification: identificacion,
                            name: nombre,
                            email: email || null,
                            phone: telefono || null,
                            address: direccion || null,
                            isActive: activo
                        }
                    });
                }
            });
        }
        console.log(`   Processed ${terceros.length} third parties.`);
    }

    // 2. Seed Banks
    console.log('2. Seeding Banks...');
    const bancosPath = path.join(MAESTROS_DIR, 'bancos_base.json');
    if (fs.existsSync(bancosPath)) {
        const bancos = JSON.parse(fs.readFileSync(bancosPath, 'utf-8'));
        for (const b of bancos) {
            const { nombre, swift, activo } = b.fields;
            const exists = await prisma.bank.findFirst({ where: { swift: swift } });
            if (!exists) {
                await prisma.bank.create({
                    data: {
                        name: nombre,
                        swift: swift,
                        isActive: activo
                    }
                });
            }
        }
        console.log(`   Processed ${bancos.length} banks.`);
    }

    // 3. Seed Programs
    console.log('3. Seeding Programs...');
    const programasPath = path.join(MAESTROS_DIR, 'programas.json');
    if (fs.existsSync(programasPath)) {
        const programas = JSON.parse(fs.readFileSync(programasPath, 'utf-8'));
        for (const p of programas) {
            const { codigo, nombre, activo } = p.fields;
            await prisma.program.upsert({
                where: { code: codigo },
                update: { name: nombre, isActive: activo },
                create: {
                    code: codigo,
                    name: nombre,
                    isActive: activo
                }
            });
        }
        console.log(`   Processed ${programas.length} programs.`);
    }

    // 4. Seed Accounts (Hierarchical)
    console.log('4. Seeding Accounts...');
    const planPath = path.join(MAESTROS_DIR, 'plan_basico.json');
    if (fs.existsSync(planPath)) {
        const accounts = JSON.parse(fs.readFileSync(planPath, 'utf-8'));

        // Sort by code length or level to ensure parents exist first?
        // Assuming the JSON is ordered or we should sort it.
        // JSON seems ordered by code roughly, but levels are mixed? No, looks like 1, 10, 11...
        // Sorting by code is safest for hierarchy if code contains parent code.

        accounts.sort((a: any, b: any) => a.fields.codigo.localeCompare(b.fields.codigo));

        for (const a of accounts) {
            const { codigo, nombre, nivel, naturaleza, padre, es_movimiento } = a.fields;

            let parentId = null;
            if (padre) {
                const parentCode = String(padre); // padre in JSON is '1' or 1.
                // We need to find the parent ID by Code
                const parentAcc = await prisma.account.findUnique({
                    where: { code: parentCode }
                });
                if (parentAcc) parentId = parentAcc.id;
            }

            // Check if explicit numeric parent ID in JSON is usable? 
            // 'pk' in JSON is distinct from 'code'. 'padre' refers to 'pk' usually in relational dumps.
            // Let's look at the JSON:
            // { "pk":1, "fields": { "codigo": "1", ... "padre": null } }
            // { "pk":10, "fields": { "codigo": "10", ... "padre": 1 } }
            // Ah! 'padre' refers to the PK of the parent in the JSON.
            // I need a mapping of JSON PK -> DB ID.
        }

        // Pass 1: Create all accounts with PK mapping
        const pkMap = new Map<number, number>(); // JSON PK -> DB ID

        // Re-sort by PK just to be safe or process in order.
        // Actually, if we just upsert by Code, we can link later?
        // Better: Process strictly by level 1, then 2, then 3.

        // Group by level
        const byLevel: Record<number, any[]> = {};
        for (const a of accounts) {
            const lvl = a.fields.nivel;
            if (!byLevel[lvl]) byLevel[lvl] = [];
            byLevel[lvl].push(a);
        }

        // Max level?
        const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);

        for (const lvl of levels) {
            for (const a of byLevel[lvl]) {
                const { codigo, nombre, nivel, naturaleza, padre, es_movimiento } = a.fields;
                const jsonPk = a.pk;

                let dbParentId = null;
                if (padre !== null && pkMap.has(padre)) {
                    dbParentId = pkMap.get(padre);
                }

                const upserted = await prisma.account.upsert({
                    where: { code: String(codigo) },
                    update: {
                        name: nombre,
                        nature: naturaleza,
                        level: nivel,
                        isMovement: es_movimiento,
                        parentId: dbParentId // Update parent if changed
                    },
                    create: {
                        code: String(codigo),
                        name: nombre,
                        nature: naturaleza,
                        level: nivel,
                        isMovement: es_movimiento,
                        parentId: dbParentId
                    }
                });

                pkMap.set(jsonPk, upserted.id);
            }
        }
        console.log(`   Processed ${accounts.length} accounts.`);
    }

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
