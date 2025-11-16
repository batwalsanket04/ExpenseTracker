import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import StoreContext from '../Context/storeContext.jsx'
import { ToastContainer,toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

 createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreContext>
    <App/>
     <ToastContainer
    position="top-right"
    autoClose={1800}
    hideProgressBar={false}
    pauseOnHover
    theme="colored"
    toastStyle={{
      background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
      color: "white",
      borderRadius: "10px",
      fontSize: "15px",
      fontWeight: "500",
      padding: "12px 16px"
    }}
  />
    </StoreContext>
  </StrictMode>
)
