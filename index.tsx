import React from 'react';
import ReactDOM from 'react-dom/client';
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