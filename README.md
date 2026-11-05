# Nicolás Zamara · Consulta, formación y naturaleza

Sitio de Nicolás Zamara con páginas de consulta y terapias, cursos, naturaleza, formularios de interés y un asistente conversacional. Combina React y Vite, funciones HTTP en Python y persistencia en Supabase. El build genera HTML estático por ruta que React hidrata en el navegador.

Repositorio: [javicoderh/nicolaszamara](https://github.com/javicoderh/nicolaszamara).

**Estado documentado al 1 de noviembre de 2026:** el código local incluye consentimiento, instrumentación de marketing, adaptador GA4, SEO, prerenderizado e importación CSV de movimientos y gasto. La plantilla mantiene desactivadas la medición, la indexación y la escritura del libro monetario. Las cuentas de analítica y varias comprobaciones de lanzamiento siguen pendientes. Código implementado no equivale a servicio activado o despliegue verificado.

## Índice

- [Requisitos](#requisitos)
- [Desarrollo local](#desarrollo-local)
- [Variables de entorno](#variables-de-entorno)
- [Páginas y navegación](#páginas-y-navegación)
- [Arquitectura](#arquitectura)
- [Contenido e identidad visual](#contenido-e-identidad-visual)
- [Cargas y skeletons](#cargas-y-skeletons)
- [Formularios y avisos](#formularios-y-avisos)
- [Asistente conversacional](#asistente-conversacional)
- [Administración de intereses](#administración-de-intereses)
- [API HTTP](#api-http)
- [Consentimiento y medición](#consentimiento-y-medición)
- [SEO y compilación](#seo-y-compilación)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Importación monetaria CSV](#importación-monetaria-csv)
- [Métricas y exportación de reportes](#métricas-y-exportación-de-reportes)
- [Pruebas y verificaciones](#pruebas-y-verificaciones)
- [Despliegue y pendientes](#despliegue-y-pendientes)
- [Documentación](#documentación)

## Requisitos

| Herramienta | Versión o uso |
| --- | --- |
| Node.js y npm | Referencia registrada: Node 24.18.0 y npm 11.16.0. |
| Python | 3.12 o superior para API y herramientas de servidor. |
| React / React DOM | 19.2.8. |
| Vite | 8.0.3. |
| Vitest | 5.0.5. |
| React Testing Library | 16.3.0; DOM Testing Library 10.4.1. |
| JSDOM / jest-dom | 27.1.0 / 6.9.1. |
| tzdata | 2026.5, fijada en requirements.txt para las zonas horarias. |

Las dependencias JavaScript están fijadas en [package.json](package.json). Actualmente `package-lock.json` está ignorado por Git; el procedimiento documentado usa `npm install`. No hay scripts de lint ni comprobación de tipos definidos en el paquete.

Para explorar las páginas basta el frontend. Los formularios necesitan API y esquema de base de datos; el asistente añade identidad firmada, almacenamiento de cuotas, presupuesto y configuración de OpenAI. Las pruebas unitarias usan mocks y no requieren credenciales reales.

## Desarrollo local

Ejecutar desde la raíz del repositorio. Los ejemplos de Python usan PowerShell en Windows.

### Instalación

```powershell
npm install
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

No es necesario activar el entorno virtual si se usa su ejecutable. En Linux o macOS, el equivalente es `.venv/bin/python`.

Si todavía no existe `.env.local`, copiar la plantilla:

```powershell
Copy-Item .env.example .env.local
```

Si ya existe, conservar sus valores y comparar manualmente las opciones de [.env.example](.env.example). Los archivos de entorno locales están excluidos de Git. Completar solo las capacidades que se vayan a utilizar.

### Ejecución conjunta

```powershell
npm run dev
```

Este comando inicia Python con el entorno virtual local si está disponible, espera la respuesta de `/api/health` y después inicia Vite. Si Python no puede arrancar o alguno de los procesos termina, informa el error y detiene el otro proceso. Ctrl+C cierra ambos. No ejecutar otro servidor Python en el puerto 3001 al usar este comando.

Abrir la URL indicada por Vite, normalmente `http://localhost:5173`. La API escucha en `127.0.0.1:3001`; [vite.config.js](vite.config.js) envía `/api` a ese puerto y conserva el host del navegador para validar el origen. Las llamadas del cliente usan el mismo origen del frontend.

Para trabajar solo en el frontend, usar `npm run dev:frontend`. Para iniciar los procesos en terminales independientes, usar `npm run dev:api` y `npm run dev:frontend`.

El servidor Python es una herramienta de desarrollo. En Vercel, los archivos de `api/` se ejecutan como funciones independientes.

### Comandos

| Comando | Resultado |
| --- | --- |
| `npm run dev` | API Python y, cuando está lista, Vite con recarga y proxy. |
| `npm run dev:frontend` | Solo Vite; requiere API separada para formularios y administración. |
| `npm run dev:api` | Solo API Python, con comprobación de disponibilidad local. |
| `npm run build` | Cliente, metadatos, bundle SSR de compilación y HTML prerenderizado. |
| `npm run preview` | Vista previa de los archivos compilados en dist/. |
| `npm test` | Ejecución única de Vitest. |
| `npm run test:watch` | Vitest en modo observación. |
| `.\.venv\Scripts\python.exe -m unittest discover -s tests -v` | Pruebas unitarias del backend. |

`npm run preview` no levanta Python ni tiene el proxy configurado en `server.proxy`. Para probar formularios localmente con API, usar `npm run dev`.

Si `/api/admin` responde 502 en localhost, comprobar que la API esté disponible en el puerto 3001 y revisar la salida de la terminal. Un 401 JSON al consultar sesión sin cookie es normal: significa que la API responde y corresponde mostrar el acceso. Un 503 JSON indica que la operación no pudo completarse en el backend; revisar su configuración y conexión. El comando de desarrollo conjunto evita iniciar Vite antes de que Python esté disponible.

## Variables de entorno

### Servidor

Estas variables pertenecen a Python o al entorno del servidor. **Nunca usar el prefijo VITE_ para claves secretas, identidad o presupuesto.**

| Variable | Responsabilidad |
| --- | --- |
| `SUPABASE_URL` | Sustituye el proyecto público predeterminado por otro con esquema compatible. |
| `SUPABASE_PUBLISHABLE_KEY` | Sustitución opcional de la clave publicable de formularios web. No reemplazarla por una clave privilegiada. |
| `SUPABASE_SECRET_KEY` | Clave de servidor para RPC del setter, contacto del chat, contador Hotmart y libro monetario. |
| `CHAT_COOKIE_SECRET` | Secreto aleatorio de al menos 32 caracteres, estable entre instancias, para firmar identidad. |
| `OPENAI_API_KEY` | Acceso al proveedor, sujeto además a cuotas y presupuesto. |
| `OPENAI_MODEL` | Modelo de API; predeterminado del código: gpt-4.1-mini. |
| `CHAT_INPUT_USD_PER_MILLION` | Tarifa explícita de entrada en USD por millón de tokens del modelo elegido. |
| `CHAT_OUTPUT_USD_PER_MILLION` | Tarifa explícita de salida en USD por millón de tokens. |
| `CHAT_DAILY_BUDGET_MICRO_USD` | Presupuesto global diario explícito; 1 USD = 1.000.000 micro-USD. |
| `APP_ENV` | development en la plantilla; producción y el entorno Vercel intervienen en cookies seguras. |
| `OPENAI_REASONING_EFFORT` | Control opcional de razonamiento, sujeto a compatibilidad con el modelo. |
| `OPENAI_MAX_OUTPUT_TOKENS` | 512 por defecto; rango admitido de 64 a 25.000. Afecta a la reserva presupuestaria. |
| `OPENAI_REQUEST_TIMEOUT_SECONDS` | 15 segundos por defecto; rango admitido de 5 a 25. |
| `CHAT_TEST_METRICS` | Control opcional para exponer configuración de pruebas aisladas del setter. |
| `MARKETING_LEDGER_ENABLED` | Escritura monetaria, desactivada por defecto; exige esquema y credenciales de servidor. |
| `MARKETING_REPORTS_ENABLED` | Lectura agregada para exportaciones administrativas; false por defecto, independiente de importaciones. |

[backend/local_environment.py](backend/local_environment.py) lee solo las variables de servidor admitidas, primero `.env.local` y después `.env`, sin sobrescribir las del proceso. No interpreta los archivos como scripts de shell. El servidor local y las herramientas que invocan ese cargador usan esta precedencia; Vercel usa las variables configuradas para su entorno.

Las tarifas no se deducen del nombre del modelo: verificarlas al cambiarlo. Las etiquetas históricas «Sol» o «Luna» no sustituyen un identificador de API ni acreditan equivalencia entre modelos.

### Cliente y compilación

| Variable | Uso y valor de la plantilla |
| --- | --- |
| `VITE_ANALYTICS_ENABLED` | false; permite medición en entornos autorizados y con consentimiento. |
| `VITE_ANALYTICS_QA` | false; permite comprobar medición en QA. |
| `VITE_GA4_MEASUREMENT_ID` | ID público de GA4; vacío. |
| `VITE_CLARITY_PROJECT_ID` | Configuración reservada para Clarity; integración pendiente. |
| `SEO_ALLOW_INDEXING` | false; solo habilita indexación en combinación con VERCEL_ENV=production. |
| `VERCEL_ENV` | Entorno aportado por Vercel; participa en la decisión de indexación. |

Vite incorpora las variables `VITE_` al cliente durante la compilación. Cambiarlas requiere reiniciar desarrollo o volver a compilar y desplegar. La configuración reconoce `www.nicolaszamara.com` y `nicolaszamara.com`; esto no demuestra titularidad ni configuración DNS.

## Páginas y navegación

| Ruta | Contenido |
| --- | --- |
| `/` | Presentación, áreas, consulta, curso, biografía breve y formulario de naturaleza. |
| `/consulta` | Primera atención, pasos, datos prácticos, preguntas frecuentes, WhatsApp y formulario de disponibilidad. |
| `/terapias` | Catálogo de ocho terapias con acceso a consulta. |
| `/cursos` | Flores de Bach, enlace a Hotmart e interés en futura edición online. |
| `/naturaleza` | Relato y formulario para próximos encuentros de baños de bosque. |
| `/sobre-mi` | Presentación personal de Nicolás. |
| `/chatbot` | Vista amplia del asistente de servicios. |
| `/admin` | Acceso privado, resumen de intereses, filtros, detalle y cambio de contraseña. |
| `/privacidad` | Información de datos, asistente y medición; conserva pendientes de aprobación. |
| Rutas desconocidas | Página no encontrada; el build incluye 404.html. |

El catálogo y el origen canónico viven en [src/config/siteRoutes.js](src/config/siteRoutes.js); los metadatos editables, en [src/content/siteContent.js](src/content/siteContent.js).

La navegación usa History API mediante `useSiteNavigation`, sin React Router. Los enlaces externos, descargas, pestañas nuevas y clics modificados mantienen el comportamiento del navegador. La aplicación sincroniza atrás/adelante y fragmentos; al revelar la página desplaza al ancla solicitada o al inicio.

## Arquitectura

```text
api/                     Funciones HTTP de Vercel y del servidor local
backend/                 Validación, identidad, proveedores y persistencia
config/
  chatbot/               Política, prompts, respuestas, conocimiento y casos
  interests/             Preferencias de contacto y versión de consentimiento
  marketing/             Registro de campañas y plantillas CSV
database/                Scripts SQL históricos y ampliaciones
docs/                    Contratos, guías, planes y evidencias
public/                  Fotografías, marca, fuentes y recursos estáticos
scripts/                 SEO, prerenderizado y herramientas administrativas
src/
  app/                   Proveedores, rutas y shell de carga
  components/            Componentes, CSS, skeletons y pruebas
  config/                Rutas, constante de carga y catálogo de analítica
  content/               Textos, servicios, metadatos y contacto
  contexts/              Contenido, chatbot, hidratación y consentimiento
  hooks/                 Cargas, formularios, navegación y medición
  pages/                 Páginas, estilos, skeletons y pruebas
  services/              Transporte, SEO, consentimiento y medición
  test/                  Preparación de JSDOM y fixtures compartidos
supabase/migrations/     Migraciones de libro monetario y administración; historial parcial
tests/                   Pruebas unitarias Python, SQL y fixtures
chatbot testing/         Herramientas y evidencias de evaluación manual
```

[AGENTS.md](AGENTS.md) establece responsabilidad única, contratos pequeños, presentación separada de datos y contextos para estado realmente compartido. Cada componente debe tener carpeta, CSS, skeleton y pruebas propios. Los estilos globales de `src/index.css` contienen fundamentos compartidos.

`SiteContentContext` expone configuración; `ChatbotContext` conserva sesión, mensajes, borrador y apertura; `AnalyticsConsentContext` coordina preferencias; `HydrationContext` distingue HTML estático de interfaz con handlers montados. Los campos específicos de los formularios permanecen actualmente en estado local.

## Contenido e identidad visual

| Qué editar | Fuente |
| --- | --- |
| Páginas, metadatos, terapias, enlace del curso y contacto | [src/content/siteContent.js](src/content/siteContent.js). |
| Conocimiento, prompts, política y respuestas del asistente | [config/chatbot/](config/chatbot/). |
| Preferencias de contacto y versión | [config/interests/contact.config.json](config/interests/contact.config.json), coordinadas con backend y base. |
| Fotografías, terapias y marca | public/photos/, public/therapies/ y public/brand/. |
| Tipografía y recursos gráficos | [Línea gráfica](docs/LINEA_GRAFICA.md) y public/fonts/, con licencias locales. |

La identidad usa cabecera marino, acciones verdes, títulos Italiana, cuerpo Poppins y detalles botánicos. Los cambios comerciales que afecten al asistente requieren revisar también su catálogo de conocimiento.

El código ya contiene WhatsApp y fotografías. Permanecen vacíos varios datos de atención: correo público, dirección, accesibilidad, horario, duración y precio. El destinatario de avisos internos es una configuración separada del correo público del sitio.

[CONTENT_STATUS.md](CONTENT_STATUS.md) conserva pendientes editoriales y de permisos, pero también afirmaciones históricas desactualizadas sobre fotografías, WhatsApp y avisos. Contrastar sus casillas con el código y las guías específicas. No completar datos comerciales, credenciales personales ni autorizaciones por inferencia.

## Cargas y skeletons

El contrato de [AGENTS.md](AGENTS.md) usa `BASE_DELAY_MS`, centralizada en [src/config/loading.js](src/config/loading.js):

- Sin servicio externo: skeleton inmediato y contenido tras **800 ms**.
- Con servicio externo: resultado o error tras **la duración real del intento más 800 ms**.
- Cada carga o recarga respeta el mismo ciclo; las regiones independientes conservan datos, error y espera propios.
- Una unidad de carga comparte estado con sus hijos; no acumula delays por cada nivel.
- Los skeletons no tienen espera recursiva. Temporizadores y respuestas obsoletas se limpian o descartan al desmontar.

`usePageDelay` coordina páginas. `useDelayedOperation`, `useInterestSubmission` y `useContactCapture` coordinan operaciones remotas. El shell conserva contenido para prerenderizado y controla su revelado.

Faltan mediciones reproducibles de al menos 30 escenarios por consumo externo: condiciones de red/caché, carga inicial y recarga, duración real, resultado y tiempo de revelado; tamaño de muestra, media, mediana, mínimo, máximo, desviación estándar, p90 y p95. Los mocks y timeouts no sustituyen esas mediciones.

## Formularios y avisos

Todos los nuevos contactos requieren nombre, correo, teléfono internacional y preferencia explícita entre **videollamada, teléfono y WhatsApp**. La versión vigente es `2026-10-23-contact-v3`. Correo como preferencia y contratos con un único dato de contacto pertenecen a versiones anteriores.

| Formulario | Particularidades |
| --- | --- |
| Consulta | Interés consultation; solicita disponibilidad, sin confirmar hora. |
| Curso online | Interés online; país obligatorio y experiencia previa opcional. |
| Naturaleza | Interés nature; ciudad obligatoria; aparece en Inicio y Naturaleza. |
| Contacto del chat | Servicio, revisión y autorización explícita; conversación e identificador de reintento. |

La autorización para responder al interés es obligatoria. Las novedades tienen una casilla independiente, opcional y desmarcada. La versión de revisión pide datos ficticios y no solicita antecedentes clínicos. Un registro no confirma reserva, inscripción ni pago.

Los formularios envían a `/api/interests`. El cliente confirma éxito solo tras HTTP 201 con `status=saved` y los 800 ms adicionales. Los errores conservan los campos; el límite de frecuencia tiene estado propio.

`public.interest_registrations` guarda contacto, interés, autorizaciones, versión y fechas; distingue `source` (form/chatbot) y `source_path`, sin query string ni fragmento. Validación del servidor, campo trampa y restricciones de base complementan la validación del navegador. No hay listado público de contactos.

Los formularios web usan una clave publicable con inserción limitada. El contacto del chat usa RPC de servidor, verifica identidad/conversación y reutiliza `request_id` al reintentar. Los visitantes no asignan fechas ni estados administrativos.

### Avisos por correo

El trigger de [database/interest_email_notifications.sql](database/interest_email_notifications.sql) encola un aviso mediante pg_net y FormSubmit después del commit de cada nueva alta. Cubre formularios, chat e inserciones directas; no envía históricos ni añade una espera al frontend. El interés permanece guardado aunque falle el correo.

La guía operativa registra como destino vigente `hola@nicolaszamara.com`. La activación anterior de otra dirección no acredita la de este destino: confirmar activación y recepción de un aviso posterior antes de considerarlo operativo. Encolar o recibir aceptación HTTP no demuestra entrega al buzón. No hay reintentos automáticos.

Los datos del aviso también se transmiten a FormSubmit, lo que debe contemplarse en privacidad. Operación, diagnóstico y desactivación: [docs/AVISOS_INTERESES_EMAIL.md](docs/AVISOS_INTERESES_EMAIL.md).

## Asistente conversacional

Disponible como panel flotante y en `/chatbot`. La bienvenida es local. La primera apertura obtiene sesión y solicita renovación; minimizar y navegar internamente mantiene la conversación en memoria. Al recargar el documento, el asistente renueva al abrirse, respetando cuotas y pausas. «Recuperar estado» consulta la sesión sin iniciar otra conversación.

OpenAI recibe mensaje e historial reciente, hechos del catálogo y hasta ocho ejemplos revisados habilitados, cuando están disponibles. Devuelve `topic`, `response_key`, `action`, `contact_signal` y `reply`. El servidor valida estructura y combinaciones y mantiene texto protegido en determinados casos. Las respuestas ordinarias pueden ser generadas por el modelo; URLs, acciones y persistencia proceden del servidor. No hay RAG ni entrenamiento automático de pesos.

Los campos del formulario de contacto se envían por separado y no forman parte del contexto del modelo. Supabase conserva cuotas, presupuesto, intentos, huellas HMAC y resultados del asistente. No se persiste automáticamente el historial completo ni todo el texto libre del visitante. Los mensajes sí se transmiten a OpenAI; la interfaz pide evitar datos sensibles.

### Identidad y límites

- Cookie firmada de navegador, HttpOnly, hasta ocho días y Secure en producción. No hay cuentas ni identificación entre dispositivos.
- 10 respuestas completadas y 12 intentos de proveedor por conversación.
- 30 respuestas, 36 intentos y tres conversaciones nuevas por visitante y día de America/Santiago.
- Pausa de 30 minutos después del cierre.
- Cuotas y reserva presupuestaria autorizadas atómicamente antes de llamar al modelo.
- Captura separada, sin consumir ronda; sin reintento automático del proveedor para corregir salidas inválidas.

Sin almacenamiento autorizado no hay nuevas llamadas al modelo. Sin clave de OpenAI, enlaces y captura pueden seguir disponibles si identidad y almacenamiento están configurados. Tarifas y presupuesto requieren configuración explícita; las cifras históricas de los documentos no acreditan los valores de un entorno desplegado.

La opción pública «Sugerir una mejor respuesta» fue retirada; `POST /api/chat_feedback` responde **410**. Los registros y ejemplos históricos siguen privados. [La guía de aprendizaje](docs/APRENDIZAJE_CHATBOT.md) marca el procedimiento anterior como histórico; `scripts/review_chatbot_feedback.py` conserva revisión administrativa con credenciales de servidor.

No hay borrado automático activado. La retención de metadatos y contactos requiere definición y operación aprobadas. Detalles: [implementación](docs/IMPLEMENTACION_SETTER.md), [panel flotante](docs/ASISTENTE_FLOTANTE.md) y [renovación](docs/REFRESH_CHATBOT.md).

## Administración de intereses

`/admin` ofrece acceso privado para el usuario inicial `Nzamara`. Su contraseña se conserva únicamente como hash con sal en la base y se valida en Python. No hay credenciales incorporadas al frontend ni registro público de administradores.

El dashboard incluye total histórico, resumen por servicio, lista paginada, filtros por día, mes, rango inclusivo y servicio, actualización manual y modal de detalle. Las fechas usan `America/Santiago`. El resumen cubre todo el resultado del filtro, no solo la página visible; cada página contiene hasta 20 solicitudes.

El detalle permite **Marcar como leído**. El dashboard abre en **Nuevos (sin leer)** y permite filtrar también Leídos o Todos. La lectura se guarda en la base con fecha y administrador; actualiza el resumen y conserva los registros en el historial. Es independiente de los estados de gestión Contactado/Cerrado y no se activa automáticamente al abrir el detalle.

El cambio de contraseña exige la actual y una nueva de entre 12 y 128 caracteres. Al completarse revoca todas las sesiones y pide ingresar nuevamente. Las sesiones duran hasta ocho horas, con cookie HttpOnly y SameSite=Strict; los intentos se limitan en base de datos. Cada consulta verifica la sesión en el servidor.

La ruta no carga el asistente, consentimiento ni sensores de marketing; permanece fuera del sitemap y con noindex incluso en producción. Su HTML prerenderizado solo contiene la espera inicial, sin registros. Requiere `SUPABASE_SECRET_KEY` y la migración administrativa en el servidor. Esquema, operación, recuperación y verificaciones: [docs/ADMIN.md](docs/ADMIN.md).

## API HTTP

| Método y ruta | Responsabilidad |
| --- | --- |
| POST /api/interests | Validar y guardar intereses web o contacto autorizado del chat. |
| GET /api/chat | Obtener sesión y emitir identidad firmada cuando corresponde. |
| POST /api/chat | Mensajes y comandos de sesión, captura, renovación y reinicio. |
| POST /api/hotmart_click | Registrar clic con UUID, origen y ruta; sin consulta pública de contadores. |
| POST /api/chat_feedback | Endpoint retirado; devuelve HTTP 410. |
| POST /api/admin | Inicio/cierre de sesión, resumen, detalle y cambio de contraseña del administrador. |

Los handlers responden JSON con `Cache-Control: no-store` y comparten controles HTTP; los endpoints activos validan origen. Los límites de cuerpo son 8 KB para intereses, 64 KB para comandos del chat, 1 KB para clics y 4 KB para administración. Las claves privilegiadas permanecen en Python y el código evita registrar cuerpos con datos personales.

El contador Hotmart distingue home, course y chatbot, deduplica por UUID y limita a 60 eventos por navegador y minuto. El cliente lo envía con consentimiento y medición habilitada, sin bloquear el enlace. Es de mejor esfuerzo y **no acredita compras ni inscripciones**. Véase [origen y Hotmart](docs/ORIGEN_INTERESES_Y_HOTMART.md).

## Consentimiento y medición

El panel permite aceptar, rechazar o configurar analítica y experiencia por separado. Las preferencias son versionadas, duran hasta 180 días y se reabren desde el footer. Son independientes de contacto y novedades.

Medir exige flag de entorno, entorno permitido y consentimiento vigente; GA4 necesita además un ID válido. Sin permiso no se emiten eventos de marketing ni se envía el contador Hotmart desde la aplicación. Revocar vacía la cola, deshabilita el adaptador y limpia las cookies contempladas por el servicio.

Implementado:

- Catálogo cerrado de 17 eventos con validadores; experiment_exposure no tiene IDs autorizados.
- Vistas, navegación, CTA, WhatsApp, Hotmart, exposición, formularios y actividad del asistente.
- Exposición con al menos 50 % visible durante un segundo y pestaña visible.
- Cola de hasta 50 eventos y vigencia de 30 segundos, carga única de script y adaptador GA4.
- Contexto y referrer saneados, sin query, fragmentos, campos de contacto ni conversación.
- Atribución consentida de sesión de 30 minutos; campañas por tupla exacta aprobada. El registro de campañas está vacío.
- generate_lead solo después de guardado confirmado y delay; un clic o intento no representa ingreso.

GA4 requiere cuenta, ID y validación externa. Clarity tiene categoría y variable reservadas, pero su integración está pendiente. Search Console, Looker, tablero y experimentos no están operativos por la presencia de estos contratos. No calcular tráfico total ni cobertura global a partir de visitantes medidos solo con consentimiento.

Estado: [docs/marketing/ESTADO.md](docs/marketing/ESTADO.md). Eventos, KPI y denominadores: [docs/CONTRATOS_MEDICION_MARKETING.md](docs/CONTRATOS_MEDICION_MARKETING.md).

## SEO y compilación

```powershell
npm run build
npm run preview
```

El build ejecuta cuatro pasos:

1. Vite compila el cliente en `dist/`.
2. `scripts/generate_seo.mjs` genera HTML por ruta con metadatos, canonical, etiquetas sociales y datos estructurados; también robots.txt, sitemap.xml y 404.html.
3. Vite compila `src/entry-server.jsx` en `.preview/marketing-ssr/`.
4. `scripts/prerender.mjs` inserta contenido React de nueve rutas y la vista 404 en sus HTML. Administración contiene únicamente su shell privado de carga.

El SSR ocurre en compilación; no hay servidor React por petición. El build no solicita datos de negocio a OpenAI ni Supabase. `src/main.jsx` usa hydrateRoot con HTML previo y createRoot con un contenedor vacío.

El contenido estático existe sin JavaScript y el CSS lo revela tras 800 ms. Los formularios permanecen deshabilitados hasta hidratar para impedir envíos sin handlers. El fallback estático no sustituye las funciones interactivas.

### Indexación y alojamiento

- La indexación exige `SEO_ALLOW_INDEXING=true` y `VERCEL_ENV=production` al compilar; los builds ordinarios mantienen noindex,nofollow.
- /chatbot, /privacidad, /admin y la vista 404 mantienen noindex incluso con indexación habilitada.
- El sitemap solo incluye rutas indexables si está habilitado ese permiso. robots.txt permite rastreo; la indexación se controla mediante metadatos.
- El canonical usa `https://www.nicolaszamara.com`; confirmar dominio y titularidad antes de activar indexación.
- vercel.json sirve dist/ y reescribe las ocho rutas interiores a su propio index.html, sin rewrite global a la portada.
- Otro alojamiento debe servir directorios, recursos y 404.html, y resolver la API por separado. Verificar el código HTTP 404 real en el destino.

## Base de datos y migraciones

La configuración pública actual apunta a `vsbolndzzkrhadprdlto`. Cambiar de proyecto requiere variables y esquema compatible.

| Área | Acceso previsto |
| --- | --- |
| public.interest_registrations | Inserción limitada; sin lectura, actualización ni borrado públicos. |
| Cuotas, solicitudes y presupuesto | Tablas privadas y RPC exclusivas de servidor. |
| Ejemplos y propuestas históricas | Privados, con revisión administrativa. |
| Clics Hotmart | Tablas y contadores privados mediante RPC. |
| Avisos de intereses | Trigger y registro privado de encolado. |
| Libro monetario | Tablas privadas, RLS y RPC exclusiva de servidor. |
| Administradores y sesiones | Hashes y sesiones privados; consultas de intereses solo mediante API autenticada y RPC de servidor. |

`database/` conserva scripts históricos y ampliaciones. `supabase/migrations/` contiene libro monetario, administración, lectura de intereses y `20261101201452_marketing_report_snapshot`, pero **no representa el historial completo de la base**. Antes de aplicar cambios o usar db push, conciliar scripts e historial remoto. No recrear tablas ni ejecutar los SQL por orden alfabético.

[database/README.md](database/README.md) documenta la evolución y conserva apartados históricos. Para contactos nuevos prevalecen el contrato v3 y el código vigente. Las verificaciones SQL de tests/ requieren esquema y entorno autorizados y no se ejecutan mediante npm test ni unittest discover.

## Importación monetaria CSV

M11 valida movimientos comerciales y gasto y permite aplicar lotes por CLI administrativa. No hay endpoint público de importación, webhook de compras operativo ni tablero de ingresos.

Validación sin leer credenciales ni escribir almacenamiento:

```powershell
.\.venv\Scripts\python.exe -m scripts.import_marketing_data tests/fixtures/marketing/movements.csv --kind movements --dry-run
```

Para archivos propios, usar `--kind movements` o `--kind spend` y las cabeceras de [las plantillas](config/marketing/import-templates/). Sin `--apply` también se hace dry-run. El fixture es sintético y solo debe validarse.

Reglas:

- UTF-8, encabezados exactos, máximo 10 MB y 10.000 filas; un error invalida el lote.
- Dinero exacto con Decimal y unidades menores, sin float ni conversión implícita; CLP sin decimales y USD/EUR con hasta dos.
- Referencias estables, reimportación idempotente y transacción atómica.
- Reembolsos limitados al saldo y revisión de gasto corregido. adjustment se rechaza mientras no se defina su signo económico.
- Campañas del catálogo aprobado; sin evidencia, atribución unknown, sin reconstrucción con datos personales.

Escribir exige `--apply`, `MARKETING_LEDGER_ENABLED=true`, credenciales de servidor y esquema verificado. El dry-run valida el archivo; conflictos con históricos y saldos se verifican al aplicar. La evidencia de M11 usa datos sintéticos revertidos, sin importaciones comerciales reales. Detalles: [M11_IMPORTACION.md](docs/marketing/M11_IMPORTACION.md).

## Métricas y exportación de reportes

M13 implementa cálculos y exportación administrativa de agregados. La conexión de Hotmart se aplazó al final por instrucción del usuario. El exportador separa ingresos, campañas, embudo, calidad y cohortes; calcula importes con enteros/Decimal, conserva monedas y fuentes separadas y usa N/D cuando falta evidencia.

Ejemplo completamente ficticio, sin acceso a credenciales ni base:

```powershell
.\.venv\Scripts\python.exe -m scripts.export_marketing_report --input tests/fixtures/marketing/report_synthetic.json --output reports/ejemplo-m13
```

La lectura de base usa una RPC exclusiva de servidor y exige `MARKETING_REPORTS_ENABLED=true` en el proceso. No habilita escrituras ni publica una descarga en `/admin`. Los datos comerciales individuales, contactos, identificadores de navegador y referencias de transacción no se exportan.

Los archivos se escriben en un directorio nuevo sin sobrescribir reportes anteriores. `reports/` está excluido de Git/Vercel y de la lectura de archivos de Vite. Los snapshots de la base indican las importaciones como incompletas hasta contar con una declaración explícita de conciliación; no se asume que ausencia de gasto equivale a gasto cero.

La hoja privada de Google conserva pendiente su creación/importación por autenticación del conector. La conciliación monetaria real y las fuentes GA4/Search Console también requieren datos externos. El código y la conciliación sintética están verificados; no se da por completado el tablero de M14. Contrato, fórmulas, comandos y evidencias: [docs/marketing/CONCILIACION.md](docs/marketing/CONCILIACION.md).

## Pruebas y verificaciones

El proyecto exige **pruebas unitarias**: Vitest, React Testing Library y JSDOM para React; unittest para Python; scripts SQL para funciones de base. Los servicios externos se simulan y los tiempos usan temporizadores falsos. No se incorporan pruebas de integración ni de extremo a extremo.

Frontend:

```powershell
npm test
npm run test:watch
```

Alternativa con un worker y el pool utilizado en el registro de marketing:

```powershell
node node_modules/vitest/vitest.mjs run --pool=vmThreads --maxWorkers=1 --testTimeout=20000
```

Prueba dirigida:

```powershell
npm test -- src/hooks/useInterestSubmission/useInterestSubmission.test.js
```

Backend:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Se prueban páginas, componentes y skeletons, formularios, contextos, navegación, hidratación, temporizadores, SEO, consentimiento, analítica, identidad, validación, coordinación y adaptadores con mocks. Los SQL comprueban funciones, permisos, idempotencia y rollback con fixtures.

### Última verificación local registrada

Verificación del 1 de noviembre de 2026, después de implementar administración:

| Comprobación | Resultado |
| --- | --- |
| Vitest | 267 pruebas aprobadas en 70 archivos. |
| Python | 131 pruebas aprobadas, incluidas 24 de reportes M13. |
| Build | Cliente, SSR y nueve rutas/404 correctos; indexación desactivada. |
| Administración SQL | Sesiones, permisos, cambio de contraseña y resumen verificados con rollback de datos sintéticos. |
| Acceso administrativo real | Inicio, consulta del resumen y cierre correctos desde Python; sin modificar intereses. |

Estos resultados corresponden al estado revisado, no garantizan cambios posteriores ni activación remota. Las comprobaciones manuales de interfaz, HTTP del alojamiento, semántica del modelo y entrega de correo se documentan por separado. Los scripts de `chatbot testing/` pueden llamar a proveedores reales; no forman parte de la suite unitaria.

## Despliegue y pendientes

[vercel.json](vercel.json) configura build con npm, salida dist/, funciones api/**/*.py con máximo de 45 segundos e inclusión de config/**. Excluye del paquete de funciones archivos de entorno, pruebas y documentación según sus patrones.

Para preparar un despliegue, configurar variables por entorno y verificar el esquema requerido. Después comprobar rutas directas, recursos, HTTP 404, formularios, cookies y tiempos. La vista previa estática no acredita el funcionamiento de las funciones alojadas.

Pendientes documentados:

- Aprobar responsable, canal de solicitudes, conservación y circulación de datos, incluido el aviso por correo.
- Confirmar información de atención, condiciones comerciales, Hotmart, permisos de imágenes y textos.
- Comprobar activación y recepción de avisos en el destino vigente de FormSubmit.
- Confirmar dominio y validar prerenderizado en dispositivos y HTTP en el alojamiento real.
- Configurar cuentas e IDs y completar GA4, Clarity, Search Console y Looker antes de activarlos.
- Completar M07, M10, M14–M16 y verificaciones externas de M13. M12/Hotmart queda para el final por instrucción del usuario; la pausa de M11 se levantó para implementar M13.
- Medir al menos 30 escenarios por consumo externo con registros reproducibles.

Problemas de código identificados y todavía sin corregir:

- Ampliar el asistente a /chatbot desmonta el formulario flotante y pierde sus campos locales, aunque conserve los mensajes compartidos.
- Durante el envío de InterestForm se muestra texto de espera, pero no su skeleton propio; falta ajustar ese ciclo al contrato visual.

Las pruebas aprobadas no cierran estos pendientes. Esta actualización documental no modifica esos comportamientos ni activa servicios.

## Documentación

| Tema | Referencias |
| --- | --- |
| Normas y diseño | [AGENTS.md](AGENTS.md), [línea gráfica](docs/LINEA_GRAFICA.md). |
| Contenido y plan inicial | [pendientes editoriales](CONTENT_STATUS.md), [implementación](PLAN_IMPLEMENTACION.md), [revisión de textos](docs/REVISION_TEXTOS_2026-10-29.md). |
| Formularios | [contrato de contacto](docs/CONTACTO_INTERESES.md), [consulta](docs/FORMULARIO_CONSULTA.md), [pruebas manuales](docs/PRUEBAS_FORMULARIOS.md). |
| Correo | [operación de avisos](docs/AVISOS_INTERESES_EMAIL.md). |
| Administración | [dashboard, autenticación y operación](docs/ADMIN.md). |
| Asistente | [implementación](docs/IMPLEMENTACION_SETTER.md), [panel flotante](docs/ASISTENTE_FLOTANTE.md), [renovación](docs/REFRESH_CHATBOT.md), [prueba manual](docs/PRUEBA_MANUAL_SETTER.md). |
| Catálogo y evaluación | [configuración](config/chatbot/README.md), [aprendizaje histórico](docs/APRENDIZAJE_CHATBOT.md), [evaluación manual](chatbot%20testing/README.md), [plan de mejora](docs/PLAN_MEJORA_CHATBOT.md). |
| Persistencia y origen | [base de datos](database/README.md), [origen y Hotmart](docs/ORIGEN_INTERESES_Y_HOTMART.md). |
| Marketing y SEO | [estado por lotes](docs/marketing/ESTADO.md), [plan](docs/PLAN_SEO_ANALYTICS_CONVERSION.md), [contratos y KPI](docs/CONTRATOS_MEDICION_MARKETING.md), [guía de ejecución](docs/GUIA_EJECUCION_MODELOS_MARKETING.md). |
| Libro monetario | [M11 e importación](docs/marketing/M11_IMPORTACION.md), [plantillas](config/marketing/import-templates/). |
| Métricas y reportes | [M13, fórmulas y conciliación](docs/marketing/CONCILIACION.md). |

Planes y bitácoras conservan contexto histórico. Contrastar los contratos anteriores con código, configuración y actualización más reciente de cada guía. Una casilla de planificación no demuestra despliegue ni operación real.

El blog se documenta en [operación editorial](docs/blog/OPERACION.md), [arquitectura](docs/blog/ARQUITECTURA.md), [checkpoint](docs/blog/ESTADO.md) y [plan con casillas](docs/PLAN_IMPLEMENTACION_BLOG.md). La generación del dashboard hereda `OPENAI_API_KEY` del chatbot; mantiene modelo, presupuestos y worker propios. El recorrido de Codex no utiliza una API de inferencia. Los artículos se entregan como borradores y sus dos fotografías se añaden desde administración.
