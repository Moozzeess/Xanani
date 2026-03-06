import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { ProveedorAutenticacion } from './autenticacion/usarAutenticacion';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorAutenticacion>
      <App />
    </ProveedorAutenticacion>
  </StrictMode>
);
