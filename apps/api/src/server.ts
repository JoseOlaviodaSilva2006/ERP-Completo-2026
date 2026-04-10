import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import catalogRouter from './routes/catalog';
import pcpRouter from './routes/pcp';
import salesRouter from './routes/sales';
import sewingRouter from './routes/sewing';
import usersRouter from './routes/users';
import customersRouter from './routes/customers';
import suppliersRouter from './routes/suppliers';
import financeRouter from './routes/finance';
import reportsRouter from './routes/reports';
import auditRouter from './routes/audit';
import bulkRouter from './routes/bulk';
import { requireAuth } from './middlewares/authMiddleware';
import { auditLogger } from './middlewares/auditMiddleware';

const app = express();
app.use(cors());
app.use(express.json());

// Public routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fashion ERP API is running securely' });
});

app.use('/api/auth', authRouter);

// Protected routes (Multi-Tenant) with Audit Logger
app.use(requireAuth);
app.use(auditLogger);

app.use('/api/catalog', catalogRouter);
app.use('/api/pcp', pcpRouter);
app.use('/api/sales', salesRouter);
app.use('/api/sewing', sewingRouter);
app.use('/api/users', usersRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/finance', financeRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/bulk', bulkRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
