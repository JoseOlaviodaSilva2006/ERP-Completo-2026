import { Router, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { db } from '../firebaseClient';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Mapeia o parâmetro da URL para o nome correto da collection no Firestore
const ENTITY_TO_COLLECTION: Record<string, string> = {
  customers: 'customers',
  rawMaterials: 'rawMaterials',
  finance: 'transactions',
  products: 'products', // Apenas exportação é segura para produtos devido a BOM/Variações
};

/**
 * EXPORTAR DADOS PARA CSV
 */
router.get('/export/:entity', async (req: AuthenticatedRequest, res: Response) => {
  const { entity } = req.params;
  const tenantId = req.user!.tenantId;

  const collectionName = ENTITY_TO_COLLECTION[entity];
  if (!collectionName) {
    return res.status(400).json({ error: 'Entidade inválida para exportação.' });
  }

  try {
    const snapshot = await db.collection(collectionName).where('tenantId', '==', tenantId).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Nenhum dado encontrado para exportar.' });
    }

    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      // Remove campos internos sensíveis antes de exportar
      delete data.tenantId;
      
      // Formata as datas para string ISO
      for (const key of Object.keys(data)) {
        if (data[key] && typeof data[key] === 'object' && data[key].toDate) {
          data[key] = data[key].toDate().toISOString();
        }
      }
      return { id: doc.id, ...data };
    });

    const csvOutput = stringify(records, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${entity}_export.csv"`);
    res.status(200).send(csvOutput);
  } catch (error) {
    console.error(`Erro ao exportar ${entity}:`, error);
    res.status(500).json({ error: 'Falha ao exportar dados.' });
  }
});

/**
 * IMPORTAR DADOS DE CSV
 */
router.post('/import/:entity', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const { entity } = req.params;
  const tenantId = req.user!.tenantId;

  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo CSV enviado.' });
  }

  const collectionName = ENTITY_TO_COLLECTION[entity];
  if (!collectionName || entity === 'products') {
    return res.status(400).json({ error: 'Entidade inválida ou não suportada para importação.' });
  }

  try {
    const fileContent = req.file.buffer.toString('utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: true // Tenta adivinhar floats, ints, etc.
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'O arquivo CSV está vazio ou inválido.' });
    }

    if (records.length > 2000) {
      return res.status(400).json({ error: 'O limite máximo é de 2000 registros por importação.' });
    }

    // O Firestore Batch suporta no máximo 500 operações. Precisamos dividir.
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;

    for (const record of records as any[]) {
      // Remove ID do CSV se houver, para o Firestore gerar um novo automaticamente.
      delete record.id;

      // Adiciona as chaves de controle do tenant e data
      const dataToInsert = {
        ...record,
        tenantId,
        createdAt: new Date(),
      };

      // Formatações específicas por entidade
      if (entity === 'finance') {
        dataToInsert.amount = parseFloat(record.amount) || 0;
        if (record.date) {
          dataToInsert.date = new Date(record.date);
        } else {
          dataToInsert.date = new Date();
        }
      } else if (entity === 'rawMaterials') {
        dataToInsert.stock = parseFloat(record.stock) || 0;
      }

      const newDocRef = db.collection(collectionName).doc();
      currentBatch.set(newDocRef, dataToInsert);
      operationCount++;

      if (operationCount === 500) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        operationCount = 0;
      }
    }

    // Adiciona o último batch se houver operações pendentes
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Executa todas as gravações
    await Promise.all(batches.map(batch => batch.commit()));

    res.status(200).json({ message: `Importação de ${records.length} registros concluída com sucesso.` });
  } catch (error) {
    console.error(`Erro ao importar ${entity}:`, error);
    res.status(500).json({ error: 'Falha ao processar e importar o arquivo CSV. Verifique a formatação das colunas.' });
  }
});

export default router;
