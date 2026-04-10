import { Router, Response } from 'express';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('transactions')
      .where('tenantId', '==', req.user!.tenantId)
      .orderBy('date', 'desc')
      .get();
    
    // To replicate Prisma's include: { customer: true, supplier: true }
    // Fetch all customers and suppliers for this tenant to avoid N+1 queries
    const customersSnap = await db.collection('customers').where('tenantId', '==', req.user!.tenantId).get();
    const suppliersSnap = await db.collection('suppliers').where('tenantId', '==', req.user!.tenantId).get();
    
    const customersMap = new Map();
    customersSnap.docs.forEach(d => customersMap.set(d.id, { id: d.id, ...d.data() }));
    
    const suppliersMap = new Map();
    suppliersSnap.docs.forEach(d => suppliersMap.set(d.id, { id: d.id, ...d.data() }));

    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        customer: data.customerId ? customersMap.get(data.customerId) || null : null,
        supplier: data.supplierId ? suppliersMap.get(data.supplierId) || null : null
      };
    });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { type, amount, description, status, customerId, supplierId } = req.body;
  if (!type || amount === undefined || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const docRef = await db.collection('transactions').add({
      type,
      amount: parseFloat(amount),
      description,
      status: status || 'Pendente',
      customerId: customerId || null,
      supplierId: supplierId || null,
      tenantId: req.user!.tenantId,
      date: new Date().toISOString()
    });
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const docRef = db.collection('transactions').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.tenantId !== req.user!.tenantId) {
       return res.status(404).json({ error: 'Transaction not found' });
    }
    await docRef.update({ status });
    res.json({ message: 'Transaction updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

export default router;