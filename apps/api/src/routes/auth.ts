import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../firebaseClient';

const router = Router();

// Endpoint for Company and Admin User Registration (Multi-Tenant Setup)
router.post('/register', async (req: Request, res: Response) => {
  const { companyName, email, password } = req.body;

  if (!companyName || !email || !password) {
    return res.status(400).json({ error: 'Missing companyName, email, or password' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration: missing JWT_SECRET' });
  }

  try {
    const usersRef = db.collection('users');
    const existingUserSnapshot = await usersRef.where('email', '==', email).limit(1).get();
    
    if (!existingUserSnapshot.empty) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create Tenant and Admin User in a single transaction (batch in Firestore)
    const batch = db.batch();
    
    const tenantRef = db.collection('tenants').doc();
    const userRef = db.collection('users').doc();
    
    batch.set(tenantRef, {
      name: companyName,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    batch.set(userRef, {
      email,
      passwordHash,
      role: 'ADMIN',
      tenantId: tenantRef.id,
      createdAt: new Date()
    });

    await batch.commit();

    const token = jwt.sign(
      { id: userRef.id, tenantId: tenantRef.id, role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      message: 'Company and Admin created successfully',
      token,
      user: { id: userRef.id, email, role: 'ADMIN' },
      tenant: { id: tenantRef.id, name: companyName }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to register company' });
  }
});

// Endpoint for Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server misconfiguration: missing JWT_SECRET' });
  }

  try {
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const tenantDoc = await db.collection('tenants').doc(userData.tenantId).get();
    const tenantData = tenantDoc.data();

    const token = jwt.sign(
      { id: userDoc.id, tenantId: userData.tenantId, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: userDoc.id, email: userData.email, role: userData.role },
      tenant: { id: tenantDoc.id, name: tenantData?.name || 'Unknown' }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

export default router;
