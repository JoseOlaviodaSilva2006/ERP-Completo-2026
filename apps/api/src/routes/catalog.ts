import { Router, Response } from 'express';
import { encrypt, decrypt } from '../utils/crypto';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();

router.post('/matrix', async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, basePrice, sizes, colors, cost, materials } = req.body;
  const tenantId = req.user!.tenantId;

  if (!name || !sizes || !colors || cost === undefined) {
    return res.status(400).json({ error: 'Missing required fields for Matrix' });
  }

  try {
    const encryptedCostData = encrypt(cost.toString());
    const batch = db.batch();
    
    // Create Product
    const productRef = db.collection('products').doc();
    batch.set(productRef, {
      name,
      description: description || null,
      basePrice,
      tenantId,
      createdAt: new Date()
    });

    const createdProduct = {
      id: productRef.id,
      name,
      description,
      basePrice,
      tenantId,
      variations: [] as any[],
      materials: [] as any[]
    };

    // Create Materials
    if (materials && materials.length > 0) {
      materials.forEach((m: any) => {
        const matRef = db.collection('productMaterials').doc();
        const matData = {
          quantity: parseFloat(m.quantity),
          rawMaterialId: m.rawMaterialId,
          productId: productRef.id,
          tenantId
        };
        batch.set(matRef, matData);
        createdProduct.materials.push({ id: matRef.id, ...matData });
      });
    }

    // Create Variations
    colors.forEach((color: string) => {
      sizes.forEach((size: string) => {
        const varRef = db.collection('variations').doc();
        const sku = `${name.substring(0, 3).toUpperCase()}-${color.substring(0, 3).toUpperCase()}-${size.toUpperCase()}`;
        const varData = {
          sku,
          size,
          color,
          stock: 0,
          costEncrypted: encryptedCostData.encryptedData,
          iv: encryptedCostData.iv,
          authTag: encryptedCostData.authTag,
          productId: productRef.id,
          tenantId
        };
        batch.set(varRef, varData);
        createdProduct.variations.push({ id: varRef.id, ...varData });
      });
    });

    await batch.commit();

    return res.status(201).json({ message: 'Matrix generated successfully', product: createdProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create matrix' });
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    // To mimic relational include, we fetch products and variations
    const productsSnapshot = await db.collection('products').where('tenantId', '==', tenantId).get();
    const variationsSnapshot = await db.collection('variations').where('tenantId', '==', tenantId).get();

    const variationsByProduct: Record<string, any[]> = {};
    variationsSnapshot.forEach(doc => {
      const v = { id: doc.id, ...doc.data() };
      try {
        const cost = decrypt(v.costEncrypted, v.iv, v.authTag);
        v.cost = parseFloat(cost);
      } catch (e) {
        v.cost = null;
        v.error = 'Decryption failed';
      }
      
      if (!variationsByProduct[v.productId]) {
        variationsByProduct[v.productId] = [];
      }
      variationsByProduct[v.productId].push(v);
    });

    const catalog = productsSnapshot.docs.map(doc => {
      const p = { id: doc.id, ...doc.data() };
      return {
        ...p,
        variations: variationsByProduct[doc.id] || []
      };
    });

    return res.json(catalog);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, basePrice } = req.body;
  const tenantId = req.user!.tenantId;

  try {
    const productRef = db.collection('products').doc(id);
    const doc = await productRef.get();

    if (!doc.exists || doc.data()?.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await productRef.update({ name, description, basePrice });
    
    return res.json({ message: 'Product updated' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const tenantId = req.user!.tenantId;

  try {
    const productRef = db.collection('products').doc(id);
    const doc = await productRef.get();

    if (!doc.exists || doc.data()?.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const batch = db.batch();
    batch.delete(productRef);

    // Delete associated variations
    const varsSnapshot = await db.collection('variations')
      .where('productId', '==', id)
      .where('tenantId', '==', tenantId)
      .get();
      
    varsSnapshot.forEach(vDoc => {
      batch.delete(vDoc.ref);
    });

    // Delete associated materials
    const matsSnapshot = await db.collection('productMaterials')
      .where('productId', '==', id)
      .where('tenantId', '==', tenantId)
      .get();
      
    matsSnapshot.forEach(mDoc => {
      batch.delete(mDoc.ref);
    });

    await batch.commit();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.put('/variation/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { stock, cost } = req.body;
  const tenantId = req.user!.tenantId;

  try {
    const varRef = db.collection('variations').doc(id);
    const doc = await varRef.get();

    if (!doc.exists || doc.data()?.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Variation not found' });
    }

    const dataToUpdate: any = {};
    if (stock !== undefined) dataToUpdate.stock = stock;
    if (cost !== undefined) {
      const encryptedCostData = encrypt(cost.toString());
      dataToUpdate.costEncrypted = encryptedCostData.encryptedData;
      dataToUpdate.iv = encryptedCostData.iv;
      dataToUpdate.authTag = encryptedCostData.authTag;
    }

    await varRef.update(dataToUpdate);
    
    return res.json({ message: 'Variation updated securely' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update variation' });
  }
});

export default router;
