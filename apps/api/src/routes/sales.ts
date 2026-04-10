import { Router, Response } from 'express';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { sku, quantity, totalPrice, customerId } = req.body;
  const tenantId = req.user!.tenantId;

  if (!sku || !quantity || !totalPrice) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check variation
    const variationSnap = await db.collection('variations')
      .where('tenantId', '==', tenantId)
      .where('sku', '==', sku)
      .limit(1)
      .get();

    if (variationSnap.empty) return res.status(404).json({ error: 'SKU not found' });

    const variationDoc = variationSnap.docs[0];
    const variationData = variationDoc.data();

    // Decrease stock
    await variationDoc.ref.update({
      stock: (variationData.stock || 0) - quantity
    });

    // Register Revenue Transaction
    await db.collection('transactions').add({
      type: 'INCOME',
      amount: parseFloat(totalPrice),
      description: `Venda PDV - ${quantity}x ${sku}`,
      status: 'Pago',
      customerId: customerId || null,
      tenantId,
      date: new Date().toISOString()
    });

    return res.status(201).json({ message: 'Sale registered successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to register sale' });
  }
});

export default router;