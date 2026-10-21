# Nicolas Zamara front

Frontend de la consulta terapéutica Nicolas Zamara, creado con React y Vite (JavaScript).

## Páginas disponibles

- `/`: inicio, áreas de trabajo, curso, presentación y registro de interés en naturaleza.
- `/consulta`: primera atención, evaluación individual, datos prácticos y consulta de disponibilidad.
- `/cursos`: curso Flores de Bach y formulario de interés para una futura edición online.
- `/privacidad`: borrador pendiente de revisión antes de conectar registros.
- Las rutas desconocidas muestran una página 404. `vercel.json` permite cargar directamente las rutas en Vercel.

Los textos, metadatos, enlaces, ofertas y datos de contacto editables se centralizan en `src/content/siteContent.js`. Las fotos se reemplazan al recibir originales autorizados. Revisa `CONTENT_STATUS.md` antes de editar o preparar un lanzamiento.

## Desarrollo

```sh
npm install
npm run dev
```

## Pruebas unitarias con Vitest y React Testing Library

Vitest usa la configuración de Vite, JSDOM proporciona el entorno DOM y React Testing Library permite consultar e interactuar con los componentes. Los tests importan explícitamente `describe`, `it`, `expect` y `vi` desde Vitest.

Dependencias de prueba fijadas en `package.json`:

```sh
npm install
```

Ejecutar las pruebas una vez o en modo observación:

```sh
npm test
npm run test:watch
```

La configuraci?n de Vitest y las pruebas unitarias de p?ginas, componentes, skeletons, formularios, contexto, servicios y temporizadores est?n incluidas. La ?ltima ejecuci?n local aprob? 35 pruebas en 16 archivos.

## Metadatos y prerenderizado

El frontend actual se sirve como una aplicación Vite de renderizado en navegador. Cambia títulos, descripciones y etiquetas sociales al abrir cada ruta. Para vistas previas sociales consistentes con rastreadores que no ejecuten JavaScript, hay que decidir e implementar prerenderizado o generación estática antes del lanzamiento. Los dominios de revisión quedan marcados `noindex`; los dominios canónicos configurados pueden indexarse.

## Compilación

```sh
npm run build
npm run preview
```

Esta etapa contiene únicamente el frontend. La API Python y la conexión con Supabase se incorporarán más adelante.

Repositorio: https://github.com/javicoderh/nicolaszamara
