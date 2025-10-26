import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import LoadingPage from './components/LoadingPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);

// Show loading page first
root.render(
  <React.StrictMode>
    <LoadingPage />
  </React.StrictMode>
);

// Simulate app loading (you can replace this with actual app initialization)
setTimeout(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}, 2000);