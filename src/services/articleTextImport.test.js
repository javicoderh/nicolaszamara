import { expect, it } from 'vitest'
import { importArticleText } from './articleTextImport.js'

it('preserves paragraphs, headings and separate ordered and unordered lists', () => {
  expect(importArticleText('Primer párrafo.\r\nSegunda línea.\r\n\r\n## Observar\n- Bosque\n- Agua\n\n1. Mirar\n2. Escuchar')).toEqual({ version: 1, blocks: [
    { type: 'paragraph', text: 'Primer párrafo.\nSegunda línea.' }, { type: 'heading', level: 2, text: 'Observar' },
    { type: 'list', ordered: false, items: ['Bosque', 'Agua'] }, { type: 'list', ordered: true, items: ['Mirar', 'Escuchar'] },
  ] })
})
it('keeps pasted HTML as inert text and downgrades body H1 to H2', () => {
  expect(importArticleText('# Entrada\n\n<script>alert(1)</script>').blocks).toEqual([
    { type: 'heading', level: 2, text: 'Entrada' }, { type: 'paragraph', text: '<script>alert(1)</script>' },
  ])
})
it('rejects empty, oversized and excessive content without truncation', () => {
  for (const source of [' ', 'x'.repeat(12001), 'x\n\n'.repeat(201), 'á'.repeat(100001)]) {
    expect(() => importArticleText(source)).toThrow()
  }
})
