import { Router, Response } from 'express';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('suppliers')
      .where('tenantId', '==', req.user!.tenantId)
      .orderBy('name', 'asc')
      .get();
    const suppliers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      };
    });
    res.json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { name, cnpj, type, contact } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const docRef = await db.collection('suppliers').add({
      name, cnpj, type, contact, tenantId: req.user!.tenantId,
      createdAt: new Date().toISOString()
    });
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, cnpj, type, contact } = req.body;

  try {
    const docRef = db.collection('suppliers').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    await docRef.update({ name, cnpj, type, contact });
    res.json({ message: 'Supplier updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const docRef = db.collection('suppliers').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;