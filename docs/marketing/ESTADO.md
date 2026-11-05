# Checkpoint de implementación de marketing

## Reanudar aquí

**Estado vigente, 2026-11-01: reanudado por el usuario en M13. M12 (conexión de Hotmart) queda para el final por instrucción expresa. M13 tiene código, exportación y RPC verificados; quedan pendientes la hoja privada y la conciliación con fuente comercial real.**

Al continuar: leer [CONCILIACION.md](CONCILIACION.md), M13/M14 del [plan](../PLAN_SEO_ANALYTICS_CONVERSION.md) y el [contrato](../CONTRATOS_MEDICION_MARKETING.md). Revisar `git status --short`: los cambios anteriores se subieron; los archivos nuevos de M13 permanecen locales. No retomar M12 por orden numérico ni activar proveedores por inferencia.

## Actualización vigente: despliegue y M13

- Los cambios acumulados se publicaron en Git como `f042af9`; `d4b1c81` corrigió `.vercelignore` para conservar scripts de SEO/prerender. El despliegue productivo se comprobó Ready y ligado a los dominios oficiales. El registro anterior de «no se desplegó» es histórico.
- `/admin` está implementado y desplegado: acceso privado, filtros, detalle, cambio de contraseña y lectura de intereses. Es gestión operativa, no reemplaza el tablero de marketing de M14.
- M13 implementa fórmulas exactas, snapshots agregados, cobertura explícita, datasets separados y CLI offline/base. N/D conserva su motivo; no se convierten monedas ni se unen identidades de analítica y contactos.
- RPC de solo lectura aplicada: `20261101201452_marketing_report_snapshot`. Solo service_role; no se ampliaron permisos públicos. El flag nuevo `MARKETING_REPORTS_ENABLED` queda false por defecto e independiente de escrituras.
- Verificación: 24 pruebas nuevas; suite Python completa de 131 pruebas y build aprobados; SQL `marketing_report_unit_passed` con rollback. Seguridad sin WARN/ERROR. Ver método y límites en [CONCILIACION.md](CONCILIACION.md).
- Exportación real de solo lectura, 2026-10-01 a 2026-11-01: sin ingresos/campañas cargados; seis agregados de intereses. Archivos en `reports/`, ignorados por Git/Vercel y bloqueados para lectura de archivos desde Vite. El ejemplo separado es ficticio.
- Google Drive no completó autenticación en dos intentos consecutivos. M13.6 conserva pendiente importar a hoja privada y comprobar permisos. M13.7 tiene conciliación sintética reproducible, pero la comercial real requiere su fuente; no se inventaron ventas ni se hicieron compras.
- Los importes importados no acreditan cobertura total. La RPC informa partial/missing; únicamente una declaración explícita de conciliación del período puede completar ledger/gasto en un reporte.
- Próximo lote de código: M14, avanzando solo las partes independientes de cuentas externas. M07/M10 y fuentes GA4/Search Console/Looker conservan dependencias externas. M12 se retomará al final según instrucción del usuario.

## Registro histórico hasta M11

## Alcance autorizado

El usuario solicitó empezar la implementación paso a paso y conservar checkpoints. Implementar y verificar por lotes. No contratar servicios, efectuar compras ni activar producción por inferencia. Mantener los cambios de interfaz ya existentes y los 800 ms de AGENTS.md.

## Base de esta sesión

- Rama: `main`.
- Cambios previos al inicio: README.md modificado; tres documentos de planificación sin seguimiento. Las mejoras de interfaz anteriores ya forman parte de la base actual.
- React/React DOM 19.2.8, Vite 8.0.3, Vitest 5.0.5; RTL 16.3.0 y JSDOM 27.1.0, según package.json.
- Runtime verificado: Node v24.18.0 y npm 11.16.0. Vercel tiene una asociación local al proyecto `nicolaszamara`; no demuestra acceso a las cuentas de analítica ni autorización de producción.
- Analítica actual: seis eventos locales, sin proveedor. El contador Hotmart existente usa un endpoint propio.
- No se leyeron ni copiaron valores de `.env.local`. No publicar credenciales en checkpoints.

