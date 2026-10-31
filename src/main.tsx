import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { applyPalette, loadPalette } from './palette.js';
import './index.css';

// Apply stored or default palette immediately before render
applyPalette(loadPalette());

createRoot(document.getElementById('root')!).render(
  <MotionConfig reducedMotion="user">
    <AuthProvider><App /></AuthProvider>
  </MotionConfig>
);
