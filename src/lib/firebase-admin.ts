import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function loadFirebaseProjectId(): string | undefined {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }

  const candidatePaths = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
  ];

  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    candidatePaths.push(path.resolve(currentDir, '../../firebase-applet-config.json'));
  } catch {
    // Ignore if import.meta.url is unavailable in bundled runtime
  }

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (parsed?.projectId) {
          return String(parsed.projectId);
        }
      }
    } catch {
      // Try next candidate
    }
  }

  return 'mimetic-liberty-7xctm';
}

if (!getApps().length) {
  const projectId = loadFirebaseProjectId();
  if (projectId) {
    initializeApp({ projectId });
  } else {
    initializeApp();
  }
}

export const adminAuth = getAuth();
