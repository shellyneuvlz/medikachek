import type { IncomingMessage, ServerResponse } from 'http';
import app from '../src/expressApp';

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
  } else if (parsed.pathname === '/api/index' || parsed.pathname === '/api/index.ts') {
    const remainingQuery = parsed.searchParams.toString();
    req.url = remainingQuery ? `/api?${remainingQuery}` : '/api';
  } else if (!parsed.pathname.startsWith('/api')) {
    const remainingQuery = parsed.searchParams.toString();
    const prefixed = `/api${parsed.pathname.startsWith('/') ? '' : '/'}${parsed.pathname}`;
    req.url = remainingQuery ? `${prefixed}?${remainingQuery}` : prefixed;
  }
}

export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  normalizeVercelApiUrl(req);

  return new Promise<void>((resolve) => {
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
      // Invoke Express synchronously so express.json() attaches before request body stream events drain
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