## M00 — Inventario

- [x] M00.1 Rama, base, versiones de dependencias y autorización registradas.
- [ ] M00.2 Dominio productivo/titular confirmados. El código contempla www.nicolaszamara.com y nicolaszamara.com; no prueba su configuración real.
- [ ] M00.3 GA4, Clarity, Search Console y Looker: IDs y accesos pendientes de verificar.
- [ ] M00.4 Fuente de pagos de consultas y acceso a Hotmart: pendientes. No hay evidencia de un webhook de compras existente.
- [ ] M00.5 Campañas activas/monedas: no confirmadas. El catálogo empezará vacío, sin inventar campañas.
- [x] M00.6 Pendientes de lanzamiento: contenido de contacto y privacidad, responsable, conservación y autorizaciones en CONTENT_STATUS.md. La integración de medición no equivale a aprobación de esos contenidos.

M00 queda parcial por dependencias externas. El plan permite avanzar los módulos locales independientes.

## Decisiones de M01

- Versión editorial inicial: `marketing-baseline-v1`; identifica esta base visual, no un hash de build.
- Registro de campañas vacío hasta disponer de campañas aprobadas.
- El catálogo nuevo no reemplaza todavía el bus existente. Su conexión se realiza en M03 después del consentimiento de M02.
- KPI y denominadores: sección E del contrato; los faltantes se muestran N/D. No inferir ingresos a partir de clics.
- La lista de hosts del validador es provisional según el código existente; no confirma dominio productivo y deberá concordar con el catálogo de M08.
- M01 exige todos los parámetros específicos de cada evento; contexto y UUID los añadirá el emisor, nunca un botón. `experiment_exposure` permanece deshabilitado hasta registrar IDs reales en M16.
- Cada campaña requiere la tupla completa aprobada (id, source, medium, campaign, content). Los fixtures no se incluyen en el registro productivo.
- CONTENT_STATUS.md tiene información histórica desactualizada: WhatsApp y fotografías ya fueron suministrados durante esta conversación. No volver a tratarlos como ausentes. Responsable, conservación y datos comerciales no se han confirmado.

## M01 — Entregado

- [x] M01.1 Catálogo versionado de 17 eventos y enums en `src/config/analytics.js`.
- [x] M01.2 `SITE_VERSION=marketing-baseline-v1` independiente del build.
- [x] M01.3 `config/marketing/campaigns.json` vacío y resolución por tupla exacta en `src/services/campaignRegistry.js`.
- [x] M01.4 KPI y fuentes fijados en el anexo E; no se reimplementan fórmulas todavía.
- [x] M01.5 Mapa de los seis eventos anteriores conservado en `LEGACY_ANALYTICS_EVENTS`; migración efectiva pendiente de M03/M06.
- [x] M01.6 Pruebas de campos extra, valores desconocidos, datos personales, parámetros de URL y campañas no aprobadas.

## Verificaciones

- `node node_modules/vitest/vitest.mjs run src/config/analytics.test.js src/services/campaignRegistry.test.js --maxWorkers=1 --testTimeout=20000`: **20 pruebas aprobadas en 2 archivos**.
- `npm.cmd run build`: **aprobado**.
- No hay llamadas a servicios externos ni cambios de esquema en este lote. No se ejecutó la suite completa porque el catálogo todavía no se conecta a los flujos de producción.

## Trabajo histórico de M02 (ya ejecutado; no es el punto de reanudación)

