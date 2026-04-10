import { Router, Response } from 'express';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

router.get('/materials', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await db.collection('rawMaterials').where('tenantId', '==', req.user!.tenantId).get();
    const materials = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      };
    });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

router.post('/materials', async (req: AuthenticatedRequest, res: Response) => {
  const { name, unit, stock } = req.body;
  if (!name || !unit) return res.status(400).json({ error: 'Missing name or unit' });
  
  try {
    const docRef = db.collection('rawMaterials').doc();
    const data = { name, unit, stock: stock || 0, tenantId: req.user!.tenantId };
    await docRef.set(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create material' });
  }
});

router.put('/materials/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, unit, stock } = req.body;
  
  try {
    const docRef = db.collection('rawMaterials').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    await docRef.update({ name, unit, stock });
    res.json({ message: 'Material updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update material' });
  }
});

router.delete('/materials/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const docRef = db.collection('rawMaterials').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Material not found' });
    }
    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

export default router;