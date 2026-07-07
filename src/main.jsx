/**
 * Main entry point - mounts React app
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('ui-root'));
root.render(<App />);
