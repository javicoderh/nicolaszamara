# Plan de implementación del blog de Nicolás Zamara

Fecha: 4 de noviembre de 2026.

Estado: implementación en curso, reanudada por el usuario. Las casillas marcadas acreditan pasos implementados y verificados; las pendientes conservan su alcance.

## 1. Resultado esperado y decisiones acordadas

Un espacio editorial para profundizar los temas presentados en Instagram: naturaleza, terapias, Flores de Bach, cursos y formación. Debe agradecer la atención de la audiencia con contenido útil, mantener la identidad clásica de la web y aportar movimiento moderno y discreto.

- [x] **B01.1** Incorporar `/blog` al menú principal y al pie de página, con nombre de navegación «Blog» y encabezado editorial «Para profundizar».
- [x] **B01.2** Persistir artículos, versiones, clasificación, orden y metadatos en Supabase. Guardar imágenes en Supabase Storage.
- [x] **B01.3** Incorporar gestión editorial al administrador existente: crear, consultar, editar, ordenar, destacar, publicar, archivar, restaurar y eliminar de forma explícita.
- [x] **B01.4** Abrir artículos desde el listado en un modal editorial. Cada artículo tendrá una URL propia `/blog/{slug}` que, al visitarse directamente o recargarse, mostrará una página completa.
- [x] **B01.5** Separar guardar borrador de publicar: editar una publicación nunca cambiará la versión pública hasta confirmar la publicación de esos cambios.
- [x] **B01.6** Permitir uno o varios reels relacionados, con uno principal; referencias, autoría, revisión editorial, artículos relacionados y una invitación opcional a conocer un servicio.
- [x] **B01.7** Permitir preparar y publicar contenido desde administración sin necesitar un despliegue manual de código para cada artículo.

Fuera de esta primera entrega: cuentas de lectores, suscripciones, pagos, programación horaria de publicaciones, traducciones y reproducción automática de Instagram. La generación asistida mediante Article Brief y Article Generator forma parte del alcance según la sección 14. La ampliación del usuario incorpora comentarios, likes y guardados según la sección 20.

## 2. Base del repositorio y reglas de ejecución

La aplicación utiliza React 19.2.8 y Vite 8.0.3; navegación propia mediante History API; API Python; Supabase mediante REST/RPC; administración propia con cookie `nz_admin`; y generación de HTML estático en el build. No hay React Router ni un CMS instalado.

Archivos de referencia: `src/app/App.jsx`, `src/config/siteRoutes.js`, `src/services/seoService.js`, `src/hooks/useSiteNavigation/useSiteNavigation.js`, `src/index.css`, `backend/admin.py`, `backend/admin_security.py`, `api/admin.py`, `scripts/prerender.mjs` y `vercel.json`.

- [x] **B02.1** Leer `AGENTS.md`, este documento y `git status --short` antes de comenzar. Conservar cambios locales anteriores, incluidos los reportes de marketing M13.
- [x] **B02.2** Crear un checkpoint `docs/blog/ESTADO.md` con lote actual, decisiones, archivos afectados, validaciones, pendientes y siguiente paso. No copiar secretos ni contactos reales.
- [x] **B02.3** Mantener cada componente en su carpeta, con CSS, skeleton y pruebas unitarias. Separar presentación, coordinación de cargas y acceso a datos.
- [x] **B02.4** Compartir estado solo donde sea necesario: filtros/listado al abrir el modal y datos de navegación editorial. Mantener el borrador del editor fuera de contextos públicos.
- [x] **B02.5** Reutilizar `BASE_DELAY_MS = 800`: carga local de 800 ms; consumo remoto de duración real más 800 ms, también ante errores y recargas. No sumar delays de hijos de una misma unidad de carga.
- [x] **B02.6** Usar Vitest/React Testing Library y unittest con servicios simulados y temporizadores falsos. No añadir pruebas de integración ni E2E. Documentar las comprobaciones manuales por separado.
- [x] **B02.7** Consultar documentación vigente de Supabase y Vercel antes de implementar migraciones, Storage o nuevas funciones de servidor. Fijar versiones y conservar lockfile si se incorporan dependencias.

Base local verificada durante la lectura previa: 274 pruebas frontend en 71 archivos, 131 pruebas Python y build cliente/SSR/prerender aprobados. Es una referencia histórica, no el resultado de la futura implementación.

## 3. Dirección visual: clásico vivo

### 3.1 Identidad, color y tipografía

La identidad existente es obligatoria. Introducir variación mediante composición, fotografía y transiciones; conservar marca, cabecera, pie y fuentes locales.

| Elemento | Especificación |
| --- | --- |
| Fondo principal | `--color-paper: #DEDBD9` |
| Superficie de lectura | `--color-surface: #E9E7E4` |
| Paneles alternos | `--color-areas: #C4CDCA` |
| Títulos y controles principales | `--color-navy: #05234B` |
| Acento botánico | `--color-sage: #698C6D` |
| Botones verdes con texto blanco | `--color-sage-dark: #4D7052` |
| Etiquetas pequeñas | `--color-sage-ink: #36513B` |
| Texto | `--color-ink: #27322F`; secundario `--color-muted: #4C5651` |
| Bordes | `--color-line: #B1B9B1`, 1 px |
| Fuente de títulos | Italiana local, peso 400; no simular negrita |
| Fuente de lectura e interfaz | Poppins local, pesos reales 400 y 600 |
| H1 de portada | `clamp(3rem, 6vw, 5.4rem)`, interlínea 1.05, mayúsculas |
| H1 de artículo | `clamp(2.4rem, 4.5vw, 4.2rem)`, interlínea 1.1, caja natural |
| H2 de lectura | `clamp(1.9rem, 3vw, 2.6rem)`, interlínea 1.2 |
| Título de tarjeta | Italiana, `clamp(1.65rem, 2.2vw, 2.2rem)`, interlínea 1.2 |
| Cuerpo del artículo | Poppins, 17 px escritorio / 16 px móvil, interlínea 1.85, ancho máximo 68ch |
| Metadatos | Poppins, 12–14 px, interlínea mínima 1.5 |
| Espaciado | Escala de 8, 12, 16, 24, 32, 48, 64 y 80 px |

- [x] **B03.1** Definir variables del blog bajo su contenedor o componente; reutilizar las variables globales y evitar modificar estilos de páginas existentes.
- [x] **B03.2** Mantener títulos editoriales serif y párrafos alineados a la izquierda. No justificar texto ni convertir cuerpos largos a mayúsculas.
- [x] **B03.3** Aplicar radios de 8 px a botones, 12 px a tarjetas y 20 px al lector modal de escritorio. Las imágenes editoriales pueden conservar bordes rectos dentro de su marco.
- [x] **B03.4** Reservar decoraciones botánicas para márgenes y separadores, con opacidad de 0.08–0.12 y `aria-hidden`. No poner textura detrás de párrafos ni crear una segunda marca.
- [x] **B03.5** Usar fotografía propia/autorizada y `object-position` configurable. No inventar fotografías de actividades realizadas ni credenciales editoriales.

### 3.2 Portada y tarjetas

- [x] **B04.1** Usar ancho máximo de 1100 px, márgenes de 32 px en escritorio y 20 px hasta 640 px, siguiendo `.page-wrap`.
- [x] **B04.2** Construir encabezado con etiqueta «Blog», H1 «Para profundizar» e introducción corta: «Hay temas que merecen un poco más de tiempo». Presentar estos textos como propuesta editorial revisable.
- [x] **B04.3** Crear un bloque destacado con proporción aproximada 60/40 entre imagen y texto, separación de 40 px y fotografía 4:3. En móvil, imagen sobre texto y separación de 24 px.
- [x] **B04.4** Mostrar filtros «Todos», «Naturaleza», «Terapias», «Flores de Bach» y «Formación». Formación agrupa cursos; las categorías permanecen administrables. Permitir varias filas en móvil, sin depender de desplazamientos horizontales ocultos.
- [x] **B04.5** Construir una grilla de tres columnas desde 1024 px, dos entre 641–1023 px y una hasta 640 px; separación de 24–32 px. Evitar masonry y mantener orden DOM igual al orden de lectura.
- [x] **B04.6** Dar ritmo mediante el destacado, alternancia moderada de superficies y encuadres 4:3 / 3:2 reservados de antemano. Mantener la grilla normal estable y legible, incluso con solo uno o dos artículos.
- [x] **B04.7** Mostrar en cada tarjeta: imagen, categoría, título, resumen de hasta tres líneas visuales, tiempo estimado de lectura y referencia discreta al reel si existe. No truncar el título.
- [x] **B04.8** Usar un enlace real al artículo como acción principal. No anidar botones o enlaces dentro de ese enlace ni convertir toda la tarjeta en un `div` clickeable.
- [x] **B04.9** Separar el destacado del listado para evitar duplicarlo. Al filtrar por categoría, priorizar resultados de esa categoría y ocultar el destacado general.
- [x] **B04.10** Paginar con 12 artículos por página y controles explícitos. Orden estable por posición editorial, fecha de publicación descendente e ID como desempate. No usar desplazamiento infinito.
- [x] **B04.11** Diseñar estados de primera publicación pendiente, categoría vacía, carga, error y reintento. No completar la portada con artículos ficticios en producción.
- [x] **B04.12** Añadir Blog al header/footer y una entrada discreta en inicio, reutilizando `ActionLink`. Comprobar que el menú ampliado no desborda entre móvil y escritorio.

### 3.3 Lector del artículo

