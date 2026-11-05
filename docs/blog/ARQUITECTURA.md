# Arquitectura del blog

Actualizada el 4 de noviembre de 2026. Estado y pendientes en [ESTADO.md](ESTADO.md); configuración y manejo editorial en [OPERACION.md](OPERACION.md).

## Runtime y entrega

`api/blog.js` delega en `server/blog-handler.js`. El build conserva el prerender de las rutas existentes y empaqueta renderer React, chunk administrativo y plantilla cliente en `server/generated/`. Vercel reescribe `/blog`, `/blog/{slug}` y `/blog-sitemap.xml` a Node; Python conserva las mutaciones. La lectura pública usa exclusivamente clave publicable y proyecciones publicadas. Crear artículos no exige rebuild.

HTML, metadatos y snapshot JSON corresponden a la misma revisión. El cliente hidrata ese snapshot y aplica los 800 ms funcionales; las consultas posteriores esperan respuesta más 800 ms. `BlogPage` coordina portada, página y modal; `ArticleContent` comparte lectura con el preview privado. Los nombres del plan son orientativos: cabecera, tarjetas, paginación, metadatos, fuentes y reels permanecen dentro de esas unidades de carga; filtros, relacionados y progreso son componentes independientes.

El modal es un único diálogo nativo con fondo inactivo, foco, Escape, bloqueo de scroll y salida retenida. History API conserva fondo, profundidad de relacionados y scroll. Una recarga elimina el estado modal del documento anterior y abre página completa. Los lanzadores flotantes se suspenden en modal.

HTTP: 200 contenido, 301 slug anterior, 404 inexistente/borrador/archivado, 503 origen no disponible y 400 parámetros inválidos. Filtros y páginas tienen canonical propio normalizado y noindex,follow cuando el sitio permite indexación. Sitemap, robots y JSON-LD respetan publicación y flags. HTML/JSON y medios son no-store; no hay caché CDN de contenido.

Desarrollo: Vite consulta el proxy Python de `/api` y `/blog-media`. El runtime SSR Node tiene bundle y unit tests; el empaquetado en Vercel todavía requiere un preview desplegado. `scripts/blog_preview.mjs` es un fixture de solo lectura para inspección local, sin cuentas, claves ni inferencia.

## Persistencia y administración

`private.blog_articles` conserva borrador; `blog_revisions`, historia; `public.blog_publications`, instantánea; `blog_redirects`, slugs anteriores; `blog_categories`, nombres y orden globales. Fuentes, reels, etiquetas, relacionados y SEO son arrays/campos pequeños congelados por revisión. Las etiquetas globales de filtros pueden cambiar; cada artículo conserva su etiqueta editorial.

Guardar exige versión esperada. Publicar, archivar, ordenar y destacar se serializan en transacción, con un solo destacado. Ordenación valida conjunto y versiones y alinea el puntero público cuando el documento no cambió. Restaurar crea un nuevo borrador; publicar valida revisión, categoría, relaciones y dos imágenes distintas con alt. Anónimos no pueden enumerar borradores, leases, auditoría ni contactos.

`/api/admin` mantiene sesión nz_admin, Path `/api/admin`, origen, cabecera y límites propios. `backend/blog_admin.py` valida y despacha RPC; SQL vuelve a comprobar sesión. Funciones administrativas y de worker son invoker, exclusivas del servidor. Definer se limita a despertar/programar el worker, con search_path vacío y ejecución revocada. Migraciones aditivas de database tienen copias con las versiones remotas en supabase/migrations; no se usó db push.

`AdminBlog` coordina concurrencia; listado, catálogo, bloques, SEO, imágenes, cola y moderación son módulos independientes, cada uno con CSS, skeleton y unit tests. El bundle privado se carga con lazy/Suspense. Documento JSON versionado con tipos permitidos y marcas acotadas de negrita/cursiva, sin HTML libre. SEO nulo hereda; overrides se conservan. Conflictos pausan autoguardado y mantienen los campos.

