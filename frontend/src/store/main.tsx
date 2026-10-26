import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreApp } from './StoreApp';
import './store.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreApp />
  </StrictMode>,
);
