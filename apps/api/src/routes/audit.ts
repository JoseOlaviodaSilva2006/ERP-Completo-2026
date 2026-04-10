import { Router, Response } from 'express';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

// Only ADMINs can view audit logs
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado: Apenas administradores podem ver logs de auditoria.' });
  }

  try {
    const logsSnapshot = await db.collection('auditLogs')
      .where('tenantId', '==', req.user!.tenantId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const logs = [];
    for (const doc of logsSnapshot.docs) {
      const data = doc.data();
      // Fetch user email if needed
      let user = null;
      if (data.userId) {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
           user = { email: userDoc.data()?.email };
        }
      }
      logs.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate ? data.date.toDate() : data.date,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        user
      });
    }
    
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;