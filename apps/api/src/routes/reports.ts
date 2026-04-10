import { Router, Response } from 'express';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

router.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    const productsSnap = await db.collection('products').where('tenantId', '==', tenantId).get();
    const productsCount = productsSnap.size;

    const customersSnap = await db.collection('customers').where('tenantId', '==', tenantId).get();
    const customersCount = customersSnap.size;
    
    // Calculate total revenue and expenses for the month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthISO = startOfMonth.toISOString();

    const transactionsSnap = await db.collection('transactions')
      .where('tenantId', '==', tenantId)
      .where('status', '==', 'Pago')
      .where('date', '>=', startOfMonthISO)
      .get();

    const transactions = transactionsSnap.docs.map(d => d.data());

    const revenue = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + (t.amount || 0), 0);
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + (t.amount || 0), 0);

    // Get low stock variations (less than 10)
    const lowStockSnap = await db.collection('variations')
      .where('tenantId', '==', tenantId)
      .where('stock', '<', 10)
      .limit(5)
      .get();

    const lowStock = [];
    for (const doc of lowStockSnap.docs) {
      const data = doc.data();
      let product = null;
      if (data.productId) {
        const prodDoc = await db.collection('products').doc(data.productId).get();
        if (prodDoc.exists) {
          product = { name: prodDoc.data()?.name };
        }
      }
      lowStock.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        product
      });
    }

    res.json({
      productsCount,
      customersCount,
      financials: { revenue, expenses, balance: revenue - expenses },
      lowStock
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

export default router;