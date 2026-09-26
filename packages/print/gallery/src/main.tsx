import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Galeria } from './Galeria.tsx'
import './galeria.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Galeria />
  </StrictMode>,
)
