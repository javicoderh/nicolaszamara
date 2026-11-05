import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './app/App.jsx'
import './index.css'

const view = (
  <React.StrictMode>
    <App initialBlog={JSON.parse(document.getElementById('blog-snapshot')?.textContent || 'null')} />
  </React.StrictMode>
)
const root = document.getElementById('root')
if (root.hasChildNodes()) hydrateRoot(root, view)
else createRoot(root).render(view)
