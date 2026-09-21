// Filter benign Firebase transport/connection messages from inflating errors in iframe
if (typeof window !== 'undefined') {
  const origErr = console.error;
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || String(args[0] || ''));
    if (
      msg.includes('@firebase/firestore') ||
      msg.includes('Could not reach Cloud Firestore') ||
      (msg.includes('code=unavailable') && msg.includes('operation could not be completed'))
    ) {
      console.warn(...args);
      return;
    }
    origErr.apply(console, args);
  };
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
