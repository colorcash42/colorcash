// This file is needed for server-side actions that require admin privileges.
import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";

// IMPORTANT: This service account key is a placeholder. 
// In a real production environment, you would use environment variables
// or a secret manager to handle these credentials securely.
// For this project, we assume it's configured in the deployment environment.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : {
      "type": "service_account",
      "project_id": "trivium-clash",
      // Private key is intentionally omitted for security reasons.
      // It should be loaded from environment variables in production.
      "private_key_id": "your-private-key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n",
      "client_email": "firebase-adminsdk-xxxxx@trivium-clash.iam.gserviceaccount.com",
      "client_id": "your-client-id",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40trivium-clash.iam.gserviceaccount.com"
    };

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    } else {
       return initializeApp({
            credential: cert(serviceAccount),
        });
    }
}

export const app = getAdminApp();
