import React from 'react';import {createRoot} from 'react-dom/client';import {MotionConfig} from 'framer-motion';import App from './App';import {applyPalette,loadPalette} from './palette';applyPalette(loadPalette());import './index.css'
createRoot(document.getElementById('root')).render(<MotionConfig reducedMotion="user"><App/></MotionConfig>)
