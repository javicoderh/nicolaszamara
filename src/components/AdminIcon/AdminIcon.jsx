import './AdminIcon.css'
const paths = {
  sparkles: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3M20 2v4m-2-2h4',
  article: 'M14 3H5v18h14V8l-5-5Zm0 0v6h5M8 13h8M8 17h6',
  create: 'M14 3H5v18h14V8l-5-5Zm0 0v6h5M12 12v6m-3-3h6',
  queue: 'M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1',
  tags: 'm3 3 8 0 10 10-8 8L3 11V3Zm4 4h.01',
  comments: 'M21 3H3v14h5l4 4 4-4h5V3ZM7 8h10M7 12h7',
  filter: 'M3 4h18l-7 8v7l-4 2v-9L3 4Z',
  inbox: 'M5 3h14l3 12v6H2v-6L5 3Zm-3 12h6l2 3h4l2-3h6M8 7h8M8 11h8',
  refresh: 'M20 7a9 9 0 0 0-15 0L2 10m0-6v6h6m-4 7a9 9 0 0 0 15 0l3-3m0 6v-6h-6',
  lock: 'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 5v2',
  close: 'm6 6 12 12M6 18 18 6',
  edit: 'm15 3 6 6-12 12H3v-6L15 3Zm-3 3 6 6',
  save: 'M3 3h15l3 3v15H3V3Zm4 0v7h10V3M7 21v-7h10v7',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  check: 'm4 12 5 5L20 6',
  archive: 'M3 3h18v5H3V3Zm2 5v13h14V8M9 12h6',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5',
}
const aliases = { 'blog-create': 'sparkles', 'blog-articles': 'article', 'blog-queue': 'queue', 'blog-categories': 'tags', 'blog-comments': 'comments', 'interests-account': 'lock', 'interests-filters': 'filter', 'interests-requests': 'inbox' }
export default function AdminIcon({ name = 'article' }) {
  return <svg className="admin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[aliases[name] || name] || paths.article}/></svg>
}
