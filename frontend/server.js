/**
 * SSR Express server for the storefront (frontend only).
 * Dev:  npm run dev:ssr
 * Prod: npm run build && npm run start:ssr
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5173;

async function createServer() {
  const app = express();
  app.use(compression());

  let vite;
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use('/assets', express.static(path.resolve(__dirname, 'dist/client/assets'), { maxAge: '1y' }));
    app.use(express.static(path.resolve(__dirname, 'dist/client'), { index: false }));
  }

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl;

      let template;
      let render;
      if (!isProd) {
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render;
      } else {
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8');
        render = (await import('./dist/server/entry-server.js')).render;
      }

      const { html: appHtml, helmet } = render(url);
      const head =
        (helmet?.title?.toString() || '') +
        (helmet?.meta?.toString() || '') +
        (helmet?.link?.toString() || '');

      const html = template
        .replace('<!--app-head-->', head)
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
        .replace('/src/main.jsx', '/src/entry-client.jsx');

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      vite?.ssrFixStacktrace?.(e);
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 Storefront SSR  http://localhost:${PORT}\n`);
  });
}

createServer();
