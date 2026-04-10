import * as admin from 'firebase-admin';

// Inicializa o Firebase Admin. 
// Em produção (Render), usamos a variável GOOGLE_APPLICATION_CREDENTIALS_JSON
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'erp-completo-493eb',
    });
  } else {
    // Tenta usar credenciais padrão (Emulator ou GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp({
      projectId: 'erp-completo-493eb',
    });
  }
}

const db = admin.firestore();

export { db, admin };
