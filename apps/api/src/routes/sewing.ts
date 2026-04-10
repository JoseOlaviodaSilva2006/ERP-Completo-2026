import { Router, Response } from 'express';
import { db, admin } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ordersSnapshot = await db.collection('sewingOrders').where('tenantId', '==', req.user!.tenantId).get();
    const orders = [];
    
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      let supplier = null;
      if (orderData.supplierId) {
        const supDoc = await db.collection('suppliers').doc(orderData.supplierId).get();
        if (supDoc.exists) supplier = { id: supDoc.id, ...supDoc.data() };
      }
      orders.push({
        id: doc.id,
        ...orderData,
        date: orderData.date?.toDate ? orderData.date.toDate() : orderData.date,
        createdAt: orderData.createdAt?.toDate ? orderData.createdAt.toDate() : orderData.createdAt,
        updatedAt: orderData.updatedAt?.toDate ? orderData.updatedAt.toDate() : orderData.updatedAt,
        supplier
      });
    }
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sewing orders' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { sku, quantity, supplierId, estimatedCost } = req.body;
  const tenantId = req.user!.tenantId;

  if (!sku || !quantity || !supplierId) return res.status(400).json({ error: 'Missing fields' });

  try {
    const batch = db.batch();

    // 1. Create the Sewing Order
    const orderRef = db.collection('sewingOrders').doc();
    const orderData = {
      sku, 
      quantity, 
      supplierId, 
      tenantId,
      status: 'Pendente',
      createdAt: new Date()
    };
    batch.set(orderRef, orderData);

    // 2. Find Product through Variation to get BOM
    const varSnapshot = await db.collection('variations').where('sku', '==', sku).where('tenantId', '==', tenantId).limit(1).get();
    
    if (!varSnapshot.empty) {
      const variation = varSnapshot.docs[0].data();
      const productId = variation.productId;
      
      const materialsSnapshot = await db.collection('productMaterials').where('productId', '==', productId).where('tenantId', '==', tenantId).get();
      
      if (!materialsSnapshot.empty) {
        // 3. Deduct raw materials based on BOM
        materialsSnapshot.forEach(matDoc => {
          const matData = matDoc.data();
          const totalNeeded = matData.quantity * quantity;
          const rawMaterialRef = db.collection('rawMaterials').doc(matData.rawMaterialId);
          batch.update(rawMaterialRef, {
            stock: admin.firestore.FieldValue.increment(-totalNeeded)
          });
        });
      }
    }

    // 4. Create an Expense Transaction if estimatedCost is provided
    if (estimatedCost && estimatedCost > 0) {
      const transactionRef = db.collection('transactions').doc();
      batch.set(transactionRef, {
        type: 'EXPENSE',
        amount: parseFloat(estimatedCost),
        description: `Pagamento Facção - OS ${orderRef.id} (${sku})`,
        status: 'Pendente',
        supplierId,
        tenantId,
        date: new Date()
      });
    }

    await batch.commit();
    res.status(201).json({ id: orderRef.id, ...orderData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create sewing order' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const docRef = db.collection('sewingOrders').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Order not found' });
    }
    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sewing order' });
  }
});

router.post('/:id/complete', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user!.tenantId;

  try {
    const orderRef = db.collection('sewingOrders').doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists || orderDoc.data()?.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderDoc.data()!;
    if (orderData.status === 'Concluído') return res.status(400).json({ error: 'Order already completed' });

    const batch = db.batch();

    // Update order status
    batch.update(orderRef, { status: 'Concluído' });

    // Increase stock for the SKU
    const varSnapshot = await db.collection('variations').where('sku', '==', orderData.sku).where('tenantId', '==', tenantId).limit(1).get();
    if (!varSnapshot.empty) {
      batch.update(varSnapshot.docs[0].ref, {
        stock: admin.firestore.FieldValue.increment(orderData.quantity)
      });
    }

    await batch.commit();
    res.json({ message: 'Order completed and stock updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});

export default router;