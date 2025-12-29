
import api from '../api/client';

async function verifyAssets() {
    console.log('Verifying Assets API...');
    try {
        const testAsset = {
            code: 'TEST-ASSET-001',
            name: 'Test Asset Verification',
            description: 'Created via script',
            purchaseDate: '2025-12-16',
            value: 150000,
            location: 'IT Dept',
            status: 'ACTIVE'
        };

        const res = await api.post('/assets', testAsset);
        console.log('Asset created:', res.data);

        const listRes = await api.get('/assets');
        const found = listRes.data.find((a: any) => a.code === 'TEST-ASSET-001');

        if (found) {
            console.log('SUCCESS: Asset found in list.');
        } else {
            console.error('FAILURE: Asset not found in list.');
        }

    } catch (error) {
        console.error('Error verifying assets:', error);
    }
}
// This script is for manual running in browser console if needed,
// but for agent I'll use a node script like before.
