import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import app, { ensureDbReady } from './src/expressApp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT =
  process.env.APP_PORT ||
  (process.env.PORT && process.env.PORT !== process.env.NGINX_PORT ? process.env.PORT : '3000');

async function startServer() {
  void ensureDbReady();

  if (process.env.NODE_ENV !== 'production') {
    const vitePkg = 'vite';
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`MedikaCheck Server running on port ${PORT}`);
  });
}

const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const isDirectExecution = (() => {
  try {
    const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
    return entry === path.resolve(__filename);
  } catch {
    return false;
  }
})();

if (!isVercel && (isDirectExecution || process.env.FORCE_SERVER_LISTEN === 'true')) {
  startServer();
}

export { app, ensureDbReady };
export default app;
