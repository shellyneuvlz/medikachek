import type { IncomingMessage, ServerResponse } from 'http';
import app, { ensureDbReady } from '../server.ts';

export const config = {
  api: {
    bodyParser: false,
  },
};

function normalizeVercelApiUrl(req: IncomingMessage): void {
  const rawUrl = req.url || '/api';
  const parsed = new URL(rawUrl, 'http://localhost');
  const rewrittenPath = parsed.searchParams.get('__path');

  if (rewrittenPath) {
    parsed.searchParams.delete('__path');
    const cleanPath = rewrittenPath.startsWith('/api')
      ? rewrittenPath
      : `/api${rewrittenPath.startsWith('/') ? '' : '/'}${rewrittenPath}`;
    const remainingQuery = parsed.searchParams.toString();
    req.url = remainingQuery ? `${cleanPath}?${remainingQuery}` : cleanPath;
  } else if (!parsed.pathname.startsWith('/api')) {
    const remainingQuery = parsed.searchParams.toString();
    const prefixed = `/api${parsed.pathname.startsWith('/') ? '' : '/'}${parsed.pathname}`;
    req.url = remainingQuery ? `${prefixed}?${remainingQuery}` : prefixed;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  normalizeVercelApiUrl(req);

  try {
    await ensureDbReady();
  } catch (err: any) {
    console.error('Vercel API DB initialization error:', err?.message || err);
  }

  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    res.on('finish', done);
    res.on('close', done);

    try {
      app(req as any, res as any);
    } catch (err: any) {
      console.error('Vercel Express handler error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            error: 'Terjadi kesalahan pada server saat memproses permintaan.',
          })
        );
      } else if (!res.writableEnded) {
        res.end();
      }
      done();
    }
  });
}
