
// This file is needed for server-side actions that require admin privileges.
import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";

// IMPORTANT: In a real production environment, you would use environment variables
// or a secret manager to handle these credentials securely.
// For this project, we assume it's configured in the deployment environment.
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    } 
    
    // If the service account key is available, use it.
    if (serviceAccountKey) {
       return initializeApp({
            credential: cert(JSON.parse(serviceAccountKey)),
        });
    } else {
        // Otherwise, initialize without credentials.
        // This will work in Google Cloud environments (like App Hosting)
        // where default credentials are automatically available.
        return initializeApp();
    }
}

export const app = getAdminApp();