1. Crear `src/services/consentService.js` y tests: estado desconocido/rechazado/aceptado, categorías separadas, versión/fecha, almacenamiento corrupto/bloqueado y revocación.
2. Crear `AnalyticsConsentContext`, controles de preferencia con CSS/skeleton/tests e integrarlos en la unidad de carga inicial de App.
3. Definir flags de entorno apagados por defecto; revisar documentación vigente de proveedores antes de conectar APIs o scripts.
4. Impedir también el contador Hotmart no consentido; conservar navegación y los formularios funcionales. Comprobar la compatibilidad con sus tests existentes.
5. Actualizar este archivo y las casillas M02 solo con evidencia. Los accesos externos de M00 no bloquean estas tareas locales.

## Registro de avance

- Inicio: inventario local leído y checkpoint creado antes de modificar código.
- Cierre de M01: catálogo y campañas implementados, pruebas dirigidas/build aprobados. Punto de reanudación fijado en M02.1.
- Avance siguiente sesión: servicio/contexto de consentimiento, panel con CSS/skeleton/tests, reapertura desde footer y permiso aplicado al bus actual/contador Hotmart. Flags desactivados por defecto. Build aprobado. Suite completa en ejecución (sesión de herramienta 32472; si ya no existe, repetir el comando y registrar su resultado).
- M03 en preparación: `scriptLoader.js`, `ga4Adapter.js`, `analyticsPageContext.js`, `marketingTracker.js` y tests de los últimos tres. No están conectados a App ni al emisor actual. Próximo: comprobar suite M02, probar estos módulos, conectar emisor/runtime y comprobar TTL/revocación.

## Actualización de avance (prevalece sobre el registro histórico anterior)

- Usuario confirmó que las cuentas GA4, Clarity, Search Console y Looker todavía no están creadas. No inventar IDs ni activar flags. No hay herramientas conectadas específicas para gestionar esas cuatro cuentas en esta sesión.
- M02: consentimiento separado, almacenamiento/expiración, UI/skeleton, contexto, footer, política de privacidad y bloqueo de bus/contador sin permiso implementados. Revocación de GA4 implementada mediante flag ga-disable; Clarity aún no se integra.
- M03: emisor para eventos nuevos, cola de 50/30 s, loader único, adaptador GA4 y revocación conectados. Los nombres legacy siguen siendo locales temporalmente; registrar dimensiones/eventos clave y desactivar medición mejorada en GA4 requiere cuenta.
- M04: vistas por ruta, espera sin flash al volver rápido, saneamiento de URL/referrer y sesión consentida de atribución de 30 minutos implementados. Mapeo nativo de campañas preparado; DebugView pendiente de cuenta.
- M05: acciones del héroe, círculos/textos de áreas, enlaces de páginas, menú/footer, WhatsApp/Hotmart y exposición de secciones/CTA instrumentados. Hook de exposición con observer/1 s/tab visible; datos de formulario y conversación enmascarados.
- M06: inicio/validación/envío/retry/error/lead en formularios y contacto del chat; apertura/primer envío del chatbot medidos sin contenido libre. Leads observados solo después de éxito y 800 ms.
- M08: catálogo de rutas, metadata/canonical/JSON-LD por ruta, robots y sitemap en build. Se reemplazó el rewrite global por rutas estáticas explícitas y 404.html; validación HTTP real en Vercel pendiente. La indexación exige SEO_ALLOW_INDEXING=true y VERCEL_ENV=production; permanece apagada. Titularidad y host canónico siguen pendientes.
- M09 en progreso: App ahora renderiza contenido dentro de un shell de carga; HydrationContext mantiene formularios estáticos deshabilitados; CSS de fallback revela contenido después de 800 ms sin JS. El cliente usa hydrateRoot si hay HTML previo. `scripts/prerender.mjs` consume `.preview/marketing-ssr/entry-server.js`. **No marcar completo: el último build falló en useScrollThreshold.**

### Evidencia acumulada

