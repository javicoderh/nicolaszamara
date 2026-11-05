import { expect, it } from 'vitest'
import { articleImagePlacement, articleTextFlow, cropRectangle } from './articleImageLayout.js'

it('places the interior image after the middle and leaves following prose', () => {
  const blocks = Array.from({ length: 6 }, () => ({ type: 'paragraph', text: 'Un paseo tranquilo entre arboles' }))
  expect(articleImagePlacement(blocks)).toBe(3)
  expect(articleImagePlacement(blocks, { afterBlock: 99 })).toBe(4)
  expect(articleImagePlacement([], {})).toBe(-1)
})
it('lets a single paragraph flow beside the image without changing the document', () => {
  const blocks = [{ type: 'paragraph', text: 'uno dos tres cuatro cinco seis' }]
  const result = articleTextFlow(blocks, true)
  expect(result).toHaveLength(2)
  expect(result.map(block => block.text).join(' ')).toBe(blocks[0].text)
  expect(blocks).toHaveLength(1)
  expect(articleTextFlow(blocks, false)).toEqual(blocks)
})
it('keeps focal crops within the source image and respects zoom and aspect ratio', () => {
  for (const aspect of [.8, 1.5]) for (const zoom of [1, 2, 3]) for (const x of [0, 50, 100]) {
    const crop = cropRectangle(1200, 800, { aspect, zoom, x, y: 100 })
    expect(crop.width / crop.height).toBeCloseTo(aspect)
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.x + crop.width).toBeLessThanOrEqual(1200)
    expect(crop.y + crop.height).toBeLessThanOrEqual(800)
  }
  for (const edits of [{ zoom: 0 }, { x: 101 }, { aspect: NaN }]) expect(() => cropRectangle(1200, 800, edits)).toThrow('invalid_crop')
})
