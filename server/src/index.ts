import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
import path from 'path';
import authRoutes from './routes/authRoutes';
import budgetRoutes from './routes/budgetRoutes';
import expenseRoutes from './routes/expenseRoutes';
import procurementRoutes from './routes/procurementRoutes';
import billingRoutes from './routes/billingRoutes';
import settingsRoutes from './routes/settingsRoutes';
import accountingRoutes from './routes/accountingRoutes';
import assetRoutes from './routes/assetRoutes';
import treasuryRoutes from './routes/treasuryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import adminRoutes from './routes/adminRoutes'; // Add this

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes); // Add this

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
