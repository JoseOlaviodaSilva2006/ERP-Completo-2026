import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

// Middleware to check if user is ADMIN
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: Function) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado: Apenas administradores podem gerenciar usuários.' });
  }
  next();
};

// List all users in the tenant
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    const snapshot = await db.collection('users').where('tenantId', '==', tenantId).get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt ? data.createdAt.toDate() : null
      };
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Create a new user for the tenant
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const existingUserSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!existingUserSnapshot.empty) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role === 'ADMIN' ? 'ADMIN' : 'USER';
    
    const newUserRef = db.collection('users').doc();
    const now = new Date();
    
    await newUserRef.set({
      email,
      passwordHash,
      role: userRole,
      tenantId,
      createdAt: now
    });

    res.status(201).json({ id: newUserRef.id, email, role: userRole, createdAt: now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Update a user (role or password)
router.put('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;
  const { role, password } = req.body;

  try {
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists || userDoc.data()?.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updateData: any = {};
    if (role === 'ADMIN' || role === 'USER') {
      updateData.role = role;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nenhum dado válido para atualizar' });
    }

    await userRef.update(updateData);
    
    const updatedDoc = await userRef.get();
    const data = updatedDoc.data()!;

    res.json({
      id: updatedDoc.id,
      email: data.email,
      role: data.role,
      createdAt: data.createdAt ? data.createdAt.toDate() : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Delete a user
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { id } = req.params;

  if (req.user!.id === id) {
    return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
  }

  try {
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists || userDoc.data()?.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await userRef.delete();

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

export default router;