- [x] **B05.1** Compartir `ArticleContent` entre la página completa, el modal y la vista previa administrativa; la presentación del contenido debe ser idéntica.
- [x] **B05.2** Ordenar la lectura: categoría → título → resumen → autor/fechas/tiempo → portada → referencia al reel → cuerpo → fuentes → relacionados → invitación opcional.
- [x] **B05.3** Diseñar modal de escritorio de hasta 1040 px de ancho, margen exterior mínimo de 24 px y altura máxima `calc(100dvh - 48px)`. Desplazamiento vertical dentro del lector.
- [x] **B05.4** Hasta 640 px, usar lector a pantalla completa, radio 0, safe areas y ancho de texto con 20 px laterales. Comprobar teclado y orientación horizontal.
- [x] **B05.5** Mantener barra superior visible con título abreviado, compartir y cerrar; controles de al menos 44×44 px. La página directa tendrá «Volver al blog» en lugar de un cierre modal.
- [x] **B05.6** Usar portada 3:2 en escritorio y 4:3 en móvil, con dimensiones reservadas, alternativas responsive y punto focal almacenado.
- [x] **B05.7** Diferenciar citas con borde izquierdo salvia de 3 px y separación de 24 px, sin comillas ornamentales gigantes. Conservar Poppins para citas largas.
- [x] **B05.8** Mostrar referencias como enlaces descriptivos y numeración opcional. El cuerpo admite H2/H3; el título de página es el único H1.
- [x] **B05.9** Mostrar una línea de progreso de 2 px calculada sobre el cuerpo del artículo, usando el contenedor de scroll correcto para página o modal. No medir la longitud de toda la página de fondo.
- [x] **B05.10** Mostrar hasta tres relacionados publicados; excluir el artículo actual, duplicados, borradores y archivados. Priorizar selección editorial y completar por categoría si hace falta.
- [x] **B05.11** Implementar compartir con Web Share cuando esté disponible y copia del enlace como alternativa; anunciar éxito/error de forma accesible. Compartir siempre la URL canónica pública.
- [x] **B05.12** Mostrar los reels como enlaces con miniatura editorial opcional; no cargar scripts, iframe ni reproducción de Instagram al abrir el artículo. El artículo debe entenderse aunque el reel deje de existir.

### 3.4 Animación y accesibilidad

| Interacción | Movimiento | Duración y curva |
| --- | --- | --- |
| Entrada del lector | Opacidad 0→1 y `translateY(16px)`→0 | 240 ms, `cubic-bezier(.22,.7,.3,1)` |
| Fondo modal | Negro azulado `rgb(5 35 75 / 38%)`, opacidad 0→1 | 180 ms, ease-out |
| Cierre | Opacidad 1→0 y desplazamiento de 8 px | 180 ms, ease-in |
| Hover de tarjeta | `translateY(-3px)`, sombra suave | 180 ms, ease-out |
| Imagen de tarjeta | Escala 1→1.025 dentro del marco | 320 ms, ease-out |
| Cambio de filtro | Color de borde/fondo y revelado de resultados | 160 ms, ease-out |
| Revelado de tarjetas | Opacidad y desplazamiento máximo 8 px | 220 ms; escalonado de 35 ms, máximo 140 ms |
| Skeleton | Pulso de opacidad 1↔0.55 | 1300 ms, ease-in-out |

- [x] **B06.1** Aplicar hover solo en dispositivos con `(hover: hover) and (pointer: fine)`. El foco de teclado tendrá borde visible sin depender de movimiento.
- [x] **B06.2** Limitar animaciones a `opacity` y `transform` cuando sea posible. No usar parallax, partículas, carruseles automáticos ni animaciones permanentes del contenido.
- [x] **B06.3** Mostrar el marco/skeleton del lector de inmediato; iniciar el revelado del contenido al terminar su petición y los 800 ms. La animación es decoración posterior, nunca sustituye el contrato de carga.
- [x] **B06.4** No reanimar tarjetas al volver de un artículo. Limitar el escalonado al lote recién mostrado y no retrasar acceso al texto o a enlaces por animaciones de scroll.
- [x] **B06.5** Con `prefers-reduced-motion: reduce`, eliminar transformaciones, pulso, desplazamiento suave y esperas ornamentales; conservar únicamente el delay funcional de 800 ms exigido por el proyecto.
- [x] **B06.6** Implementar semántica de diálogo, nombre accesible, contención de foco, Escape, bloqueo de scroll e inactividad del fondo. Mantener esas protecciones durante la animación de salida y restaurar el foco al enlace de origen.
- [x] **B06.7** Retener el modal durante el cierre; manejar cierre/reapertura rápida y desmontaje sin temporizadores huérfanos. Si no hay enlace de origen, enfocar el encabezado del listado.
- [x] **B06.8** Coordinar overlays: suspender los lanzadores de chatbot/WhatsApp mientras el lector esté abierto y evitar dos diálogos activos. Preservar la conversación del chat.
- [x] **B06.9** Verificar contraste, foco, zoom al 200 %, navegación por teclado, áreas táctiles y ausencia de scroll horizontal desde 320 px.

## 4. Arquitectura de entrega y rutas: resolver antes del CRUD

El build actual solo prerenderiza rutas conocidas y no sirve artículos nuevos desde la base en cada petición. Añadir un `fetch` en React no resuelve por sí solo la entrega de HTML inicial, metadatos para compartir ni estados HTTP.

- [ ] **B07.1** Hacer una prueba técnica acotada de SSR dinámico para `/blog` y `/blog/{slug}` en Vercel, usando un bundle del renderer React compartido y una función Node de lectura. Las mutaciones editoriales seguirán en Python. Verificar soporte real junto al despliegue Vite/Python actual antes de incorporar esta arquitectura.
- [x] **B07.2** Documentar en `docs/blog/ARQUITECTURA.md` entradas, runtime, empaquetado, límites, ruta local de desarrollo, lectura pública y reglas de caché. Si el alojamiento no soporta la solución propuesta, resolver y documentar una alternativa que conserve HTML inicial y publicación sin despliegue manual antes de avanzar B08.
- [x] **B07.3** La función pública consultará únicamente proyecciones/RPC de publicaciones con clave publicable y permisos limitados; nunca incluirá credenciales privilegiadas ni campos administrativos en el HTML.
- [x] **B07.4** Entregar en una misma respuesta el contenido, título, canonical, metadatos sociales y JSON-LD de la misma revisión publicada. Hidratar desde ese snapshot, sin un segundo fetch inicial que pueda cambiar de versión.
- [x] **B07.5** Mantener prerenderizadas las rutas actuales. Extender el build para empaquetar el renderer dinámico; excluir rutas de artículos del catálogo estático y evitar imports de secretos en el bundle cliente.
- [x] **B07.6** Ampliar el reconocimiento de rutas en `useSiteNavigation` y `App` para `/blog`, categorías/paginación y slugs. No tratar cualquier ruta desconocida como artículo ni introducir un fallback HTTP 200 general.
- [x] **B07.7** Definir HTTP: 200 publicación disponible; 301 slug antiguo redirigido; 404 artículo inexistente, borrador o archivado sin sustituto; 503 fallo del origen. No convertir errores de base de datos en lista vacía o 404.
- [x] **B07.8** Primera entrega: HTML y JSON del blog con revalidación en origen en cada solicitud (`Cache-Control: no-store` como base verificable). Cachear assets inmutables por versión. No activar caché CDN de publicaciones hasta disponer de invalidación comprobada en publicar, archivar, cambiar slug y reordenar.
- [x] **B07.9** Si se añade caché de contenido, definir clave por ruta/filtro/página/revisión, TTL máximo y mecanismo real de invalidación; mantener borradores y administración siempre `private, no-store`. Una retirada debe respetar el contrato de visibilidad acordado, no una invalidación eventual sin límite.
- [x] **B07.10** Reutilizar el shell SSR con contenido real presente en HTML y revelado visual tras 800 ms; al hidratar, tratar el snapshot como carga ya resuelta. Las navegaciones remotas posteriores sí esperan petición más 800 ms. No bloquear el servidor con sleeps.

## 5. Persistencia, revisiones y permisos

Modelo propuesto; conciliar nombres con el esquema remoto antes de migrar. Preferir tablas editoriales en esquema privado y RPC públicas estrictamente limitadas a lo publicado. La relación a la revisión pública es la fuente de verdad, no un booleano enviado por el navegador.

| Entidad | Responsabilidad y campos esenciales |
| --- | --- |
| `blog_articles` | ID estable, estado editorial, slug público, revisión publicada, borrador actual, posición, destacado, autor, fechas y versión de concurrencia |
| `blog_revisions` | ID, artículo, número, título, resumen, documento estructurado y versión del esquema; portada; SEO/social; autoría y revisión; referencias; reels; relacionados y CTA; creador y fecha |
| `blog_categories` | ID, nombre, slug único, descripción, orden y estado activo |
| `blog_tags` | ID, nombre y slug único; clasificación complementaria |
| Relaciones de revisión | Categoría principal y etiquetas vinculadas a cada revisión, para que editar clasificación no cambie la publicación activa |
| `blog_media` | Ruta de Storage, MIME real, tamaño, dimensiones, texto alternativo, crédito, punto focal, propietario y estado |
| `blog_slug_redirects` | Slug anterior único → ID estable del artículo, sin cadenas ni bucles |
| `blog_audit_events` | Actor, acción, artículo/revisión y fecha; sin secretos ni duplicación innecesaria del cuerpo |

