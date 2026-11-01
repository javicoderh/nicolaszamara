import { renderToString } from 'react-dom/server'
import App from './app/App.jsx'

export function renderRoute(path) { return renderToString(<App initialPath={path} />) }
