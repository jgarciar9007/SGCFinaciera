import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true
            }
        });

        console.log('\n=== USUARIOS EN LA BASE DE DATOS ===\n');

        if (users.length === 0) {
            console.log('❌ No hay usuarios en la base de datos');
            console.log('\nEjecuta: npx prisma db seed');
        } else {
            console.log(`✅ Total de usuarios: ${users.length}\n`);
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.fullName}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Rol: ${user.role}`);
                console.log(`   Creado: ${user.createdAt}`);
                console.log('');
            });
        }
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
        console.log('\nVerifica que:');
        console.log('1. PostgreSQL esté corriendo');
        console.log('2. La base de datos "sgcf_db" exista');
        console.log('3. Las credenciales en .env sean correctas');
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