- [x] **B08.1** Definir esquema y contratos JSON versionados; decidir qué asociaciones usan tablas y cuáles arrays pequeños validados. Todas las propiedades que se publican deben quedar congeladas en una revisión o tener semántica global explícita.
- [x] **B08.2** Definir estados borrador/publicado/archivado. Un artículo publicado puede conservar cambios en borrador; mostrar ambos hechos en administración sin crear ambigüedad.
- [x] **B08.3** Guardar con versión esperada; devolver 409 si otro editor cambió el borrador. Conservar el contenido local para comparar/recuperar, sin sobrescribir automáticamente.
- [x] **B08.4** Publicar en transacción: validar revisión, slug, relaciones y medios; actualizar el puntero público, estado y fechas; crear redirección si cambia el slug y registrar auditoría. Nunca exponer una publicación parcialmente guardada.
- [x] **B08.5** Restaurar una revisión histórica como un nuevo borrador. Publicarla requerirá la misma acción de publicación que cualquier otra edición.
- [x] **B08.6** Fijar primera fecha de publicación y separar última edición de borrador de última modificación pública. La fecha editorial de revisión será explícita, no fabricada por cada guardado.
- [x] **B08.7** Reordenar por IDs y posiciones en una operación atómica con control de versión; validar duplicados y conjunto esperado. Permitir un único destacado general publicado. Archivar ese artículo lo retira del destacado.
- [x] **B08.8** Gestionar categorías/etiquetas desde el panel. Impedir borrar categorías utilizadas sin reasignación explícita; no usar etiquetas como supuesto campo `meta keywords`.
- [x] **B08.9** Añadir índices para slug, estado/orden/fecha, revisión por artículo, categorías y redirecciones. Acotar consultas y devolver resúmenes sin cuerpo en los listados.
- [x] **B08.10** Habilitar RLS, revocar accesos implícitos y conceder privilegios mínimos. Los visitantes solo accederán a revisiones publicadas mediante una proyección explícita; no podrán enumerar borradores, auditoría ni contactos.
- [x] **B08.11** Reutilizar autorización administrativa en backend para cada operación; la clave de servidor no sustituye la comprobación de sesión. Mantener contraseñas y tokens fuera del contenido editorial.
- [x] **B08.12** Preferir funciones `SECURITY INVOKER`; si la lectura pública limitada exige `SECURITY DEFINER`, justificarla, fijar `search_path`, cualificar objetos, revocar ejecución por defecto y devolver solo columnas permitidas de revisiones publicadas. No aceptar SQL ni nombres de tablas del cliente.
- [x] **B08.13** Crear migraciones con el flujo vigente de Supabase; conciliar las migraciones históricas de `database/` y `supabase/migrations/` antes de aplicar cambios. No ejecutar `db push` indiscriminadamente.
- [x] **B08.14** Verificar privilegios y funciones con pruebas unitarias SQL en transacción revertida sobre un entorno autorizado; revisar advisors y documentar resultados sin retener datos sintéticos.

## 6. API y almacenamiento de imágenes

- [x] **B09.1** Definir contratos de lectura: catálogo de categorías, listado paginado, artículo por slug y relacionados. Excluir contenido privado también cuando se solicita un ID directamente.
- [x] **B09.2** Conservar la cookie administrativa actual, cuyo `Path` es `/api/admin`. Usar operaciones de blog sobre ese endpoint y despachar a módulos específicos; no crear `/api/blog_admin` suponiendo que recibirá la cookie existente.
- [x] **B09.3** Modularizar `backend/blog_admin.py`, validadores, repositorio/RPC y servicios de medios. Mantener `backend/admin.py` como coordinador de acceso, sin convertirlo en un editor monolítico.
- [x] **B09.4** Mantener origen válido, cabecera `X-Admin-Request`, JSON y sesión para escrituras. Definir límites por operación: el endpoint actual limita 4096 bytes y necesita un límite específico para documentos, sin ampliar indiscriminadamente login u otras operaciones.
- [x] **B09.5** Propuesta inicial de límites: título 160 caracteres, resumen 400, slug 100, documento JSON 256 KiB/200 bloques, 10 reels, 20 referencias, 3 relacionados seleccionados y 10 etiquetas. Revisar con un artículo largo representativo antes de fijar el contrato.
- [x] **B09.6** Implementar crear/listar/detalle/guardar/publicar/archivar/restaurar/eliminar/reordenar/destacar, además de categorías, etiquetas e historial. Devolver errores estables: validación, no autorizado, conflicto, no encontrado y almacenamiento no disponible.
- [x] **B09.7** Hacer publicación y acciones sensibles idempotentes mediante identificadores de operación o versiones; no duplicar revisiones publicadas por doble clic o reintento de red.
- [x] **B09.8** Validar y normalizar slugs en servidor; bloquear nombres reservados, colisiones y reutilización accidental de slugs redirigidos. Resolver redirección al slug vigente del ID estable.
- [x] **B09.9** Usar Storage privado con rutas impredecibles y proxy de subida bajo `/api/admin/media`, sesión y control de origen. Esta decisión sustituye la propuesta de URL firmada. Conservar el WebP editado y variantes, según B26; validar cabecera real, tamaño y dimensiones.
- [x] **B09.10** Admitir inicialmente JPEG, PNG y WebP, máximo 8 MiB y 20 megapíxeles; rechazar SVG/HTML y formatos no admitidos. Generar variantes de 480/960/1440 px, conservar proporción y retirar metadatos privados cuando corresponda.
- [x] **B09.11** Definir entrega de imágenes públicas mediante endpoint estable que compruebe pertenencia a una revisión publicada y sirva el medio privado. Para borradores, usar acceso administrativo; nunca insertar URLs firmadas que expiren como imagen SEO permanente.
- [x] **B09.12** Permitir acceso anónimo a imágenes de artículos publicados para compartir y rastrear. Versionar rutas al sustituir archivos; definir explícitamente la retención/caché de medios al archivar. Retirar futuras entregas no puede borrar copias ya descargadas por terceros.
- [x] **B09.13** No borrar medios al reemplazar la portada si los usan otras revisiones. Diseñar limpieza explícita de huérfanos con período de conservación; no activar borrado automático sin una regla definida.
- [x] **B09.14** Restringir eliminación definitiva a artículos archivados, mostrar título y consecuencias y exigir confirmación explícita en la interfaz. Resolver referencias, revisiones, redirecciones y archivos compartidos en una operación controlada.

## 7. Editor y administración

- [x] **B10.1** Añadir navegación interna «Intereses / Blog» en `/admin`, conservando autenticación, cierre de sesión y cambio de contraseña. Mantener administración excluida de analítica pública.
- [x] **B10.2** Crear listado con búsqueda administrativa, filtros por estado/categoría, título, autor, fechas, destacado y señal «Cambios sin publicar». Separar acciones de guardar y publicar visualmente.
- [x] **B10.3** Añadir modo de ordenación global de publicaciones: arrastrar con asa, botones Subir/Bajar y alternativa de posición. En listas paginadas, permitir mover a una posición global mediante servidor; no confundir orden de la página con orden del catálogo.
- [x] **B10.4** Diseñar editor por secciones: Contenido; Clasificación y portada; Instagram y referencias; SEO y compartir; Publicación e historial. En móvil usar secciones desplegables y barra de acciones que no oculte campos.
- [x] **B10.5** Elegir editor compatible con React/SSR, accesible y de licencia apropiada tras revisar documentación vigente. Persistir un documento JSON versionado, nunca HTML arbitrario. Registrar la dependencia elegida y la justificación.
- [x] **B10.6** Admitir párrafos, H2/H3, negrita, cursiva, listas, enlaces, citas, imágenes con pie/alt y separadores. Posponer tablas complejas, HTML libre, scripts y embeds arbitrarios.
- [x] **B10.7** Renderizar bloques mediante componentes permitidos; validar tipos, profundidad, longitudes y protocolos de enlaces. Rechazar `javascript:`, atributos de evento y bloques desconocidos tanto en API como en renderer.
- [x] **B10.8** Autoguardar después de 1500 ms sin cambios, con como máximo una escritura activa y una nueva versión pendiente. Ese debounce es distinto del delay de presentación de 800 ms. Mostrar «Guardando», «Guardado» y errores reales.
- [x] **B10.9** Conservar borrador en memoria ante errores; avisar al salir si queda contenido sin persistir. Resolver conflictos de versión antes de continuar autoguardando. No prometer recuperación tras cerrar el navegador de cambios que nunca llegaron al servidor.
- [x] **B10.10** Ofrecer guardar manualmente y previsualizar página/modal mediante sesión autorizada. No colocar cuerpos de borradores en query strings ni en almacenamiento público.
- [x] **B10.11** Añadir selección de autor y ficha breve; fecha/revisor editorial opcionales con datos reales. Permitir fuentes con título y URL y reels con URL, etiqueta y prioridad.
- [x] **B10.12** Permitir CTA opcional a una ruta/servicio permitido; conservar las reglas existentes de contacto, consulta y Hotmart. No insertar CTA obligatorio en todos los artículos.
- [x] **B10.13** Validar requisitos antes de publicar, mostrar errores junto al campo y resumen accesible. Un borrador puede estar incompleto; una publicación debe tener título, slug, resumen, cuerpo, autor, categoría y portada con alt pertinente.
- [x] **B10.14** Mostrar historial con fecha/autor y previsualización de la versión; restaurar sin sobreescribir el historial. Definir política de retención antes de purgar revisiones.

## 8. SEO, compartir y descubrimiento

| Campo de edición | Valor inicial y regla |
| --- | --- |
| Título SEO | Hereda título editorial si no hay valor explícito |
| Descripción SEO | Hereda resumen si no hay valor explícito |
| Slug | Propuesto desde título; editable y validado como único |
| Imagen social | Hereda portada; permite imagen específica, preferentemente 1200×630 px |
| Título/descripcion social | Heredan SEO, con override opcional |
| Permitir indexación | Solo efectivo en publicación y cuando lo permite el flag global del sitio |

