"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Seeding database...');
        // 1. Users
        const password = 'Cndes2026*';
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const admin = yield prisma.user.upsert({
            where: { email: 'admin@cndes.com' },
            update: {},
            create: {
                email: 'admin@cndes.com',
                fullName: 'Administrador Sistema',
                password: hashedPassword,
                role: 'ADMIN',
            },
        });
        const accountant = yield prisma.user.upsert({
            where: { email: 'contador@cndes.com' },
            update: {},
            create: {
                email: 'contador@cndes.com',
                fullName: 'Contador Principal',
                password: hashedPassword,
                role: 'ACCOUNTANT',
            },
        });
        const director = yield prisma.user.upsert({
            where: { email: 'director@cndes.com' },
            update: {},
            create: {
                email: 'director@cndes.com',
                fullName: 'Director General',
                password: hashedPassword,
                role: 'DIRECTOR',
            },
        });
        console.log('Users seeded.');
        // 2. Accounting (Plan de Cuentas Básico)
        const accountsData = [
            // Activos
            { code: '1', name: 'ACTIVO', nature: 'A', level: 1 },
            { code: '11', name: 'EFECTIVO Y EQUIVALENTES', nature: 'A', level: 2, parentCode: '1' },
            { code: '1105', name: 'CAJA', nature: 'A', level: 3, parentCode: '11', isMovement: true },
            { code: '1110', name: 'BANCOS', nature: 'A', level: 3, parentCode: '11', isMovement: true },
            // Pasivos
            { code: '2', name: 'PASIVO', nature: 'P', level: 1 },
            { code: '23', name: 'CUENTAS POR PAGAR', nature: 'P', level: 2, parentCode: '2' },
            { code: '2335', name: 'COSTOS Y GASTOS POR PAGAR', nature: 'P', level: 3, parentCode: '23', isMovement: true },
            // Patrimonio
            { code: '3', name: 'PATRIMONIO', nature: 'K', level: 1 },
            // Ingresos
            { code: '4', name: 'INGRESOS', nature: 'I', level: 1 },
            { code: '41', name: 'INGRESOS OPERACIONALES', nature: 'I', level: 2, parentCode: '4' },
            { code: '4155', name: 'ACTIVIDADES INMOBILIARIAS', nature: 'I', level: 3, parentCode: '41', isMovement: true },
            // Gastos
            { code: '5', name: 'GASTOS', nature: 'G', level: 1 },
            { code: '51', name: 'ADMINISTRACION', nature: 'G', level: 2, parentCode: '5' },
            { code: '5105', name: 'GASTOS DE PERSONAL', nature: 'G', level: 3, parentCode: '51', isMovement: true },
            { code: '5111', name: 'GENERALES', nature: 'G', level: 3, parentCode: '51', isMovement: true },
        ];
        for (const acc of accountsData) {
            let parentId = null;
            if (acc.parentCode) {
                const parent = yield prisma.account.findUnique({ where: { code: acc.parentCode } });
                parentId = parent === null || parent === void 0 ? void 0 : parent.id;
            }
            yield prisma.account.upsert({
                where: { code: acc.code },
                update: {},
                create: {
                    code: acc.code,
                    name: acc.name,
                    nature: acc.nature,
                    level: acc.level,
                    isMovement: acc.isMovement || false,
                    parentId: parentId,
                },
            });
        }
        console.log('Chart of Accounts seeded.');
        // 3. Third Parties
        yield prisma.thirdParty.upsert({
            where: { id: 1 },
            update: {},
            create: {
                type: 'PROV',
                name: 'Proveedor Papelería S.A.',
                identification: '900123456',
                email: 'ventas@papeleria.com',
                phone: '555-0101',
                address: 'Calle 123 # 45-67',
            },
        });
        yield prisma.thirdParty.upsert({
            where: { id: 2 },
            update: {},
            create: {
                type: 'EMP',
                name: 'Juan Pérez (Empleado)',
                identification: '10203040',
                email: 'juan.perez@cndes.com',
                phone: '555-9988',
                address: 'Av. Siempre Viva 123',
            },
        });
        console.log('Third Parties seeded.');
        // 4. Programs
        yield prisma.program.upsert({
            where: { code: 'P01' },
            update: {},
            create: {
                code: 'P01',
                name: 'Fortalecimiento Institucional',
                isActive: true,
            },
        });
        console.log('Programs seeded.');
        // 5. Banks
        const bank = yield prisma.bank.create({
            data: {
                name: 'Banco Nacional',
                swift: 'BNAC123',
                isActive: true,
            }
        });
        yield prisma.bankAccount.create({
            data: {
                name: 'Cuenta Corriente Operativa',
                accountNumber: '111-222-333-444',
                bankName: bank.name,
                currentBalance: 50000000, // 50M FCFA
                isActive: true,
            }
        });
        console.log('Banks seeded.');
        // 6. Budget
        // Link Budget Accounts to Expense Accounts (Group 5)
        // expenses: 5105 (Personal), 5111 (Generales)
        // Budget Account 1: Personal
        yield prisma.budgetAccount.upsert({
            where: { code: 'XP-001' },
            update: {},
            create: {
                code: 'XP-001',
                name: 'Nómina y Salarios',
                year: 2026,
                allocatedAmount: 120000000, // 120M
                transactions: {
                    create: {
                        amount: 120000000,
                        description: 'Asignación Inicial 2026',
                        referenceType: 'INITIAL',
                    }
                }
            }
        });
        // Budget Account 2: Generales (Papelería, Servicios)
        yield prisma.budgetAccount.upsert({
            where: { code: 'XP-002' },
            update: {},
            create: {
                code: 'XP-002',
                name: 'Gastos Generales y Servicios',
                year: 2026,
                allocatedAmount: 40000000, // 40M
                transactions: {
                    create: {
                        amount: 40000000,
                        description: 'Asignación Inicial 2026',
                        referenceType: 'INITIAL',
                    }
                }
            }
        });
        console.log('Budget seeded.');
        // 7. Assets
        yield prisma.asset.upsert({
            where: { code: 'AST-001' },
            update: {},
            create: {
                code: 'AST-001',
                name: 'Computador Portátil Dell',
                description: 'Laptop asignada a Contabilidad',
                purchaseDate: new Date(),
                value: 1500000,
                location: 'Oficina 202',
                status: 'ACTIVE',
            }
        });
        console.log('Assets seeded.');
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
