# Nicolas Zamara front

Aplicación de la consulta terapéutica Nicolas Zamara: React + Vite, API Python y persistencia en Supabase.

## Páginas disponibles

- `/`: inicio, áreas de trabajo, curso, presentación y registro de interés en naturaleza.
- `/consulta`: primera atención, evaluación individual, datos prácticos y consulta de disponibilidad.
- `/cursos`: curso Flores de Bach y formulario de interés para una futura edición online.
- `/privacidad`: información de la versión de pruebas, con datos del responsable y canal de solicitudes pendientes de revisión.
- Las rutas desconocidas muestran una página 404. `vercel.json` permite cargar directamente las rutas en Vercel.

Los textos, metadatos, enlaces, ofertas y datos de contacto editables se centralizan en `src/content/siteContent.js`. Las fotos se reemplazan al recibir originales autorizados. Revisa `CONTENT_STATUS.md` antes de editar o preparar un lanzamiento.

## Desarrollo

```sh
npm install
npm run dev
```

Para guardar formularios durante el desarrollo local, ejecuta en otra terminal (Python 3.12 o superior):

```sh
python -m backend.dev_server
```

Vite envía `/api` al servidor local en el puerto 3001. En Vercel, `api/interests.py` se publica como función Python y las rutas del frontend conservan su recarga directa. No hay dependencias Python externas.

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

Las pruebas unitarias cubren páginas, componentes, skeletons, formularios, contexto, servicios y temporizadores. El backend incluye validación, persistencia y manejo HTTP con servicios simulados:

```sh
python -m unittest discover -s tests -v
```

## Metadatos y prerenderizado

El frontend actual se sirve como una aplicación Vite de renderizado en navegador. Cambia títulos, descripciones y etiquetas sociales al abrir cada ruta. Para vistas previas sociales consistentes con rastreadores que no ejecuten JavaScript, hay que decidir e implementar prerenderizado o generación estática antes del lanzamiento. Los dominios de revisión quedan marcados `noindex`; los dominios canónicos configurados pueden indexarse.

## Compilación

```sh
npm run build
npm run preview
```

Los dos formularios guardan en `public.interest_registrations` del proyecto Supabase `vsbolndzzkrhadprdlto`. La API usa una clave publicable con permisos exclusivos de inserción, RLS y límites de frecuencia en la base. No utiliza claves privilegiadas. La URL y clave publicable están en `backend/supabase_config.py`; pueden sustituirse mediante `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` en el servidor.

Guía de comprobación manual: [docs/PRUEBAS_FORMULARIOS.md](docs/PRUEBAS_FORMULARIOS.md). Esquema y acceso: [database/README.md](database/README.md).

Repositorio: https://github.com/javicoderh/nicolaszamara
