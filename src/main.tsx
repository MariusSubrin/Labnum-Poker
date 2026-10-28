import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("L'élément racine #root est introuvable dans le document.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
