# Operación editorial del blog

## Credencial compartida

Por instrucción del usuario, el blog utiliza `OPENAI_API_KEY`, la misma variable del chatbot, exclusivamente en Python. `BLOG_OPENAI_API_KEY` es un override opcional: si está vacío se hereda la clave compartida. No copiar claves a variables VITE, JavaScript, briefs ni tablas. La autenticación sigue la [documentación oficial de OpenAI](https://developers.openai.com/api/reference/overview).

El modelo y los presupuestos permanecen separados del chatbot: `BLOG_MODEL=gpt-6.1-sol`, `BLOG_GENERATION_ENABLED`, `BLOG_JOB_BUDGET_MICRO_USD`, `BLOG_DAILY_BUDGET_MICRO_USD`. La tarifa estándar y la caché se documentan en [Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol). El worker solicita la modalidad estándar. No se activó generación real durante la implementación: la consulta de disponibilidad del modelo fue bloqueada por la red del entorno.

Actualmente se reserva conservadoramente US$3 por etapa. Una corrida de cuatro etapas requiere un techo de reserva por trabajo de al menos `12000000` micro-USD; no es una factura de US$12. La referencia de planificación permanece en unos US$0.31 por artículo, sujeta a consumo real. Presupuestos cero impiden comenzar llamadas. Las etapas fallidas e inciertas conservan su reserva. Los registros muestran tokens de entrada/salida, caché, razonamiento incluido en salida, búsquedas y costo conocido; si faltan datos o tarifas, el costo es desconocido.

## Dashboard

En `/admin`, abrir Blog. La entrada principal es una idea libre: tono, audiencia, narrativa, tema, fuentes y enlaces a reels. Generar inicia brief, borrador, crítica y versión final; Guardar idea conserva el encargo sin ejecución. Si falta información crítica, la cola solicita una aclaración y reanuda el mismo ID. Los reintentos conservan el historial y se limitan a tres intentos.

El resultado aparece como borrador. La cola permite ver la ficha, las fuentes, los artefactos y los registros, exportar el encargo y abrir el editor. No hay publicación automática. Completar las dos fotografías y sus descripciones, revisar el texto y SEO, guardar y publicar la versión guardada. El primer reel es el principal. La invitación comercial es opcional. Negrita y cursiva se almacenan como marcas acotadas en texto (`**texto**`, `_texto_`), nunca HTML.

El listado permite buscar por título/autor, filtrar y ordenar publicaciones mediante asa, Subir/Bajar o posición global. Se limita a las 500 entradas más recientes; antes de superar ese catálogo se debe añadir paginación administrativa con búsqueda en servidor. La paginación pública usa doce artículos y enlaces reproducibles. Las categorías tienen ID estable y nombre/orden editables; una categoría utilizada no se puede borrar. Las etiquetas se gestionan en cada artículo. Al cambiar nombres globales, la revisión de cada artículo conserva su etiqueta editorial.

Las revisiones conservan autor y fecha; se pueden previsualizar y restaurar como un nuevo borrador. Actualizar historial consulta las revisiones sin reemplazar los campos locales. Los conflictos pausan el autoguardado y conservan el texto. Publicar y archivar operan sobre el snapshot público, separado del borrador.

## Ejecución persistente

Producción: desplegar las funciones y configurar `BLOG_WORKER_SECRET` (aleatorio, al menos 32 caracteres) en el servidor. Ejecutar desde la raíz, con credenciales de servidor cargadas: `.venv/Scripts/python.exe -m scripts.configure_blog_worker https://DOMINIO/api/blog_worker`. El comando configura el despertar inicial y un cron de recuperación por minuto; no pasar secretos como argumentos. Las siguientes etapas se despachan al completar la anterior. Cada tick procesa como máximo una etapa de un artículo y libera su checkpoint; se mantiene exclusión global entre motores y fencing de workers vencidos.

Desarrollo local: `npm run dev` arranca automáticamente el worker editorial cuando `/api/health` informa generación habilitada. El worker se detiene junto con la API y Vite. También se puede ejecutar `.venv/Scripts/python.exe -m scripts.blog_worker_local` aparte, o añadir `--once` para un tick. Esta ejecución usa la API y la misma cola. Tras cambiar `.env.local`, reiniciar `npm run dev` para recargar variables. La persistencia permite recuperar el proceso al reiniciarlo. El worker de producción requiere su endpoint/cron; no configurar un destino antes de desplegar código y variables.

## Codex sin inferencia API

El agente investiga, prepara brief, borrador, crítica y final dentro de la sesión. `scripts/blog_local.py`/`backend.blog_local.py` solo validan y persisten; no importan el proveedor. Reservar el motor `codex_session`, guardar checkpoints con el lease y completar mediante los mismos validadores de longitud, fuentes y metadatos. El worker API ignora esa tarea. Un cierre de Codex requiere reanudar la sesión; no hay fallback pagado.

Muestra privada comprobada: `a6af8ee7-6bf9-4943-a3c1-efad0387c44e`, 423 palabras, trabajo completed, artículo draft, reserva de inferencia cero, sin publicación ni fotografías. Sus fuentes son Hunter et al. (2019), texto completo, y Bratman et al. (2015), resumen primario en PubMed; el acceso a PMC mostró CAPTCHA y no se declaró leído. Los artefactos locales están en `.preview/blog-local-sample/`, fuera del despliegue. La muestra es técnica; el primer encargo editorial real sigue siendo una decisión del usuario.

## Fotografías y conservación

El bucket `blog-media` es privado. La sesión administrativa y la cabecera de origen autorizan el proxy de subida `/api/admin/media`; esta elección reemplaza la propuesta inicial de una URL firmada. El cliente admite JPEG/PNG/WebP de hasta 8 MiB y 20 MP, recorta y exporta WebP y variantes de 480/960/1440 px. La petición total se limita a 4 MB. El servidor comprueba cabecera, dimensiones y proporciones. El recorte nuevo recibe UUID nuevo. Se guardan punto focal, alt y pie; el original independiente no se conserva.

Los medios públicos se entregan solo si pertenecen a una revisión publicada vigente. Los previews requieren sesión. La política es no-store; archivar retira nuevas entregas cuando desaparece la última referencia publicada. Los bytes descargados por terceros no se pueden retirar. Las revisiones y sus medios se conservan indefinidamente hasta una acción explícita; no hay purga automática. Huérfanos sin referencias en artículos, revisiones ni publicaciones pueden inventariarse tras 90 días con `database/blog_media_orphans.sql`. Revisar el inventario y borrar únicamente mediante Storage API en una operación autorizada; nunca borrar filas de `storage.objects` por SQL.

## Verificación y límites

Las suites usan mocks y temporizadores falsos. Los archivos `tests/blog_*_unit.sql` se ejecutan con BEGIN/ROLLBACK. La prueba de recuperación comprobó cinco trabajos consecutivos, reserva, token vencido, cancelación, motor exclusivo, finalización idempotente y reintentos, sin llamadas a modelos.

`npm.cmd run build` prepara el cliente, SSR, rutas estáticas y renderer compartido. `node scripts/blog_preview.mjs` ofrece un fixture de solo lectura en 127.0.0.1:4174; no consulta cuentas, usa secretos ni publica. `scripts/inspect_blog_preview.mjs` captura evidencia visual local mediante Edge/CDP; es una ayuda de inspección manual, no una suite E2E. Capturas y mediciones reales de viewport están en `.preview/blog-review/`.

La revisión local cubre 1440, 1024, 768, 390 y 320 px, modal/Escape/foco y controles de recorte. No acredita despliegue Vercel, upload real con sesión, Rich Results Test ni calidad/costo medidos de Sol. No se ajustaron coreografías según latencias estimadas; los 30 escenarios por consumo exigidos antes de ese ajuste siguen pendientes de un entorno accesible. Se mantienen los 800 ms funcionales, sin inventar estadísticas.

## Comentarios, likes y guardados

Ampliación del usuario: cada lectura permite comentar, dar/quitar me gusta y guardarla. Los guardados son marcadores en `localStorage`, limitados a 100, con ID/slug/título/categoría y fecha; no guardan el cuerpo completo ni prometen lectura offline. «Guardados» aparece cuando existe al menos uno y permite abrir o quitar lecturas, tanto en portada como en el lector. Se sincronizan entre pestañas del mismo navegador; no entre dispositivos.

Se comunicó como supuesto operativo que comentarios y likes serían compartidos públicamente y los comentarios requerirían moderación. No se crean cuentas de lectores. El nombre público no está verificado. Comentar requiere nombre y texto de hasta 2000 caracteres; permanece pendiente hasta aprobarlo desde Blog → Comentarios. El autor puede ver y retirar sus propios pendientes; también eliminar sus comentarios publicados mientras conserve la cookie. La administración puede aprobar, ocultar o eliminar comentarios, con auditoría.

Los likes se cuentan por identidad anónima del navegador, no por persona verificada. Enviar dos veces el mismo estado no incrementa el contador. Una cookie firmada, HttpOnly, SameSite=Lax y Secure en producción conserva esa identidad durante un año; solo se crea al participar, no al leer. Se firma con una clave derivada de `CHAT_COOKIE_SECRET` o, si falta, del secreto Supabase del servidor. No se utiliza la clave OpenAI. La base conserva un hash del token aleatorio, no IP, correo ni teléfono. Borrar la cookie pierde la asociación con esa participación.

`/api/blog_engagement` valida IDs, origen, cabecera, tamaños y campos; solo permite interactuar con artículos publicados. La función SQL es exclusiva del servidor. Las tablas privadas tienen RLS cerrado. Las respuestas públicas incluyen aprobados y pendientes del visitante actual, sin hashes de identidad. Los comentarios son texto escapado, sin HTML ni scripts. Hay límite de cinco comentarios/hora y una separación de 30 segundos, además de un máximo de 200 operaciones/hora por identidad. Los IDs de comentario hacen idempotente un reintento de red. Archivar oculta toda interacción pública y bloquea nuevas acciones; eliminar el artículo elimina sus comentarios/likes por cascada. No se añadieron llamadas de inferencia ni se activó analítica.
