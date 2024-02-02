import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom';
import App from './App.jsx'
import { CookiesProvider } from 'react-cookie';
import 'fomantic-ui-css/semantic.min.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <CookiesProvider>
        <App />
      </CookiesProvider>
    </HashRouter>
  </React.StrictMode>,
)
