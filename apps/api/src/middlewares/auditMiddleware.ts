import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { db } from '../firebaseClient';

export const auditLogger = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Capture original send/json to intercept the response status
  const originalJson = res.json;
  const originalSend = res.send;

  // We only care about mutations
  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

  if (!isMutation || !req.user) {
    return next();
  }

  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      logAction(req, body);
    }
    return originalJson.call(this, body);
  };

  res.send = function (body?: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      logAction(req, body);
    }
    return originalSend.call(this, body);
  };

  next();
};

const logAction = async (req: AuthenticatedRequest, responseBody: any) => {
  try {
    const actionMap: any = {
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    };

    let action = actionMap[req.method] || 'UNKNOWN';
    
    // Attempt to extract entity name from URL (e.g. /api/catalog -> catalog)
    const urlParts = req.baseUrl.split('/');
    let entity = urlParts[urlParts.length - 1] || 'system';

    if (entity === 'api') {
        const pathParts = req.path.split('/');
        entity = pathParts[1] || 'system';
    }

    let entityId = null;
    if (req.params.id) {
        entityId = req.params.id;
    } else if (responseBody && responseBody.id) {
        entityId = responseBody.id;
    } else if (responseBody && responseBody.product && responseBody.product.id) {
        entityId = responseBody.product.id;
    }

    // Don't log login/register here as they might not have req.user early on or might expose passwords
    if (entity === 'auth') return;

    await db.collection('auditLogs').add({
      action,
      entity,
      entityId,
      details: JSON.stringify(req.body),
      userId: req.user!.id,
      tenantId: req.user!.tenantId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};