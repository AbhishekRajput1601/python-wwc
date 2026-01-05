import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      newestOnTop={true}
      limit={5}
      pauseOnFocusLoss={false}
      style={{ zIndex: 99999 }}
    />
  </React.StrictMode>,
)