- Primera suite completa con vmThreads: **220 pruebas/54 archivos aprobados**.
- Suite completa tras sensores/formularios: **229 pruebas/58 archivos aprobados** (anterior al cambio SSR).
- SEO + App: **21 pruebas/2 archivos aprobados** (anterior al cambio SSR).
- Build con metadatos: **aprobado**, 8 rutas y sitemap/robots, noindex por defecto.
- Último build SSR: cliente y bundle SSR compilan, prerender falla por `window` en `useScrollThreshold`. Corregir y volver a verificar. Aún no hay preview ni despliegue de esta implementación.

### Cierre técnico de M09 (actualización más reciente)

- Lectura de window corregida: `useScrollThreshold` inicia sin navegador y actualiza scroll en efecto.
- `npm.cmd run build`: **aprobado**, cliente + SSR + HTML de 8 rutas/404, sin peticiones externas. Indexación apagada.
- SSR, HydrationContext, App y Chatbot: **44 pruebas/4 archivos aprobados**.
- `App.hydration.test.jsx`: **1 prueba aprobada**, sin errores recuperables, contenido único, formulario habilitado después de montar y skeleton durante los 800 ms.
- El fallo SSR del registro previo queda resuelto. No se ha verificado visualmente ni publicado en Vercel; no declarar completa la validación HTTP/remota.
- Los skeletons de página ya no duplican `id=main-content`. El HTML estático contiene contenido reservado y CSS de revelado sin JS; formularios estáticos deshabilitados para impedir envío GET de datos personales.

## Cierre de M11 y pausa (registro histórico; superado por la reanudación de M13)

- [x] M11.1–M11.9: libro monetario privado, validadores, importador CLI, plantillas CSV y pruebas terminados. Detalles en [M11_IMPORTACION.md](M11_IMPORTACION.md).
- Migración remota aplicada: `20261029232155_marketing_ledger`; copia local en `supabase/migrations/`. Seis tablas con RLS y acceso exclusivo de servidor; RPC de importación atómica. No ejecutar db push sin conciliar las migraciones históricas de `database/`.
- Dinero exacto sin float, monedas separadas, reingresos idempotentes, reversos limitados al saldo y revisiones de gasto. Los ajustes de signo no definido se rechazan para revisión.
- Datos sintéticos SQL revertidos con ROLLBACK; conteos posteriores de lotes/transacciones/movimientos/gastos/revisiones: cero. No se cargaron datos comerciales reales.
- `MARKETING_LEDGER_ENABLED` sigue apagado por defecto; no se modificó `.env.local`. Sin endpoint público de importación.
- Python: **87 pruebas aprobadas**, incluidas 12 de marketing. Comando: `.venv\Scripts\python -m unittest discover -s tests`.
- Frontend completo: **244 pruebas en 62 archivos aprobadas**. Comando: `node node_modules/vitest/vitest.mjs run --pool=vmThreads --maxWorkers=1 --testTimeout=20000`.
- Dry-run CLI del fixture: válido, una fila aceptada, sin errores ni acceso a credenciales/almacenamiento.
- SQL: `marketing_ledger_unit_passed`, con replay, venta única, reembolso parcial, rollback atómico, revisión de gasto y RPC denegada a roles públicos.
- `git diff --check`: aprobado. Build cliente/SSR/prerender de M09 ya aprobado; no hubo cambios de frontend posteriores a ese build.
- No se desplegó esta implementación. GA4, Clarity, Search Console y Looker aún no tienen cuentas/IDs suministrados; medición e indexación siguen apagadas. M09 conserva pendientes visuales/HTTP reales.
- Código local implementado: M01–M06, M08, M09 y M11 (9 lotes); no equivale al cierre de sus verificaciones externas. Restan 7 lotes principales: M07, M10 y M12–M16, además de pendientes externos en los lotes ya programados.
- **Detención explícita:** el usuario pidió terminar el siguiente lote y hacer una pausa. Se terminó M11. M12 no iniciado; no continuar automáticamente.
- Próximo trabajo independiente: M11/M13 (CSV y métricas). M07, M10, M12 y M14 tienen dependencias de cuentas/datos externos; no marcar sus partes externas completas.
