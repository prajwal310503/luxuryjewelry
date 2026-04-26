import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Jost, Inter, sans-serif',
              fontSize: '13.5px',
              fontWeight: '500',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              maxWidth: '360px',
            },
            success: {
              style: {
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              },
              iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' },
            },
            error: {
              style: {
                background: '#fff1f2',
                color: '#be123c',
                border: '1px solid #fecdd3',
              },
              iconTheme: { primary: '#e11d48', secondary: '#fff1f2' },
              duration: 5000,
            },
          }}
        />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
