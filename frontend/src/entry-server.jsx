import React, { Suspense } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

/**
 * Server-side render the React storefront for a given URL.
 * Used by frontend/server.js (Vite SSR).
 */
export function render(url) {
  const helmetContext = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <Suspense fallback={<div style={{ minHeight: '40vh' }} />}>
          <App />
        </Suspense>
      </StaticRouter>
    </HelmetProvider>
  );
  const { helmet } = helmetContext;
  return { html, helmet };
}