- [x] **B11.1** Persistir overrides SEO/social dentro de la revisión. Usar nulo como herencia real: al editar el título del borrador, el valor heredado se actualiza; un override explícito se conserva.
- [x] **B11.2** Añadir vistas previas orientativas de resultado de búsqueda y enlace compartido. Mostrar contadores y recomendaciones de longitud, sin prometer que Google mostrará exactamente esos textos.
- [x] **B11.3** Generar canonical absoluto en el dominio oficial; modal y página completa comparten la misma URL canónica. No ofrecer canonical libre en el editor inicial.
- [x] **B11.4** Generar Open Graph y Twitter Card con título, descripción, imagen pública estable y alt. Escapar metadatos y JSON-LD; no permitir que el contenido cierre etiquetas o ejecute scripts.
- [x] **B11.5** Generar `BlogPosting` y `BreadcrumbList` desde datos reales de la publicación: título, imagen, autor/perfil, editor, fechas y URL. No añadir reseñas, puntuaciones ni atributos no respaldados por el artículo.
- [x] **B11.6** Crear sitemap dinámico del blog con artículos publicados e indexables, integrado desde el sitemap principal o un índice de sitemaps. Actualizar `lastmod` por modificación pública relevante, no por lectura o autoguardado.
- [x] **B11.7** Respetar `SEO_ALLOW_INDEXING` y entorno: publicar un artículo no activa por sí solo la indexación global del sitio. Borradores y previews requieren autorización y llevan `noindex`/`no-store`.
- [x] **B11.8** Paginación y filtros mediante parámetros validados y enlaces reales; cada página del listado tiene URL reproducible. Primera entrega: indexar `/blog` y artículos habilitados; filtros/categorías/páginas adicionales con `noindex,follow` y canonical propio normalizado, sin canonizar resultados distintos a la primera página.
- [x] **B11.9** El artículo completo, sus enlaces internos y metadatos deben existir en HTML inicial, aunque JavaScript falle. Evitar duplicar contenido de página/modal en el mismo DOM.
- [ ] **B11.10** Verificar manualmente vista de código fuente, estado HTTP, Rich Results Test y previsualización de enlaces cuando exista un entorno accesible. No marcar validación remota como aprobada por pasar unit tests.