## Imágenes

Bucket privado blog-media. El proxy `/api/admin/media` autoriza subidas por sesión/origen y valida WebP/dimensiones. El cliente admite JPEG/PNG/WebP hasta 8 MiB/20 MP y exporta recorte y variantes 480/960/1440, dentro de 4 MB por petición. Cada ajuste recibe UUID nuevo. Se guardan punto focal, alt y pie; no un original separado.

El pipeline entrega texto sin imágenes. El dashboard añade cover/coverAlt/coverCaption/coverPosition y bodyImage={src,alt,caption,position,alignment,afterBlock}. Apertura 3:2, interior 4:5; presentación móvil 4:3. Posición interior nula significa hacia el 55 % del texto, con párrafos posteriores. El lector, el modal y el preview comparten composición.

`/blog-media/{uuid}` comprueba referencia publicada antes de servir objeto/variante; previews requieren sesión. Archivar retira nuevas entregas cuando desaparece la última referencia pública. Revisiones y medios no se purgan automáticamente. El inventario de huérfanos mayores de 90 días es solo lectura; borrar requeriría una acción explícita por Storage API.

## Pipeline editorial

Contrato y voz en config/blog. Brief, borrador, crítica y final usan validadores puros de longitud, fuentes, metadata y SHA-256. Las fuentes conservan título, origen, fecha UTC, aporte y afirmaciones, con extractos privados. Lecturas HTTPS del servidor fijan la conexión a direcciones públicas validadas y comprueban cada redirección, con límites de tamaño y tiempo.

Motor codex_session: blog_local valida y persiste sin importar proveedores ni requerir claves de inferencia. Las capacidades de la sesión elaboran los textos. Completar usa los mismos controles de longitud y fuentes que API. Un cierre de Codex requiere reanudar la sesión; no hay fallback pagado.

Motor API: Responses background con gpt-6.1-sol estándar. Hereda OPENAI_API_KEY del chatbot, con override opcional BLOG_OPENAI_API_KEY; modelo y presupuestos siguen separados. El worker reserva antes de llamar, conserva response ID/checkpoints y registra consumo. Datos o tarifas faltantes dan costo desconocido. Nunca publica.

Exclusión global, lease de 15 minutos y token de worker de 45 segundos impiden solapamientos y resultados obsoletos. Envíos inciertos se detienen para reconciliar. El brief es inmutable; hasta tres intentos conservan registros anteriores. Cada tick hace una etapa; la siguiente se despacha al avanzar y cron recupera pendientes. Se verificó una cola de cinco sin navegador ni inferencia. Endpoint/cron siguen pendientes del despliegue.

## Participación

SavedArticles/ArticleSaveButton usan marcadores locales, compartidos entre pestañas. El acceso aparece solo si hay guardados y no almacena cuerpos ni los envía a Supabase.

ArticleEngagement consulta `/api/blog_engagement`: like/unlike idempotente y comentarios. Tablas privadas de likes/comentarios/límites con RLS cerrado. Identidad funcional anónima firmada solo al participar; el cliente no recibe hash ni claves. Comentarios pendientes hasta moderación privada. Solo el autor ve sus pendientes y puede retirar sus entradas mientras conserva la cookie. Nombre no verificado, texto escapado, límites y CSRF. Archivar oculta y bloquea participación. No se usa inferencia ni se activa analítica.

## Verificación y límites

Vitest/RTL y Python con servicios simulados; comprobaciones SQL manuales con rollback. Evidencia visual local de cinco anchos, foco/Escape, modal único y recorte fuera del despliegue. Analítica pública usa IDs/enums y consentimiento; previews privados no miden. Lectura completada es una señal de scroll activo al 90 %, no comprensión.

Pendientes remotos: SSR/rutas Vercel, upload real, dos navegadores para interacciones, corrida de Sol, medición de calidad/costos y herramientas SEO. El shell aislado bloqueó la conexión a OpenAI. No se inventaron latencias ni se ajustó la coreografía con estimaciones.
