import React from 'react';
import ReactDOM from 'react-dom/client';

// Self-hosted fonts and stylesheet. These are bundled into the build so no
// request ever leaves the server, which a strict `style-src 'self'` CSP requires.
import '@fontsource-variable/montserrat';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import './index.css';

import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = (window as any)._root || ReactDOM.createRoot(rootElement);
if (!(window as any)._root) (window as any)._root = root;
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);