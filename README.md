# Nicolas Zamara front

Aplicación de la consulta terapéutica Nicolas Zamara: React + Vite, API Python y persistencia en Supabase.

## Páginas disponibles

- `/`: inicio, áreas de trabajo, curso, presentación y registro de interés en naturaleza.
- `/consulta`: primera atención, evaluación individual, datos prácticos y consulta de disponibilidad.
- `/cursos`: curso Flores de Bach y formulario de interés para una futura edición online.
- `/privacidad`: información de la versión de pruebas, con datos del responsable y canal de solicitudes pendientes de revisión.
- Las rutas desconocidas muestran una página 404. `vercel.json` permite cargar directamente las rutas en Vercel.

Los textos, metadatos, enlaces, ofertas y datos de contacto editables se centralizan en `src/content/siteContent.js`. Las fotos se reemplazan al recibir originales autorizados. Revisa `CONTENT_STATUS.md` antes de editar o preparar un lanzamiento.

La línea visual sigue las capturas facilitadas en `fotos estilo web`: cabecera marino, firma manuscrita provisional, títulos Italiana, cuerpo Poppins, acciones verdes y footer con ilustraciones botánicas. Las fuentes están alojadas en el proyecto con sus licencias. Guía de edición: [docs/LINEA_GRAFICA.md](docs/LINEA_GRAFICA.md).

## Desarrollo

```sh
npm install
npm run dev
```

Para guardar formularios y usar el setter durante el desarrollo local, crea un entorno con Python 3.12 o superior e instala la dependencia de zonas horarias:

```sh
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m backend.dev_server
```

Vite envía `/api` al servidor local en el puerto 3001. En Vercel, las rutas `api/interests.py` y `api/chat.py` se publican como funciones Python y las rutas del frontend conservan su recarga directa. `requirements.txt` fija los datos de zonas horarias usados por el setter.

## Asistente de servicios

El setter orienta sobre consulta, terapias, cursos y naturaleza. OpenAI elige `topic`, `response_key`, `action` y `contact_signal`; el servidor valida la combinación y entrega textos de `config/chatbot/responses.es.json`. El modelo no escribe URLs ni registra contactos. RAG no está implementado.

La bienvenida es local. El servidor limita cada conversación a 10 respuestas y 12 intentos, y cada visitante a 30 respuestas, 36 intentos y tres conversaciones nuevas por día de Santiago. Aplica una pausa de 30 minutos tras cerrar. Una cookie firmada `HttpOnly` identifica el navegador. Supabase autoriza atómicamente las reservas y el presupuesto; los reintentos recuperan resultados mediante `request_id`. La captura independiente permite elegir teléfono, WhatsApp o correo, revisar y autorizar, y guardar en el pipeline existente `/api/interests`. Hotmart usa `siteSettings.courseUrl`.

Configura las variables de `.env.example` en el proceso Python o en Vercel: clave OpenAI, clave secreta de Supabase, secreto de cookie y presupuesto/tarifas explícitos. No uses prefijos `VITE_`. `OPENAI_MODEL` conserva `gpt-4.1-mini` por defecto. El servidor local carga únicamente las variables de servidor admitidas desde `.env.local` y `.env`, sin sobrescribir las del proceso; en Vercel se usan las variables del proyecto. Sin clave de OpenAI, la captura y los enlaces siguen disponibles si identidad y almacenamiento están configurados. Sin almacenamiento autorizado, no hay nuevas llamadas al modelo.

Todos los nuevos intereses requieren teléfono internacional y una preferencia explícita entre videollamada, teléfono y mail. Los formularios de naturaleza y cursos online mantienen el correo obligatorio. El selector usa íconos con radios y tooltips al pasar el mouse o enfocar con teclado. Ver [el contrato de contacto](docs/CONTACTO_INTERESES.md).

No guardamos texto libre ni historial en Supabase: solo cuotas, huellas HMAC, tokens y respuestas aprobadas. Los contactos autorizados se guardan separadamente en `interest_registrations`. Revisa [la implementación, activación y límites de las pruebas](docs/IMPLEMENTACION_SETTER.md) antes del despliegue público. Falta aprobar y operar la retención; no se activó borrado automático.

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
.venv\Scripts\python -m unittest discover -s tests -v
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
