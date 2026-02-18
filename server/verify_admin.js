const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verify() {
    const email = 'admin@cndes.ge';
    const password = 'Cndes2026*';

    console.log(`Verifying user: ${email} against DB at ${process.env.DATABASE_URL}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error('❌ User not found!');
            // List all users to see what's there
            const users = await prisma.user.findMany();
            console.log('Available users:', users.map(u => u.email));
            return;
        }

        console.log('✅ User found.');
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Password Hash: ${user.password}`);

        const isValid = await bcrypt.compare(password, user.password);

        if (isValid) {
            console.log('✅ Password is CORRECT.');
        } else {
            console.error('❌ Password is INCORRECT.');
        }
    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
