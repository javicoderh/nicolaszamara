import { expect,it } from 'vitest'
import { publicationIssues,titleSlug } from './blogPublication.js'
it('lists all missing requirements before publication',()=>{expect(publicationIssues({})).toEqual(expect.arrayContaining(['Título','Imagen de apertura','Imagen interior','Contenido del artículo']))})
it('generates a normalized readable slug from a title',()=>{expect(titleSlug('Una pausa: árboles y bienestar')).toBe('una-pausa-arboles-y-bienestar')})