Fuentes de referencia: [títulos](https://developers.google.com/search/docs/appearance/title-link), [descripciones](https://developers.google.com/search/docs/appearance/snippet), [datos de artículos](https://developers.google.com/search/docs/appearance/structured-data/article) y [metadatos admitidos](https://developers.google.com/search/docs/crawling-indexing/special-tags). Revalidarlas al implementar.

## 9. Navegación modal y estado de lectura

- [x] **B12.1** Abrir modal solo ante clic principal interno desde el listado. Mantener Ctrl/Cmd+clic, clic central, abrir en pestaña nueva y enlaces copiados como navegación normal.
- [x] **B12.2** Guardar en History API la ubicación de fondo, filtros, página, scroll y enlace que abrió el artículo; mantener la URL visible del artículo sin duplicar entradas por renders.
- [x] **B12.3** Atrás desde el modal restaura listado y scroll; Adelante reabre el artículo. Cerrar el modal solo llama a `history.back()` cuando existe la entrada de fondo propia; en acceso directo, «Volver al blog» navega de forma segura al listado.
- [x] **B12.4** Abrir relacionados dentro del lector sin crear una pila de modales. Usar historial coherente entre artículos: Atrás recorre artículos visitados y luego regresa al listado; cerrar vuelve a la entrada de fondo registrada.
- [x] **B12.5** Descartar respuestas obsoletas si se cambia de artículo o se cierra durante la carga. Cancelar peticiones y temporizadores; limpiar bloqueo de scroll y devolver foco correctamente.
- [x] **B12.6** Actualizar título/metadatos al abrir otro artículo y restaurarlos al cerrar. No escribir datos de borrador en la cabecera pública.
- [x] **B12.7** Conservar listado visible en memoria al abrir/cerrar y revalidarlo cuando corresponda; invalidar esa memoria tras publicar/reordenar desde la misma sesión administrativa.

## 10. Componentes y módulos previstos

Nombres orientativos; mantener responsabilidades, no crear abstracciones vacías. Cada componente visual incluye CSS propio, skeleton y pruebas unitarias.

- [x] **B13.1** Páginas: `BlogPage`, `BlogArticlePage`; módulos administrativos `AdminBlog` y `ArticleEditor` dentro de la rama privada existente.
- [x] **B13.2** Presentación pública: `BlogHero`, `BlogFeaturedArticle`, `BlogCategoryFilter`, `BlogArticleCard`, `BlogArticleGrid`, `BlogPagination`, `ArticleContent`, `ArticleModal`, `ArticleMeta`, `ArticleShare`, `ArticleReels`, `ArticleReferences`, `RelatedArticles` y `ReadingProgress`.
- [x] **B13.3** Presentación administrativa: listado, editor por bloques, formulario SEO, selector de medios, clasificación, historial y acciones de publicación. Dividir los módulos grandes conforme aparezcan responsabilidades reales.
- [x] **B13.4** Hooks/servicios: consultas públicas, edición con concurrencia/autoguardado, navegación modal, progreso de lectura y cliente de API. Reutilizar hooks existentes de delay/presencia donde su contrato encaje.
- [x] **B13.5** Servidor: validación editorial, autorización administrativa, repositorio, transacciones de publicación/orden, entrega SSR, sitemap y medios. Mantener contratos públicos separados de respuestas administrativas.

## 11. Medición y rendimiento

- [x] **B14.1** Extender los catálogos cerrados de analítica para rutas del blog; hoy las rutas dinámicas se normalizarían como desconocidas. Usar identificadores internos y enums controlados, sin contenido libre ni datos del editor.
- [x] **B14.2** Definir eventos de vista de artículo, filtro, lectura completada, reel, compartir, relacionado y CTA. Contar una sola vista lógica al abrir artículo, aunque se monte como modal; no duplicarla por hidratación.
- [x] **B14.3** Definir «lectura completada» como cuerpo visible hasta al menos el 90 %, con documento activo; documentar que es una señal de scroll, no prueba de comprensión. Usar tiempo visible solo si se define su contrato.
- [x] **B14.4** Respetar consentimiento y flags actuales. No activar GA4/Clarity ni crear campañas por implementar el blog. Excluir administración y previews de todas las mediciones públicas.
- [x] **B14.5** Cargar el editor administrativo por separado del bundle público. Limitar payloads del listado y diferir cuerpos, historial y medios completos hasta que se soliciten.
- [x] **B14.6** Reservar tamaños de imágenes/skeletons, usar `srcset`, carga diferida bajo el pliegue y prioridad solo para la imagen principal que corresponda.
- [x] **B14.7** Mantener cargas independientes de listado, categorías y relacionados, cada una con error y reintento. Una falla en relacionados no bloquea la lectura del artículo.
- [ ] **B14.8** Antes de ajustar coreografías según latencias, registrar al menos 30 escenarios por consumo externo conforme a `AGENTS.md`: condiciones, carga/recarga/caché, duración de petición y revelado, errores, media, mediana, mínimo, máximo, desviación, p90 y p95. No sustituir el fin real de la petición por una estimación.

## 12. Verificación y criterios de aceptación

- [x] **B15.1** Unit tests de validadores, campos SEO, bloques, URLs, slugs, tamaños y renderer ante contenido malicioso o desconocido.
- [x] **B15.2** Unit tests de permisos: lectura de publicados, rechazo de borradores/archivados, sesión inválida, CSRF y operaciones fuera del catálogo; SQL con rollback cuando exista entorno autorizado.
- [x] **B15.3** Unit tests de versiones, autoguardado, conflicto 409, doble clic, fallo de guardado, publicación atómica, restauración, orden y destacado.
- [x] **B15.4** Unit tests de componentes y skeletons: props, accesibilidad, vacíos, errores, reintentos y petición más 800 ms con temporizadores falsos.
- [x] **B15.5** Unit tests de navegación/historial, modificadores de clic, cierre, Escape, foco, fondo inactivo, respuestas tardías y movimiento reducido.
- [x] **B15.6** Unit tests del HTML SSR, hidratación del snapshot, metadatos únicos, redirecciones, estados HTTP y borradores ausentes; mockear servicios y no llamar a APIs reales desde la suite.
- [x] **B15.7** Comprobar manualmente escritorio 1440/1024 px, tablet 768 px y móvil 390/320 px: menú, grilla, lector, editor, fotos, zoom, teclado y scroll. Conservar capturas locales de evidencia fuera del despliegue.
- [ ] **B15.8** Comprobar manualmente acceso directo, recarga, Atrás/Adelante, cierre desde artículo relacionado, nueva pestaña y enlace desde Instagram; verificar contenido comprensible sin JavaScript.
- [x] **B15.9** Verificar que un borrador guardado de un artículo publicado no cambia el artículo público ni su SEO; después de publicar, contenido y metadatos cambian juntos.
- [x] **B15.10** Verificar que archivar retira artículo de portada, categorías, relacionados y sitemap; el acceso directo responde según el contrato. Comprobar política de medios y caché.
- [x] **B15.11** Ejecutar suites unitarias frontend/Python y build completo después de integrar. Registrar comandos, resultados y límites; no confundir validación local con despliegue comprobado.
- [x] **B15.12** Actualizar README, documentación de administración, variables de ejemplo y guía editorial. Mantener secretos fuera del repositorio y respetar los cambios locales previos.

## 13. Lotes de implementación y entrega

Completar y documentar cada lote antes del siguiente. Las casillas B01–B15 son el detalle verificable; esta lista controla la secuencia.

- [ ] **L00 — Arquitectura:** B02 y B07. Resolver runtime SSR, empaquetado, autorización, caché y contratos antes de construir el CRUD.
- [x] **L01 — Datos:** B08 y contratos de B09. Migraciones, versiones, permisos, publicación, orden y pruebas del servidor.
- [x] **L02 — Medios y administración:** B09–B10. CRUD, Storage, editor, autoguardado, SEO editable, historial y vista previa privada.
- [x] **L03 — Blog público:** B03–B04 y B13. Portada, filtros, paginación, tarjetas y enlaces de navegación.
- [x] **L04 — Lectura:** B05–B06 y B12. Página compartible, modal, animaciones, foco, historial y relacionados.
- [ ] **L05 — SEO y entrega:** B07 y B11. Conectar datos reales al SSR, metadatos, sitemap, redirecciones, errores HTTP y publicación sin rebuild.
- [ ] **L06 — Calidad:** B14–B15. Instrumentación consentida, rendimiento, verificación manual, pruebas y documentación.
- [ ] **L07 — Publicación técnica:** preparar preview revisable, conciliar migraciones y variables del destino, verificar rutas/HTML/medios y registrar mecanismo de reversión. Desplegar a producción cuando esté autorizado; no inferirlo de la solicitud de este plan.
- [ ] **L08 — Entrega editorial:** crear con el usuario el primer artículo real, revisar portada, fuentes, reel y SEO; publicar cuando corresponda y comprobar su URL. Las pruebas no se convierten en contenido real automáticamente.

### Cierre del proyecto

- [x] El administrador permite operar el blog completo sin editar código ni hacer despliegues manuales por artículo.
- [ ] Cada publicación tiene URL propia, HTML inicial, metadatos y contenido coherentes; desde el listado abre en modal accesible.
- [x] Guardar y publicar son acciones diferentes, con recuperación de versiones y protección frente a sobrescrituras.
- [x] La web conserva Italiana, Poppins, la paleta, la marca y el tono editorial; el movimiento cumple la especificación y puede reducirse.
- [x] Las rutas existentes, formularios, asistente, intereses y reportes conservan su funcionamiento verificado.
- [x] El checkpoint distingue lo implementado, probado localmente, verificado en preview y desplegado, y enumera pendientes reales.

## 14. Pipeline editorial compartido: Article Brief → Article Generator

Ampliación del alcance basada en `articleBrief.md` y `articleGenerator.md`, leídos el 4 de noviembre de 2026. Son referencias de otro proyecto: conservar su proceso editorial y adaptar sus contratos a esta aplicación. No ejecutar sus ejemplos contra Firebase ni reutilizar el UID, autor, credenciales, servicios o rutas del proyecto de origen. Esta sección prevalece sobre exclusiones anteriores de generación automática y sobre decisiones incompatibles del plan.

Flujo acordado: idea → investigación → ficha revisable → brief pendiente en Supabase → procesamiento individual → draft → crítica editorial → versión final validada → artículo en borrador → revisión humana → publicación explícita. Local y dashboard comparten cola, contratos y reglas; el motor de generación puede cambiar.

### 14.1 Adaptación y fuente de verdad

- [x] **B16.1** Conservar los archivos recibidos como referencia y crear contratos/prompts adaptados, versionados y compartidos por ejecución local y API. Registrar versión del protocolo en cada brief y corrida. Evitar mantener dos copias de instrucciones que evolucionen por separado.
- [x] **B16.2** Sustituir Firestore y autenticación Firebase por Supabase y autorización del proyecto. Local usará herramientas autorizadas para reservar/guardar resultados; dashboard usará backend y adaptadores de proveedor. No requerir una API facturable para la redacción realizada por el agente local.
- [x] **B16.3** Definir audiencias propias: público general interesado en bienestar, personas que exploran una consulta, estudiantes de Flores de Bach y personas interesadas en naturaleza. Validar los identificadores definitivos; eliminar el default founders_pymes y resolver ambigüedad crítica con una pregunta concreta.
- [x] **B16.4** Mapear categorías al catálogo administrable Naturaleza, Terapias, Flores de Bach y Formación. Relacionar servicios con los IDs reales consultation/course/online/nature y sus rutas vigentes. No añadir `/servicios`, llamada gratuita de 20 minutos ni condiciones comerciales no confirmadas.
- [x] **B16.5** Mantener los objetivos editoriales del brief; default `educar_audiencia`. Una intención comercial solo vincula servicios existentes y apropiados. Priorizar utilidad para la audiencia de Instagram y CTA suave en artículos educativos.
- [x] **B16.6** Adaptar voz a español natural con tuteo y registro cercano del sitio. Autoría y primera persona deben proceder de una ficha aprobada: no asignar Javier ni inventar experiencias de Nicolás, casos, testimonios o resultados.

### 14.2 Article Brief: investigación antes de escritura

- [x] **B17.1** Implementar las cuatro etapas: parse/challenge; investigación; decisiones editoriales justificadas; salida estructurada. El brief no redacta el artículo. Exigir tema identificable; permitir que el sistema articule un ángulo respaldado por fuentes si la premisa permite hacerlo. Si el tema o una restricción crítica son ambiguos, pedir una aclaración concreta y no ingresar una tarea ejecutable a la cola. No exigir al usuario formular una tesis editorial antes de enviar su idea.
- [x] **B17.2** Investigar primero las fuentes del usuario y después complementar. Sin fuentes aportadas, buscar 2–4 fuentes autoritativas. Leer el contenido relevante: HEAD exitoso o un resultado de búsqueda no acreditan por sí solos respaldo de una afirmación.
- [x] **B17.3** Adaptar jerarquía de fuentes al tema: investigaciones y revisiones, organismos públicos, instituciones académicas, fuentes originales del método y especialistas identificables. Distinguir descripción tradicional de evidencia clínica; no convertir una fuente comercial en prueba de eficacia.
- [x] **B17.4** Guardar URL, título, procedencia, fecha de consulta, accesibilidad, aporte y afirmaciones respaldadas por fuente. Si no hay dos fuentes válidas, detener el brief y solicitar anclaje adicional; documentar cualquier excepción editorial antes de ponerlo pendiente. No degradar silenciosamente esa regla en Generator.
- [x] **B17.5** Decidir y justificar target → objective → category → topic → angle → keyPoints. Exigir 3–5 puntos concretos respaldados; separar alcance del tema de tesis editorial. Formular la tesis en positivo, sin imponer una polémica artificial.
- [x] **B17.6** Conservar campos del protocolo: objective, target, topic, angle, category, keyPoints, sources, externalResourceType/Url/Description, relatedServiceId, tone, desiredLength, ogImageUrl, desiredSlug, focusKeyword, seoTitle, ogTitle, ogDescription, twitterCard, structuredDataType, crawlPolicy, aiCrawlPolicy, internalTags y relatedSlugs. Añadir relaciones a reels del plan y metadatos de investigación sin duplicar contenido.
- [x] **B17.7** Mantener tone vacío salvo pedido explícito, desiredLength medium y opcionales vacíos cuando no se aportaron. Exigir focusKeyword como intención de búsqueda de 2–5 palabras; normalizar para comparar sin eliminar tildes de la prosa publicada. Separar keywords de etiquetas internas y no prometer posicionamiento.
- [x] **B17.8** Producir internamente resumen editorial, fuentes con aporte/origen y JSON válido contra el schema compartido. La entrada principal es texto libre según sección 16; no pedir al usuario rellenar o copiar campos del brief. «Generar artículo» inicia investigación y creación del brief, lo valida, persiste con `status=pending` y dispara su procesamiento sin otro clic. Ofrecer «Guardar idea» sin ejecución. Mantener edición/importación del brief únicamente como herramienta avanzada opcional.

### 14.3 Cola persistida y procesamiento seguro

- [x] **B18.1** Añadir entidades privadas `blog_briefs`, versiones/snapshots del brief y `blog_generation_runs`, vinculadas al artículo/revisión resultante. Separar estado de tarea pending/processing/completed/failed del estado editorial borrador/publicado/archivado.
- [x] **B18.2** Procesar FIFO por fecha e ID, máximo tres briefs por corrida y uno activo a la vez. Reservar atómicamente la tarea y una exclusión compartida de la cola para que local y dashboard tampoco procesen distintos artículos simultáneamente. Un PATCH de estado sin condición no constituye un lock.
- [x] **B18.3** Usar lease con expiración, heartbeat y token de propietario; rechazar resultados de un worker cuyo lease haya vencido. Recuperar tareas abandonadas explícitamente y reconciliar respuestas inciertas antes de repetir una llamada facturable.
- [x] **B18.4** Congelar el brief de cada ejecución; impedir modificar su snapshot en processing. Registrar etapas, intentos, proveedor/modelo real, versión de prompts, timestamps UTC, error estable, consumo y resultado. Las tarifas desconocidas producen costo desconocido, nunca cero inventado.
- [x] **B18.5** Crear artículo/revisión y completar tarea en una transacción idempotente con clave de corrida. Reanudar tras un fallo no debe crear artículos duplicados. Aplicar unicidad de slug en base, sin patrón GET-libre seguido de escritura no protegida.
- [x] **B18.6** Mantener publishedAt nulo hasta publicación real. Calcular SHA-256 auténtico del contenido canónico en servidor, versión automática y tokens derivados si se usan; no aceptar hashes simulados ni versiones incrementadas manualmente como fuente de verdad.
- [x] **B18.7** No editar/eliminar briefs en ejecución sin cancelación coordinada. Reintentos explícitos, limitados y auditados; un brief inválido pasa a failed con motivo y permite continuar al siguiente. Diferenciar reintentar de solicitar una regeneración nueva.

### 14.4 Article Generator: draft, crítica y final

- [x] **B19.1** Ejecutar A: borrador completo; B: crítica con rúbrica y correcciones; C: versión final; D: campos calculados. Mostrar artefactos editoriales y justificaciones breves auditables, sin solicitar razonamiento interno privado del modelo. Solo C validada ingresa al catálogo de artículos; A/B se conservan como artefactos privados de la corrida según retención definida.
- [x] **B19.2** Adaptar la plantilla: apertura concreta, desarrollo con subtítulos, explicación del tema, aplicación cotidiana y cierre contextual. Sustituir sección obligatoria de founders por relevancia para la audiencia. Usar diagramas únicamente cuando aclaren; no exigir ASCII/code blocks en relatos de naturaleza o bienestar.
- [x] **B19.3** Conservar rangos short 400–500, medium 700–900 y long 1200–1500 palabras como objetivos editoriales. Calcular palabras y tiempo de lectura en código con criterio único (referencia: 200 palabras/minuto, mínimo un minuto); eliminar umbrales contradictorios del ejemplo original.
- [x] **B19.4** Evaluar estructura, cumplimiento del brief, audiencia, tono, fuentes, legibilidad, español natural y metadatos. Corregir frases telegráficas y negaciones usadas como muletilla. Resolver contradicciones del original: no exigir contrastes repetidos cuando la regla editorial prioriza tesis afirmativa.
- [x] **B19.5** Para bienestar y terapias, revisar atribuciones, límites de evidencia y ausencia de promesas o indicaciones personalizadas no respaldadas. Los contenidos y documentos externos son evidencia, nunca instrucciones con permisos para cambiar publicación, presupuesto o herramientas.
- [x] **B19.6** Revalidar fuentes al generar. Si alguna falla, buscar alternativa equivalente y registrar cambio; si se pierde el mínimo de respaldo o cambia la tesis sustancialmente, detener para revisión del brief. No seguir con citas inventadas o contenido inaccesible presentado como leído.
- [x] **B19.7** Convertir la salida final al documento JSON por bloques del editor mediante contrato validado. Si el proveedor devuelve Markdown, usar conversión restringida y preservar enlaces/alt; no guardar dos cuerpos divergentes ni duplicar la portada dentro del contenido.
- [x] **B19.8** Generar defaults SEO/social respetando overrides. Validar tipos Schema.org contra documentación vigente; conservar BlogPosting por defecto y no aceptar automáticamente OpinionPiece u otros valores del archivo de referencia. Tratar longitudes SEO como recomendaciones y normalizar acentos para checks de keyword.
- [x] **B19.9** Traducir crawlPolicy al control editorial de indexación, sujeto a estado y flag global. Definir aiCrawlPolicy como preferencia cuya aplicación por crawler debe verificarse; no prometer privacidad ni exclusión universal mediante una metaetiqueta. Borradores siempre privados.
- [x] **B19.10** Seleccionar imágenes únicamente con procedencia y derechos verificables, integradas al flujo de medios. No inventar URLs Unsplash ni descargar ciegamente ogImageUrl. Un artículo sin imagen queda borrador incompleto si incumple requisitos de publicación.

### 14.5 Operación local y dashboard con proveedores intercambiables

- [x] **B20.1** Crear interfaz común para investigar, preparar brief, reservar tarea, generar etapas, validar y persistir. La operación local por el agente usa las mismas transiciones y validadores que el backend; sin escrituras directas que salteen la cola.
- [x] **B20.2** Añadir adaptadores para generación y búsqueda/lectura de fuentes. Definir capacidades mínimas, límites, timeouts y salida estructurada; no asumir navegación integrada ni equivalencia de calidad entre proveedores. Implementar primero un proveedor y probar sustituibilidad con mocks.
- [x] **B20.3** Mantener claves en servidor y configuración de modelo/tarifas/presupuesto independiente del chatbot. Registrar límites por corrida, tokens y costo, con detención explícita antes de exceder presupuesto. Elegir modelo y validar su API al implementar, sin fijarlo por etiquetas comerciales.
- [x] **B20.4** Ejecutar tareas fuera de la petición interactiva del dashboard mediante worker durable compatible con el alojamiento. Persistir checkpoints antes de finalizar una función; no depender de navegador abierto, proceso en memoria ni trabajo posterior a una respuesta HTTP. Elegir servicio y autenticación en L00.
- [x] **B20.5** Añadir panel Briefs/Cola: textarea de idea como entrada principal, aclaraciones puntuales, progreso y acceso al artículo generado. Permitir consultar fuentes/brief/artefactos y herramientas avanzadas de edición/importación/exportación sin convertirlas en pasos obligatorios. Mostrar FIFO, errores y costo conocido; botones accesibles y skeletons según reglas existentes.
- [x] **B20.6** Presentar tres etapas de trabajo sin porcentajes ficticios. Permitir detener la corrida entre artículos y definir cancelación durante una llamada; mostrar si pudo existir consumo aunque se cancelara. Informe final por brief: estado, artículo, objective, tono, palabras y error.
- [x] **B20.7** Crear un brief válido desde local o dashboard dispara automáticamente el pipeline hasta entregar el artículo en borrador al administrador. La solicitud inicial autoriza esas etapas, sujetas a validación, presupuesto y cola. No exigir ejecución manual por etapa. La frecuencia de 6–12 horas del archivo no aplica como espera inicial; un scheduler adicional sería recuperación operativa explícitamente configurada, nunca publicación automática.
- [x] **B20.8** Restringir búsqueda/fetch del servidor a URLs públicas HTTP(S), bloquear destinos internos y redirecciones inseguras, y acotar respuestas/tiempos. No exponer claves ni permitir instrucciones de fuentes ejecutar herramientas arbitrarias.

### 14.6 Validación y ajuste de lotes

- [x] **B21.1** Añadir unit tests para campos faltantes, fuentes insuficientes, defaults, adaptación del catálogo, límites y críticas que requieren corrección. Simular proveedores; no gastar llamadas reales en suites automáticas.
- [x] **B21.2** Probar reserva exclusiva, lease vencido, worker obsoleto, fallo tras generación, finalización idempotente, conflicto de slug, reintento y cancelación. Verificar que ninguna ruta automática puede publicar.
- [ ] **B21.3** Ejecutar un ejemplo local y otro vía dashboard con el mismo contrato, comparar cumplimiento editorial y registrar diferencias del proveedor. Las muestras deben quedar privadas y su publicación será explícita.
- [x] **L01-B — Datos del pipeline:** incluir B18 en el lote de datos antes del CRUD editorial.
- [x] **L02-B — Briefs y generación:** implementar B16–B20 después de disponer del editor y la persistencia; resolver worker/proveedores en L00. No posponer esta arquitectura hasta después de construir toda la UI.
- [ ] **L06-B — Verificación del pipeline:** incluir B21 y pruebas de presupuesto/seguridad en el lote de calidad.
- [ ] **Cierre ampliado:** local y dashboard generan desde la misma cola, una tarea por vez, conservan fuentes y trazabilidad, y entregan borradores revisables sin publicación automática.

## 15. Disparador automático, dos entradas y estimación de costo

Actualización: 4 de noviembre de 2026. Esta sección explicita la instrucción del usuario: crear el brief válido debe ejecutar el flujo completo y entregar el artículo al administrador. La revisión humana obligatoria ocurre antes de publicar, no entre cada etapa automática. Si faltan datos críticos, fuentes o presupuesto, la tarea se detiene con una causa visible.

- [x] **B22.1 — Desde Codex local:** el usuario proporciona una idea en esta conversación; el agente investiga y crea el brief, lo registra y reserva mediante el contrato compartido, ejecuta draft/crítica/final con sus herramientas locales y persiste el artículo en borrador en la misma base del dashboard. Los JSON/Markdown locales son artefactos exportables; la entrega queda acreditada por el ID del artículo en Supabase y su presencia en administración.
- [ ] **B22.2 — Desde la app:** el administrador describe idea, preferencias y enlaces en un único textarea y pulsa «Generar artículo»; backend ejecuta investigación/brief y encadena automáticamente Generator mediante worker durable y proveedor API. Mostrar progreso persistido y el enlace al borrador al terminar, incluso si se cerró el navegador. No exigir formulario estructurado de tono, audiencia, SEO ni categorías.
- [x] **B22.3 — Evitar doble ejecución:** declarar motor local o API en la solicitud; reservar tareas solo para ese motor bajo la misma exclusión global. Crear desde Codex no debe despertar también al worker API para la misma tarea. Cambiar motor exige una transición explícita y reconciliar el intento anterior.
- [x] **B22.4 — Activación fiable:** persistir brief pendiente y evento de trabajo en una misma transacción (outbox o mecanismo equivalente); reintentar entrega del evento sin duplicar llamadas/artículos. El worker se despierta al crear el brief; no depende de otro botón ni de esperar una corrida programada.
- [x] **B22.5 — Continuidad:** máximo tres artículos por corrida, uno por vez; si quedan pendientes autorizados, encadenar una nueva corrida respetando presupuesto. No dejar el cuarto artículo detenido por requerir un clic adicional. Registrar bloqueo/reanudación cuando el motor local ya no esté activo; no prometer que Codex seguirá trabajando con la sesión cerrada.
- [x] **B22.6 — Entrega:** éxito significa artículo y revisión final persistidos en borrador, brief completed y resultado visible para el administrador. Un cambio de estado sin contenido guardado no acredita entrega. No enviar correos externos por defecto.

### 15.1 Estimación reproducible del flujo completo vía API

**Preferencia vigente del usuario: usar Sol para priorizar redacción. El escenario principal es GPT-6.1 Sol de la sección 15.2; los modelos siguientes quedan como comparación histórica de costos.**

Estimación de planificación, no medición ni cotización garantizada. Artículo medium de 700–900 palabras, cuatro búsquedas web, fuentes acotadas y las cuatro etapas completas. Los tokens de entrada son acumulados entre llamadas e incluyen instrucciones, contenido recuperado y reenvíos de contexto. Los tokens de salida presupuestados incluyen texto y razonamiento facturable; el consumo real puede superar esta hipótesis.

Tarifas estándar consultadas: [GPT-5.4 mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini), USD 0.75/M entrada y USD 4.50/M salida; [GPT-5.4](https://developers.openai.com/api/docs/models/gpt-5.4), USD 2.50/M entrada y USD 15/M salida. [Búsqueda web](https://developers.openai.com/api/docs/pricing): USD 10 por 1000 llamadas, además de sus tokens de contenido. Son dos escenarios de referencia de precio, no una selección definitiva de modelos ni una equivalencia editorial demostrada.

| Etapa | Entrada supuesta | Salida supuesta | USD con mini | USD con GPT-5.4 |
| --- | ---: | ---: | ---: | ---: |
| Investigación y brief | 20 000 | 2 000 | 0.02400 | 0.08000 |
| Draft | 10 000 | 2 500 | 0.01875 | 0.06250 |
| Crítica | 12 000 | 1 000 | 0.01350 | 0.04500 |
| Final y metadatos SEO | 16 000 | 3 500 | 0.02775 | 0.09250 |
| Cuatro llamadas web | Incluidas sus entradas arriba | — | 0.04000 | 0.04000 |
| **Total de referencia** | **58 000** | **9 000** | **0.12400** | **0.32000** |
| **Con reserva presupuestaria del 25 %** | — | — | **0.15500** | **0.40000** |

Fórmula: suma por modelo de `(tokens_entrada × tarifa_entrada + tokens_salida × tarifa_salida) / 1 000 000`, más llamadas de herramientas. No descontar caché, Batch o promociones que no se hayan medido/configurado. Cada búsqueda extra suma USD 0.01 más sus tokens y contexto posterior.

Para provisionar inicialmente, usar un rango orientativo de USD 0.10–0.30 por artículo con mini y USD 0.25–0.80 con GPT-5.4 bajo consumo moderado. El 25 % es una reserva de planificación, no garantiza cubrir una regeneración completa. Fuentes extensas, razonamiento alto y reintentos pueden superar esos rangos. Un presupuesto máximo configurable debe detener o pedir reanudación, no truncar silenciosamente la entrega.

Incluye investigación textual, ficha, dos versiones del artículo, crítica y SEO. Excluye generación/compra de imágenes, transcripción de reels, impuestos, tiempo humano y costos de alojamiento, Storage, egress y worker; estos últimos dependen del servicio/plan que se elija y se cotizarán por separado. Usar imagen propia evita un costo de generación de imagen, pero no elimina almacenamiento/transferencia. El circuito desde Codex usa el consumo aplicable a la sesión local; no atribuirle automáticamente estas tarifas de API ni presentarlo como gratuito.

- [x] **B23.1** Añadir estimador previo y límite por trabajo/día; configurar tarifas y modelo en servidor, con fecha de revisión. Mostrar al admin que es una estimación y si requiere generación de imagen o transcripción adicional.
- [x] **B23.2** Registrar consumo real por etapa, tokens cacheados y de razonamiento, herramientas y costos conocidos. No sumar razonamiento dos veces si ya está incluido en output_tokens; ante consumos inciertos conservar estado/costo desconocido.
- [ ] **B23.3** Medir una muestra de artículos representativos antes de fijar costo operativo habitual; documentar modelo, longitud, fuentes, intentos y distribución de costos. Reportar costo de tareas fallidas además del costo por artículo entregado.
- [x] **B23.4** Probar inicio automático, recuperación del evento, selección de motor, cola de más de tres briefs y entrega sin navegador abierto. Conservar como única acción humana obligatoria final la revisión/publicación, salvo bloqueos explícitos del trabajo.

### 15.2 Escenario preferido: Sol en todo el pipeline

Por preferencia del usuario, presupuestar investigación/brief, draft, crítica y final con **GPT-6.1 Sol (`gpt-6.1-sol`)**, sujeto a disponibilidad en la cuenta al implementar. No confundirlo con GPT-5.6 Sol ni trasladar precios entre versiones. Fuente consultada el 4 de noviembre de 2026: [modelo y tarifas oficiales](https://developers.openai.com/api/docs/models/gpt-6.1-sol). Tarifa estándar: USD 2/M entrada y USD 10/M salida. Búsqueda web: USD 0.01/llamada más contenido de entrada, según [pricing](https://developers.openai.com/api/docs/pricing).

Mismas hipótesis de 15.1: artículo medium de 700–900 palabras, 58 000 tokens acumulados de entrada, 9 000 tokens facturables de salida y cuatro llamadas de búsqueda. Sin descuentos por caché y sin escrituras de caché solicitadas; no utilizar Fast/Ultrafast ni contexto largo con recargo en este cálculo.

| Etapa | USD estimados con Sol |
| --- | ---: |
| Investigación y brief: 20 000 entrada / 2 000 salida | 0.060 |
| Draft: 10 000 entrada / 2 500 salida | 0.045 |
| Crítica: 12 000 entrada / 1 000 salida | 0.034 |
| Final y SEO: 16 000 entrada / 3 500 salida | 0.067 |
| Cuatro búsquedas, contenido ya incluido en entradas | 0.040 |
| **Total** | **0.246** |
| **Con reserva de planificación de 25 %** | **0.3075** |

Referencia operativa: aproximadamente USD 0.31 por artículo con esa reserva; 10 artículos USD 3.08 y 100 artículos USD 30.75 bajo idénticas hipótesis. No es precio fijo ni límite garantizado: razonamiento adicional, investigación extensa y regeneraciones cambian el total. Por ejemplo, 20 000 tokens de salida facturable en lugar de 9 000 elevan la misma corrida a USD 0.356 antes de reserva. Mantener las exclusiones de infraestructura, imágenes, transcripción e impuestos de 15.1.

- [ ] **B23.5** Configurar Sol como preferencia editorial y probar su redacción con una muestra representativa antes de fijar prompts y presupuesto definitivos. Evaluar naturalidad, voz, ritmo, fuentes y correcciones reales; no asumir que aumentar razonamiento mejora automáticamente la prosa. Medir tokens de razonamiento dentro del output facturable, sin duplicarlos.

## 16. Entrada libre: una idea en lenguaje natural

Decisión del usuario: sustituir el formulario inicial del brief por una única entrada libre. El usuario expresa el encargo; el sistema lo interpreta, investiga, crea el brief y genera el artículo. Esta sección prevalece sobre referencias anteriores a completar formularios de Pending Articles. El editor del artículo final conserva sus campos de contenido y SEO.

- [x] **B24.1 — Interfaz:** mostrar el título «¿Qué artículo te gustaría crear?», un textarea visible de al menos ocho líneas y ayuda: «Cuéntanos el tema y todos los detalles que quieras: público, tono, historia, objetivo, ideas clave, fuentes o enlaces a reels. Nosotros organizamos el brief y preparamos el artículo».
- [x] **B24.2 — Ejemplo:** placeholder «Quiero un artículo sobre los baños de bosque, con tono poético y storytelling, para conectar con adultos de 40 a 60 años que buscan dedicar más tiempo a la naturaleza. Me gustaría profundizar este reel: [enlace]. Incluye…». No convertir el ejemplo en texto enviado por defecto ni en requisito de formato.
- [x] **B24.3 — Extensión:** máximo inicial de 1500 palabras y 12 000 caracteres, lo que ocurra primero; contador y mensaje accesible cerca del campo. Aceptar encargos breves si son claros, sin mínimo artificial de palabras. Validar límites en cliente y servidor con el mismo criterio de conteo. No truncar la idea silenciosamente; enlaces a fuentes extensas evitan copiarlas completas.
- [x] **B24.4 — Acciones:** botón principal «Generar artículo» y secundario «Guardar idea». Mostrar antes de ejecutar el costo estimado con Sol y aclarar «El artículo quedará como borrador para revisar y publicar». Evitar pedir confirmaciones adicionales por etapa; bloquear doble envío y conservar el texto ante errores.
- [x] **B24.5 — Interpretación:** extraer tema/alcance, audiencia y características, objetivo, tono, técnica narrativa, longitud, fuentes, reels y restricciones. Conservar el texto original y distinguir preferencias explícitas de inferencias en el brief interno. Reconocer expresiones naturales como «para engagement», «tono poético» y «storytelling».
- [x] **B24.6 — Narrativa:** añadir `narrativeApproach` (por ejemplo storytelling, expositivo o mixto) y `audienceDescription` al contrato compartido; el target resumido no debe perder edades, contexto u otras características relevantes aportadas. Mantener tono y narrativa como dimensiones distintas: poético no implica automáticamente primera persona ni una historia real.
- [x] **B24.7 — Prioridades:** respetar preferencias explícitas, incluso combinaciones de tono/objetivo diferentes de defaults. Resolver conflictos evidentes mediante una pregunta; no normalizar automáticamente una voz poética a didáctica. Usar default educar_audiencia/medium solo cuando no se indicó otra intención. SEO, categoría, tesis y subtítulos se derivan sin pedirlos como campos obligatorios al usuario.
- [x] **B24.8 — Aclaraciones:** si la idea es insuficiente, mostrar una sola pregunta concreta con otro textarea/respuesta y conservar el encargo original. Reanudar la misma solicitud al responder, sin duplicar el brief ni empezar otra corrida facturable. No interrumpir solo porque faltan campos opcionales o un ángulo que puede formularse responsablemente.
- [x] **B24.9 — Ejecución:** persistir primero una solicitud de generación con ID idempotente y texto de entrada; estados de solicitud preparando brief/necesita aclaración/en cola/generando/listo/error. Relacionar después brief y artículo. Así también se puede recuperar un fallo anterior a la creación del brief.
- [x] **B24.10 — Resultado:** tras validar la versión final, abrir o enlazar el editor administrativo con contenido, portada cuando esté disponible, clasificación, fuentes y metadatos SEO preparados. Mostrar «Borrador listo para revisar». Si falta un requisito de publicación, enumerarlo; no afirmar que está listo para publicar hasta completar las validaciones editoriales, de fuentes y medios.
- [x] **B24.11 — Codex:** aceptar el mismo encargo por conversación, por ejemplo «Quiero crear un artículo con tono poético y storytelling para engagement sobre X, pensado para un público adulto de estas características…». El agente aplica el protocolo completo y guarda el resultado en el dashboard; no exige JSON ni formulario previo. Aplicar límites de la entrada al importar el encargo, sin confundir el límite con todo el historial de conversación.
- [x] **B24.12 — Transparencia:** el brief generado y sus justificaciones quedan consultables en «Ver brief»; no exigir aprobarlo para avanzar en el recorrido normal. Mantener fuentes y crítica accesibles desde el resultado. La publicación continúa siendo humana y explícita.
- [x] **B24.13 — Relatos:** no inventar experiencias personales, pacientes ni testimonios para satisfacer storytelling. Permitir escenas hipotéticas claramente identificadas o relatos reales aportados/autorizados, respetando privacidad y voz editorial.
- [x] **B24.14 — Verificación:** probar extracción de tono poético + storytelling + engagement + audiencia detallada, encargo breve suficiente, ambigüedad real, límites, conservación tras error, aclaración/reanudación, doble clic y entrega completa sin rellenar campos estructurados. Usar los mismos casos de contrato en local y dashboard, con proveedores simulados para las pruebas unitarias.

## 17. Codex: generación completa sin consumo de API de modelos

Restricción explícita del usuario: el pipeline completo desde Codex debe ingresar el artículo sin consumir una API de generación. Esta sección prevalece sobre cualquier ambigüedad anterior acerca del motor local. La investigación, elaboración del brief, draft, crítica, versión final y metadatos se realizan dentro de la sesión de Codex con sus capacidades disponibles. El circuito del dashboard sí usa el proveedor API configurado.

- [x] **B25.1** El recorrido local no invoca OpenAI API, Anthropic ni otro proveedor de inferencia, directamente o mediante el backend, para ninguna etapa editorial. Tampoco usa búsqueda API facturable del proveedor ni generación de imágenes por API como paso implícito. Usar herramientas de consulta disponibles en la sesión y recursos propios/autorizados; si una capacidad necesaria no está disponible, informar el bloqueo sin recurrir a una API de pago.
- [x] **B25.2** Guardar solicitud, brief, artefactos y artículo final mediante herramientas autorizadas de persistencia y validadores compartidos. Las operaciones de Supabase necesarias para guardar y leer datos están permitidas: «sin API» se refiere aquí a generación/inferencia, no a impedir la persistencia requerida por el usuario.
- [x] **B25.3** Usar `execution_engine=codex_session` y un comando de importación/finalización que valide y persista sin llamar a modelos. No exigir `OPENAI_API_KEY` ni credenciales de otro proveedor para completar el recorrido local. No cargar SDKs ni inicializar clientes de generación como efecto lateral de importar los módulos de persistencia.
- [x] **B25.4** Al crear un brief local, conservar el evento de trabajo dirigido al motor local. El worker API debe ignorarlo; nunca disparar una segunda generación en el dashboard al guardar el brief o el artículo. Una caída o cierre de Codex deja trabajo recuperable por Codex, sin fallback automático a API.
- [x] **B25.5** Entregar el artículo como borrador visible en administración, con SEO, fuentes, trazabilidad y validaciones iguales al circuito API. El admin puede editarlo y publicarlo sin regeneración. Solicitar regeneración vía API será una acción independiente y explícita.
- [x] **B25.6** Registrar motor Codex y procedencia real. Indicar consumo incremental de API de inferencia del proyecto igual a cero cuando se cumpla esta restricción; no inventar tokens/costos API equivalentes. El uso de la sesión Codex y los costos de infraestructura/persistencia siguen sujetos al plan y servicio aplicables, por lo que no se promete costo total cero.
- [x] **B25.7** Verificar con mocks de clientes de inferencia que crear/importar/finalizar un trabajo local no realiza llamadas a proveedores, no requiere sus claves y no despierta el worker API. Comprobar también reintentos, recuperación y carga de módulos sin efectos laterales de generación.


## 18. Dos imágenes añadidas después del pipeline editorial

Decisión del usuario al reanudar: el brief no considera imágenes. Tanto Codex como el dashboard entregan texto y SEO; el administrador incorpora las fotografías por separado. Esta sección prevalece sobre instrucciones anteriores que delegaban imágenes al generador.

- [x] **B26.1** Excluir imágenes del brief y de los resultados generados en ambos motores. Normalizar la entrega local/API como borrador textual, descartando portada, imagen interior y bloques de imagen; no consultar APIs de imágenes.
- [x] **B26.2** Mantener un blob privado en Supabase Storage (`blog-media`), con subida autenticada, control de origen y límite de archivo. Servir al público únicamente referencias de la versión publicada, incluyendo la imagen interior; no exponer las del borrador.
- [x] **B26.3** Mostrar dos editores separados en el dashboard: «Imagen de apertura» e «Imagen interior», con archivo JPEG/PNG/WebP, vista previa, recorte, posición horizontal/vertical y acercamiento 1–3. Convertir el resultado a WebP y conservar versiones previas mediante una referencia nueva.
- [x] **B26.4** Guardar portada 3:2 y fotografía interior 4:5, descripción accesible y pie opcional por imagen. Permitir volver a encuadrar la imagen guardada; este ajuste parte del archivo WebP guardado, sin conservar un original adicional.
- [x] **B26.5** Mostrar la portada al inicio y la imagen interior hacia el 55 % del texto, a izquierda o derecha, con párrafos fluyendo a su lado. Permitir ubicación manual después de un bloque; reservar texto posterior. En móvil, usar ancho completo y encuadre 4:3. Reutilizar el lector en modal, página directa y vista previa.
- [x] **B26.6** Exigir dos imágenes distintas con descripciones antes de publicar, tanto en Python como en la base de datos. Permitir generar y guardar borradores sin imágenes. Mantener el estilo clásico, las fuentes y los colores actuales.
- [x] **B26.7** Verificar recortes, límites, cancelación, subida autenticada, skeleton y espera de 800 ms, reintento sin perder encuadre, disposición en el lector y publicación/archivo de medios. Pruebas unitarias con mocks y comprobación SQL transaccional con rollback aprobadas.
- [ ] **B26.8** Revisar visualmente en navegador escritorio/móvil el lector y la edición con fotografías reales; verificar un upload real desde una sesión administrativa del runtime de preview. No marcar esta casilla a partir de mocks o del build.

## 19. Clave OpenAI compartida con el chatbot

Instrucción posterior del usuario: reutilizar la clave del chatbot. Esta sección prevalece sobre la preferencia inicial de exigir una credencial diferente.

- [x] **B27.1** Usar `OPENAI_API_KEY` exclusivamente desde el servidor; permitir `BLOG_OPENAI_API_KEY` como override opcional. Compartir la resolución entre admisión de encargos y worker y comprobarla con mocks.
- [x] **B27.2** Conservar modelo, habilitación, tarifas y presupuestos específicos del blog. La clave compartida no activa generación por sí sola ni cambia el modelo del chatbot.
- [x] **B27.3** Mantener Codex sin inferencia API, aun cuando la clave compartida esté presente. Documentar configuración y límites de la comprobación real de acceso al modelo.

## 20. Participación: comentarios, likes y guardados

Ampliación del usuario durante la implementación. Los guardados son locales. Supuesto operativo comunicado para las otras acciones: likes compartidos y comentarios públicos tras moderación, sin cuentas de lectores.

- [x] **B28.1** Guardar marcadores en el navegador con ID, slug, título, categoría y fecha; máximo 100. Manejar almacenamiento corrupto o sin cuota sin fingir persistencia. No guardar cuerpos completos ni prometer acceso offline.
- [x] **B28.2** Mostrar acceso «Guardados» únicamente si hay alguno; permitir abrir y quitar desde la portada y el lector, conservar la navegación modal y sincronizar pestañas del mismo navegador.
- [x] **B28.3** Permitir dar y retirar likes compartidos por identidad anónima de navegador. Enviar un estado deseado idempotente; impedir duplicación por doble clic y no afirmar que el número representa personas verificadas.
- [x] **B28.4** Permitir comentarios con nombre público y texto de hasta 2000 caracteres. Entregar confirmación de recepción y mantenerlos pendientes de aprobación; mostrar al autor sus pendientes y permitir retirar comentarios propios.
- [x] **B28.5** Incorporar moderación al dashboard con pendientes, publicados y ocultos; aprobar, ocultar y eliminar mediante sesión administrativa y auditoría.
- [x] **B28.6** Mantener hashes de identidad en tablas privadas con RLS, cookie funcional firmada/HttpOnly, validación de origen/cabecera, límites de tamaño/frecuencia y escape de texto. No guardar IP, correo ni teléfono. Lectura sin participación no crea cookie.
- [x] **B28.7** Verificar likes idempotentes, privacidad de pendientes, eliminación propia, moderación autorizada, rechazo de archivados, reintentos, errores y esperas de petición + 800 ms mediante unit tests y SQL con rollback.
- [ ] **B28.8** Revisar visualmente la ampliación en escritorio y móvil y comprobar en preview real la interacción entre dos navegadores y el flujo administrativo completo. Distinguir fixture local de prueba contra el runtime desplegado.
