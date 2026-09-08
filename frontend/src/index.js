import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// This file used to override console.warn and console.error to swallow
// three.js/react-three-fiber messages. Neither library is imported anywhere in
// src/, so the filters matched nothing — but the patched console.error silently
// dropped any message containing "computeBoundingSphere" for the whole app,
// which is exactly the kind of thing that hides a real bug. Removed.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
