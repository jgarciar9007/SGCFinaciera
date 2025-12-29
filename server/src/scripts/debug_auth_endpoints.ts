
const API_URL = 'http://localhost:3000/api';
// Use a new unique email to ensure we can create it, or use standard admin if we knew pass.
// Let's try to create a new one to be sure we know the password.
const DEBUG_EMAIL = 'debug_superuser_99@test.com';
const DEBUG_PASS = 'debug123';

async function testEndpoints() {
    try {
        console.log('0. Registering Debug User...');
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: DEBUG_EMAIL,
                password: DEBUG_PASS,
                fullName: 'Debug Admin',
                role: 'ADMIN'
            })
        });

        if (regRes.ok) {
            console.log('Registration Successful.');
        } else {
            const txt = await regRes.text();
            if (txt.includes('User already exists')) {
                console.log('User already exists, proceeding to login...');
            } else {
                console.error('Registration Failed:', txt);
                return;
            }
        }

        console.log('1. Attempting Login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: DEBUG_EMAIL, password: DEBUG_PASS })
        });

        if (!loginRes.ok) {
            console.error('Login Failed:', await loginRes.text());
            return;
        }

        const loginData = await loginRes.json() as any;
        const token = loginData.token;
        console.log('Login successful. Token received.');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log('2. Fetching Expenses...');
        const expRes = await fetch(`${API_URL}/expenses`, { headers });
        if (expRes.ok) {
            const expenses = await expRes.json() as any[];
            console.log(`Expenses Success! Count: ${expenses.length}`);
        } else {
            console.error('Expenses Failed:', expRes.status, await expRes.text());
        }

        console.log('3. Fetching Procurement (Purchase Orders)...');
        const procRes = await fetch(`${API_URL}/procurement`, { headers });
        if (procRes.ok) {
            const pos = await procRes.json() as any[];
            console.log(`Procurement Success! Count: ${pos.length}`);
        } else {
            console.error('Procurement Failed:', procRes.status, await procRes.text());
        }

    } catch (error: any) {
        console.error('Critical Error:', error.message);
    }
}

testEndpoints();
