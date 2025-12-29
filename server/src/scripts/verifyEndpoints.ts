
import http from 'http';

const verifyEndpoint = (path: string, method: string = 'GET') => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`${method} ${path} -> Status: ${res.statusCode} | Data Length: ${data.length}`);
                if (res.statusCode && res.statusCode >= 400) {
                    console.log('Error Body:', data.substring(0, 200));
                }
                resolve({ statusCode: res.statusCode, data });
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request ${path}: ${e.message}`);
            resolve({ statusCode: 0, error: e.message });
        });

        req.end();
    });
};

async function run() {
    console.log('--- Verifying Endpoints ---');
    // We expect 401/403 if auth is enabled and we don't send token, 
    // but at least we shouldn't get ECONNREFUSED or 404 (if route exists).
    // If endpoints are protected, we might get 401, which confirms route exists.

    await verifyEndpoint('/accounting/third-party-ledger');
    await verifyEndpoint('/procurement'); // check if this lists POs
    await verifyEndpoint('/expenses');
    await verifyEndpoint('/billing/invoices');
}

run();
