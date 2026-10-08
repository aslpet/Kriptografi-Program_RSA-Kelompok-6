import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/barlow-semi-condensed/400.css';
import '@fontsource/barlow-semi-condensed/600.css';
import '@fontsource/barlow-semi-condensed/700.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/store.css';
import './styles/dock.css';
import './styles/crypto.css';

import { App } from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
