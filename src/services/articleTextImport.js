// Plain text and basic Markdown only. Imported text never becomes raw HTML.
export function importArticleText(value) {
  if (!value.trim()) throw new Error('Pega el contenido del artículo.')
  if (new TextEncoder().encode(value).length > 200000) throw new Error('El texto supera el límite de 200 KB.')
  const blocks = []
  let paragraph = [], list = null
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join('\n') })
    if (list) blocks.push(list)
    paragraph = []; list = null
  }
  for (const line of value.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) { flush(); continue }
    const heading = line.match(/^\s{0,3}(#{1,3})\s+(.+)$/)
    const item = line.match(/^\s*(?:(\d+)\.|[-*+])\s+(.+)$/)
    if (heading) { flush(); blocks.push({ type: 'heading', level: Math.max(2, heading[1].length), text: heading[2] }); continue }
    if (item) {
      const ordered = Boolean(item[1])
      if (paragraph.length || (list && list.ordered !== ordered)) flush()
      list ||= { type: 'list', ordered, items: [] }
      list.items.push(item[2]); continue
    }
    if (list) flush()
    paragraph.push(line)
  }
  flush()
  if (blocks.length > 200) throw new Error('El artículo admite hasta 200 bloques.')
  if (blocks.some(block => block.text?.length > 12000 || block.items?.some(item => item.length > 2000) || block.items?.length > 30)) {
    throw new Error('Divide los párrafos o las listas demasiado extensas antes de incorporarlos.')
  }
  return { version: 1, blocks }
}
