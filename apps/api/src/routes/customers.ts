import { Router, Response } from 'express';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('customers')
      .where('tenantId', '==', req.user!.tenantId)
      .orderBy('name', 'asc')
      .get();
    const customers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      };
    });
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { name, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const docRef = await db.collection('customers').add({
      name, phone, email, tenantId: req.user!.tenantId,
      createdAt: new Date().toISOString()
    });
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;

  try {
    const docRef = db.collection('customers').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    await docRef.update({ name, phone, email });
    res.json({ message: 'Customer updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const docRef = db.collection('customers').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;