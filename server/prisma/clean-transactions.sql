-- Limpiar datos transaccionales manteniendo nomencladores
-- Ejecutar con: psql -U cndes -h localhost -d sgcf_db -f clean-transactions.sql

BEGIN;

-- Eliminar en orden para respetar foreign keys
TRUNCATE TABLE "JournalLine" CASCADE;
TRUNCATE TABLE "JournalEntry" CASCADE;
TRUNCATE TABLE "BankTransaction" CASCADE;
TRUNCATE TABLE "Payment" CASCADE;
TRUNCATE TABLE "Invoice" CASCADE;
TRUNCATE TABLE "PurchaseOrder" CASCADE;
TRUNCATE TABLE "ExpenseRequest" CASCADE;
TRUNCATE TABLE "AssetMovement" CASCADE;
TRUNCATE TABLE "AssetDepreciation" CASCADE;
TRUNCATE TABLE "Asset" CASCADE;
TRUNCATE TABLE "BudgetExecution" CASCADE;

-- Resetear saldos de cuentas bancarias a valores iniciales del seed
UPDATE "BankAccount" SET "currentBalance" = 50000000 WHERE "name" = 'Cuenta Corriente';
UPDATE "BankAccount" SET "currentBalance" = 25000000 WHERE "name" = 'Cuenta de Ahorros';
UPDATE "BankAccount" SET "currentBalance" = 10000000 WHERE "name" = 'Cuenta Nómina';

COMMIT;

-- Mostrar resumen
SELECT 'Limpieza completada exitosamente!' as status;
SELECT 'Datos preservados: Usuarios, Cuentas, Áreas, Programas, Bancos, Terceros, Presupuesto' as info;
