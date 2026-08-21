import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { VisitorProvider } from './visitor'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VisitorProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </VisitorProvider>
  </StrictMode>,
)
