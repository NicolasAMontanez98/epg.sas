import { lazy, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import Site from './Site.jsx'
import './styles.css'

const Admin = lazy(() => import('./Admin.jsx'))
const Empalme = lazy(() => import('./Empalme.jsx'))
const Privacy = lazy(() => import('./Privacy.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="/empalme" element={<Empalme />} />
          <Route path="/privacidad" element={<Privacy />} />
          <Route path="*" element={<Site />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
)
