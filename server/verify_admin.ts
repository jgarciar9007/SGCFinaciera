import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verify() {
    const email = 'admin@cndes.ge';
    const password = 'Cndes2026*';

    console.log(`Verifying user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    console.log('✅ User found.');
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Name: ${user.name}`);

    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
        console.log('✅ Password is CORRECT.');
    } else {
        console.error('❌ Password is INCORRECT.');
        console.log(`   Stored hash: ${user.password}`);
    }
}

verify()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
