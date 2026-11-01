# Plan de implementación: SEO, marketing, conversión e ingresos

Fecha: 29 de octubre de 2026. Estado: **en pausa tras M11; pendientes externos y de activacion**. Checkpoint: [estado de implementación](marketing/ESTADO.md).

Este documento no autoriza activar servicios, contratar planes, modificar bases remotas ni desplegar. Describe el trabajo solicitado para una ejecución posterior. Las casillas permanecen vacías hasta que exista evidencia de cada resultado.

## 1. Objetivo y límites

Obtener información para decidir dónde invertir en marketing, qué contenidos atraerán demanda y qué cambios de diseño aumentan solicitudes e ingresos. Toda métrica debe responder una pregunta comercial o de conversión.

Incluye SEO técnico/editorial, adquisición, comportamiento, embudos, resultados monetarios confirmados, atribución con sus límites, tablero privado y evaluación de rediseños. Excluye CRM, agenda, automatización de mensajes, contabilidad completa, monitoreo general de infraestructura y cambio del modelo del chatbot. Los controles de privacidad y calidad son requisitos de la medición.

Documentos que deben leerse junto a este plan:

- [Contratos de eventos, sensores, datos y métricas](CONTRATOS_MEDICION_MARKETING.md).
- [Ejecución con Sol 6.1 low y Luna; instrucciones por lote](GUIA_EJECUCION_MODELOS_MARKETING.md).
- [Reglas del repositorio](../AGENTS.md).

## 2. Base revisada en el código

| Pieza actual | Estado observado | Consecuencia para el plan |
|---|---|---|
| React + Vite, navegación propia | `src/app/App.jsx`, `useSiteNavigation`; sin React Router | Medir cambios de ruta explícitamente y evitar dos emisores de vistas |
| HTML inicial | `index.html` contiene `noindex,nofollow`; App cambia robots después con JS | Corregir robots en el HTML servido antes de solicitar indexación |
| Metadatos | `pageMetadata` en `src/content/siteContent.js` | Reutilizar contenido y ampliar canonical, imagen social y política por ruta |
| Analítica | `analyticsService.js` despacha `nzamara:metric`; seis nombres permitidos, sin proveedor | Evolucionar el contrato; evitar duplicar eventos antiguos y nuevos |
| Hotmart | `hotmartTrackingService.js` y `/api/hotmart_click`; UUID, reintento y contador privado | Son clics, no compras; migrar la captura con consentimiento y mantener compatibilidad |
| WhatsApp | Consulta y `FloatingWhatsApp` usan el mismo número, evento sin ubicación | Diferenciar `consultation_contact` de `floating_contact` |
| Intereses | `online`, `nature`, `consultation`; captura de chat separada | Conservar contratos existentes, distinguir formulario y origen |
| Confirmación de formularios | HTTP 201 y después 800 ms; servicio devuelve solo `status` | Medir confirmación observable; no confundirla con todos los registros persistidos |
| Base de contactos | `source`, `source_path`, información personal y consentimientos | Los tableros reciben agregados; las identidades de contacto nunca van a GA4/Clarity |
| Demoras | `BASE_DELAY_MS = 800`, hooks con cancelación | Los sensores se activan al revelar contenido, sin añadir otra espera |
| Despliegue | Vercel reescribe rutas no API a `/index.html` | Revisar precedencia de archivos prerenderizados, rutas 404 y `/api` |

No se verificaron cuentas GA4, Clarity, Search Console, Looker Studio ni permisos de Hotmart durante esta planificación. No se inventan identificadores, costos de campañas, ingresos, tasas de conversión ni mediciones históricas. Hay cambios locales de otros trabajos: conservarlos.

## 3. Arquitectura elegida para la primera versión

1. **Un emisor propio de eventos**, con catálogo y validación, en el frontend.
2. **GA4 mediante adaptador directo de Google tag**, con eventos manuales. No instalar además GTM en esta entrega: dos mecanismos de configuración complicarían la deduplicación.
3. **Clarity** para mapas de clic/scroll y revisión visual, con consentimiento y enmascaramiento explícito.
4. **Search Console** para demanda orgánica e indexación.
5. **Datos comerciales privados**: compras confirmadas desde Hotmart e importaciones de pagos de consultas y gasto publicitario. Empezar con importación CSV; automatizar solo Hotmart cuando exista acceso y documentación de payload verificable.
6. **Looker Studio** como tablero. GA4 y Search Console por sus conectores; agregados comerciales mediante CSV importado en una hoja privada. La exportación manual inicial evita abrir la base de contactos a una herramienta externa.
7. **Sin modelo de IA en el análisis inicial**: fórmulas y reglas reproducibles generan indicadores; una persona interpreta y prioriza. No añadir consumo de tokens a cada visita o reporte.

El repositorio conservará definiciones, consultas/exportadores, configuración documentada del tablero y evidencia. Un `.md` con un enlace a Looker sin configurar las gráficas no completa el tablero.

## 4. Orden de ejecución y dependencias

Cada fila es un lote. Ejecutar sus subpasos en orden. `Sol low` significa GPT-6.1 Sol con esfuerzo low. La alternativa Luna es una recomendación de ingeniería, no una garantía de equivalencia.

| ID | Entregable | Depende de | Modelo base | Alternativa |
|---|---|---|---|---|
| M00 | Inventario y accesos pendientes | — | Sol low | Luna medium |
| M01 | Contratos definitivos y campañas | M00 | Sol low | Luna high con revisión |
| M02 | Consentimiento y configuración | M01 | Sol low | Sol para revisión |
| M03 | Emisor y adaptador GA4 | M02 | Sol low | Luna high |
| M04 | Vistas SPA y atribución de sesión | M03 | Sol low | Luna high con revisión |
| M05 | Clics y exposición de secciones | M04 | Sol low | Luna medium |
| M06 | Formularios y chatbot | M04 | Sol low | Luna high |
| M07 | Clarity y exclusiones | M02, M05 | Sol low | Luna high |
| M08 | SEO: head, canonical y rastreo | M00 | Sol low | Luna high |
| M09 | Prerenderizado y espera compatible | M08 | Sol low + revisión | Sol medium si hay conflicto |
| M10 | Search Console y mapa editorial | M08, M09 | Sol low | Luna medium |
| M11 | Modelo monetario e importación CSV | M01 | Sol low + revisión | Luna high para parser acotado |
| M12 | Recepción de ventas Hotmart | M11 | Sol low + revisión | No delegar completa a Luna medium |
| M13 | Agregados, atribución y conciliación | M06, M11, M12 | Sol low + revisión | Luna high para casos unitarios |
| M14 | Tablero de marketing | M05–M07, M10, M13 | Sol low | Luna high |
| M15 | Validación, activación y reversión | Lotes aplicables terminados | Sol low + revisión | Luna medium para checklist |
| M16 | Ciclo de mejoras y experimentos | M15 + volumen suficiente | Sol low | Luna high |

Si faltan accesos externos, continuar los lotes locales independientes con adaptadores simulados. Marcar el paso externo pendiente, sin sustituirlo por una captura inventada ni activar producción automáticamente.

## M00 — Confirmar la base y registrar decisiones externas

**Leer:** `AGENTS.md`, `package.json`, `README.md`, `CONTENT_STATUS.md`, este plan, ambos anexos y `git status --short`.

- [x] M00.1 Registrar en `docs/marketing/ESTADO.md` rama, cambios previos, versiones y alcance autorizado.
- [ ] M00.2 Confirmar dominio canónico, entorno productivo y responsable de las cuentas. Propuesta: `https://www.nicolaszamara.com`, pendiente de confirmar titularidad/destino real.
- [ ] M00.3 Registrar identificadores públicos de GA4 y Clarity y acceso a Search Console/Looker; los secretos se guardan fuera de Git.
- [ ] M00.4 Confirmar fuente de pagos de consultas y acceso a reportes/webhooks de Hotmart. Si solo hay CSV, habilitar ese camino y dejar M12 pendiente.
- [ ] M00.5 Confirmar monedas y campañas activas. Usar CLP como presentación solo cuando los importes estén en CLP o haya conversión documentada.
- [x] M00.6 Registrar pendientes de contenido y consentimiento que impiden activar medición o indexar producción.

**Aceptar cuando:** existe inventario real, con faltantes explícitos. No pedir otra vez datos ya entregados: WhatsApp es `+56953961219`.

## M01 — Fijar contratos antes de instrumentar

**Archivos nuevos:** `src/config/analytics.js`, `config/marketing/campaigns.json`, `docs/marketing/ESTADO.md`; actualizar el anexo solo si se documenta una decisión nueva.

- [x] M01.1 Transcribir los eventos y enums del anexo a un catálogo único con validadores y versión `1`.
- [x] M01.2 Definir `site_version` explícita para el diseño; la identificación del build va separada.
- [x] M01.3 Crear registro de campañas con IDs y slugs aprobados para source/medium/campaign/content; no aceptar texto libre ni `utm_term`.
- [x] M01.4 Documentar el denominador y fuente de cada KPI; los datos no disponibles se muestran como N/D.
- [x] M01.5 Fijar el mapa de migración de los seis eventos actuales. No sumar el evento antiguo y su reemplazo.
- [x] M01.6 Probar campos desconocidos, valores fuera de enum, URLs con parámetros, datos personales y nombres de eventos inválidos.

**Aceptar cuando:** el catálogo rechaza payloads extraños y permite todos los sensores enumerados. No usar nombres de botones o selectores CSS como identificadores de negocio.

## M02 — Consentimiento y configuración por entorno

**Nuevos:** `src/contexts/AnalyticsConsentContext/`, `src/components/AnalyticsConsent/`, `src/services/consentService.js`, `src/config/analytics.js`. Cada componente visible: JSX, CSS, skeleton y pruebas propias.

- [ ] M02.1 Implementar estado desconocido/rechazado/aceptado, versión y fecha; preferencia funcional separada del consentimiento de los formularios y novedades.
- [ ] M02.2 Mostrar aceptar/rechazar/configurar con facilidad comparable; permitir reabrir desde el footer.
- [ ] M02.3 Usar por defecto medición desactivada. Sin permiso no cargar GA4/Clarity, no emitir pings, no crear identificadores analíticos, no enviar eventos al contador propio.
- [ ] M02.4 Registrar por separado consentimiento de analítica y grabación de experiencia; dejar señales de publicidad denegadas en esta entrega.
- [ ] M02.5 Al revocar, detener emisores, vaciar colas, invalidar sesión de medición y retirar cookies propias accesibles de analítica. Verificar el procedimiento vigente de cada proveedor para scripts ya cargados; si exige recarga, guardar la preferencia y ofrecer recarga sin perder formularios.
- [ ] M02.6 Integrar el control en la unidad inicial de carga de App: skeleton inmediato y contenido a los 800 ms, sin un segundo retraso anidado.
- [ ] M02.7 Agregar flags públicos `VITE_ANALYTICS_ENABLED`, `VITE_GA4_MEASUREMENT_ID`, `VITE_CLARITY_PROJECT_ID`, `VITE_SITE_VERSION`; IDs públicos no son secretos. Desactivados en localhost/preview salvo configuración QA explícita.
- [ ] M02.8 Configurar Google en modo básico y Clarity con su API vigente; verificar revocación y conservación con documentación actual. No deducir consentimiento por usar WhatsApp o enviar un interés.
- [ ] M02.9 Actualizar privacidad con los flujos realmente elegidos; no cambiar la versión de consentimiento de contacto por accidente.

**Pruebas:** almacenamiento bloqueado/corrupto, rechazo, aceptación, cambio de preferencia, StrictMode, desmontaje y temporizadores. Servicios externos simulados.

## M03 — Evolucionar el emisor y conectar GA4

**Modificar:** `src/services/analyticsService.js` y su test. **Crear:** `src/services/ga4Adapter.js` y test; cargador de scripts con responsabilidad única.

- [ ] M03.1 Establecer `trackEvent(name, params)` como único punto de entrada; solo recibe parámetros del catálogo.
- [ ] M03.2 Emitir una estructura saneada al bus local y al adaptador autorizado. Los errores de proveedor se absorben y nunca alteran navegación ni formularios.
- [ ] M03.3 Mantener una cola volátil de máximo 50 eventos durante carga del script; descartar tras 30 segundos o revocación. No persistir ni reenviar acciones anteriores al consentimiento.
- [ ] M03.4 Cargar el script una vez por documento. `send_page_view` manual; desactivar cambios de historial automáticos y los eventos automáticos que duplican formularios, scroll o enlaces.
- [ ] M03.5 Registrar únicamente las dimensiones de baja cardinalidad del anexo; no registrar UUIDs como dimensiones personalizadas.
- [ ] M03.6 Sanitizar `page_location` y `page_referrer` en cada navegación y configuración; no dejar que los eventos automáticos adjunten la URL original con información sensible.
- [ ] M03.7 Marcar como evento clave solo `generate_lead` al comienzo. `whatsapp_click` y `hotmart_click` son acciones de intención.
- [ ] M03.8 Probar fallo de script, configuración vacía, doble montaje, cola llena y un evento inválido. No llamar a una API real en Vitest.

**Aceptar cuando:** una acción válida genera un evento lógico y ninguna dependencia de medición bloquea la función principal.

## M04 — Medir rutas y conservar origen de la visita

**Modificar:** `App.jsx`, `useSiteNavigation`, `sourceContext.js`. **Nuevos:** `src/hooks/usePageAnalytics/`, `src/services/campaignAttribution.js` y sus tests.

- [ ] M04.1 Asignar ID de vista al entrar en una ruta: carga directa, navegación interna y atrás/adelante. El hash de una sección no genera otra vista de página.
- [ ] M04.2 Emitir `page_view` una vez al revelar la página. Guardar tiempo de navegación y de revelado para distinguir visitas iniciadas de contenido visto.
- [ ] M04.3 Evitar duplicación por StrictMode, cambios de consentimiento, metadatos y rerenders. Una nueva visita real a la misma ruta sí cuenta.
- [ ] M04.4 Después de aceptar, iniciar una sesión de medición con caducidad a los 30 minutos de inactividad; persistir solo mientras exista consentimiento. No usar la cookie del chatbot como identificador de marketing.
- [ ] M04.5 Capturar una sola vez la campaña aprobada de entrada. Navegar por enlaces internos no cambia el origen; visita directa no borra el último origen no directo dentro de la ventana elegida.
- [ ] M04.6 Diferenciar campaña inválida, origen desconocido y visita directa. Sin consentimiento previo no recuperar retrospectivamente la navegación.
- [ ] M04.7 Pasar parámetros de campaña al adaptador según el contrato vigente de GA4; comprobar con DebugView que se asignan como se espera antes de confiar en sus reportes de adquisición.

**Pruebas:** rutas actuales, slash final, hash, popstate, visita repetida, aceptar en una ruta distinta, expiración, reloj simulado y query maliciosa. Verificar que no se envían títulos o URLs del usuario.

## M05 — Sensores de clic y visibilidad

**Modificar:** componentes/páginas indicados en el mapa del anexo. **Nuevo:** `src/hooks/useSectionExposure/` con test.

- [ ] M05.1 Añadir props opcionales de medición a `ActionLink`; componentes de presentación reciben IDs explícitos. No analizar `innerText`, nombres de personas ni el DOM completo.
- [ ] M05.2 Instrumentar navegación, tres acciones del héroe, círculos y enlaces de AreaGrid, secciones, tarjetas de terapias, enlaces de cursos, footer y botones flotantes.
- [ ] M05.3 Mantener separados `element_id` y `placement`, aunque el destino coincida. No convertir el padre y el enlace hijo en dos emisores.
- [ ] M05.4 Usar un sensor de exposición sobre el encabezado/sentinel de cada sección: visible al 50% por 1 segundo continuo, pestaña visible, después del skeleton. No observar el 50% de una sección más alta que la pantalla.
- [ ] M05.5 Una exposición por sección/vista; desconectar observer y reloj al salir, ocultar pestaña o desmontar. Cancelar permanencia si sale del viewport.
- [ ] M05.6 Añadir exposición de cada CTA medido si se quiere calcular CTR por posición; un clic puede llegar por teclado sin exposición y debe conservarse.
- [ ] M05.7 No impedir clics externos, Ctrl/Cmd+clic ni navegación por teclado para esperar la analítica.
- [ ] M05.8 Migrar `trackHotmartClick`: conservar UUID/reintento del contador existente, aplicar consentimiento y emitir solo una copia lógica. Documentar la fecha de cambio de cobertura de la serie histórica.

**Aceptar cuando:** cada fila del mapa de sensores tiene implementación y prueba pertinente. Verificar DOM/interacciones con RTL y observer simulado, sin E2E.

## M06 — Formularios y asistente como embudo de conversión

**Modificar:** `InterestForm`, `ChatContactForm`, `useInterestSubmission`, `useContactCapture`, `Chatbot`, `useChatbot`; servicios y fixtures asociados.

- [ ] M06.1 Emitir `form_start` en la primera interacción por intento; no leer ni transmitir valores introducidos.
- [ ] M06.2 Instrumentar validación nativa mediante `onInvalid` y errores del servidor mediante códigos cerrados. Agrupar errores por intento para no generar uno por cada pulsación.
- [ ] M06.3 Emitir `form_submit_attempt` solo al aceptar un envío válido; deshabilitar duplicados mientras esté pendiente.
- [ ] M06.4 Emitir `generate_lead` una vez tras éxito confirmado y los 800 ms. Conservar un ID interno de intento durante reintentos; nunca emitir éxito por hacer clic o por abrir WhatsApp.
- [ ] M06.5 Resetear el intento al pulsar «Registrar otro interés»; conservarlo ante error/reintento. El éxito del chat deduplica por su `request_id` existente sin enviar ese ID a GA4.
- [ ] M06.6 Medir abrir chatbot, primer envío aceptado sin texto, apertura de captura y salida por acciones aprobadas. No enviar mensaje, respuesta, tema inferido clínico ni motivo de consulta.
- [ ] M06.7 Calcular abandono observado mediante un embudo cerrado de usuarios por tipo de formulario y ventana declarada en GA4; no restar conteos brutos de eventos ni llamarlo abandono por intento. No confiar en `unload` ni interpretar una pestaña cerrada como desistimiento definitivo.
- [ ] M06.8 Documentar la diferencia entre registros persistidos y confirmaciones observadas en navegador. Si se cierra antes del delay, puede existir un registro sin `generate_lead`.

**Pruebas:** éxito/error/timeout +800 ms, recarga, repetir respuesta, reset, doble clic, desmontaje, consentimiento rechazado y chat integrado/flotante.

## M07 — Comportamiento visual con Clarity

**Nuevos:** `src/services/clarityAdapter.js` y test. **Modificar:** contextos de consentimiento y regiones sensibles.

- [ ] M07.1 Cargar solo con consentimiento de experiencia y entorno habilitado. Verificar versión actual de `consentv2`; no asumir que denegar cookies equivale a detener toda captura.
- [ ] M07.2 Configurar enmascaramiento estricto y `data-clarity-mask` en formularios, mensajes, resúmenes de contacto y errores que pudieran reflejar entrada del usuario.
- [ ] M07.3 Excluir `/chatbot` de la captura; al navegar a esa ruta detener el proveedor mediante el mecanismo verificado. Si no puede garantizarse en una SPA, hacer navegación de documento a esa ruta o dejar Clarity desactivado hasta resolverlo.
- [ ] M07.4 No inicializar Clarity en URLs con query no aprobada o datos personales; no crear tags con IDs de contacto. Los tags permitidos son `site_version` y familia de página.
- [ ] M07.5 Crear segmentos por móvil/escritorio, ruta y versión del diseño; etiquetar hipótesis de rediseño en el informe, no personas.
- [ ] M07.6 Revisar manualmente una sesión QA con datos ficticios distintivos y comprobar que no son visibles ni enviados. Registrar captura redacted del resultado; nunca subir contactos reales a fixtures.

**Aceptar cuando:** mapas útiles y ninguna captura de campos/conversación. Si el proveedor no se puede excluir de forma fiable, GA4 sigue funcionando y M07 permanece pendiente.

## M08 — SEO técnico inicial y metadatos por ruta

**Modificar:** `index.html`, `siteContent.js`, `App.jsx`, `vite.config.js`, `vercel.json`. **Nuevos:** `src/config/siteRoutes.js`, `scripts/generate_seo.mjs`, helpers de metadatos con tests.

- [ ] M08.1 Centralizar catálogo de rutas para App, metadatos y sitemap. Indexables: `/`, `/consulta`, `/terapias`, `/cursos`, `/naturaleza`, `/sobre-mi`. `/chatbot` y `/privacidad`: noindex y fuera del sitemap en esta versión.
- [ ] M08.2 Generar head por ruta: title/description únicos, canonical absoluto, Open Graph, imagen social existente autorizada y Twitter Card. Escapar texto y JSON-LD.
- [ ] M08.3 Resolver robots en build/despliegue, no únicamente en un efecto React. Producción aprobada puede indexar; previews siempre noindex y sin enviarse a Search Console.
- [ ] M08.4 Separar artefactos por entorno: nunca promover a producción un build noindex sin regenerarlo y verificarlo.
- [ ] M08.5 Crear sitemap con rutas reales y fechas de contenido reales; robots.txt con URL del sitemap. No usar robots.txt como sustituto del noindex ni bloquear recursos necesarios para renderizar.
- [ ] M08.6 Mantener `/api` fuera de rewrites HTML. Generar 404 con HTTP 404 real para rutas desconocidas y noindex; redirección permanente entre host alternativo y canónico según M00.
- [ ] M08.7 Implementar JSON-LD mínimo fiel: Person/WebSite y páginas/servicios que existan. No inventar dirección, precios, certificaciones, reseñas, rating ni eventos de naturaleza confirmados.
- [ ] M08.8 Probar generador con fixtures de producción y preview: rutas, canonical, escaping, sitemap y 404. Las pruebas son de funciones puras/DOM, no de navegador automatizado.

**Aceptar cuando:** leer el HTML servido sin JS entrega metadatos y robots correctos para cada ruta. No declarar resuelto el contenido prerenderizado hasta M09.

## M09 — Contenido prerenderizado compatible con los 800 ms

**Nuevos:** `src/entry-server.jsx`, `scripts/prerender.mjs`; extraer shell de render si corresponde, en carpeta propia con CSS/skeleton/tests. **Modificar:** `src/main.jsx`, `App`, hooks que leen `window`, encabezado y configuración de build.

- [ ] M09.1 Preparar un render puro por pathname usando las páginas y el contenido existentes; el render de build no usa APIs, identidad, cookies, `document`, `window` ni scripts de marketing.
- [ ] M09.2 Generar `dist/<ruta>/index.html` para rutas públicas y `dist/404.html`; no usar un browser ni esperar 800 ms en el build. La página estática debe contener los textos/enlaces reales, además de metadatos.
- [ ] M09.3 Conservar el contrato de espera: skeleton visible al inicio y contenido reservado, no enfocable ni anunciado hasta los 800 ms. Servir la misma estructura a bots y personas; no crear una versión SEO distinta por user-agent.
- [ ] M09.4 Diseñar un shell compartido que hidrate la misma estructura inicial. La presencia de texto en el HTML y su visibilidad son contratos distintos; actualizar únicamente tests que cambian por esa decisión y verificar visibilidad/accesibilidad antes de 800 ms.
- [ ] M09.5 Resolver fallback sin JS con el mismo contenido y revelado CSS tras 800 ms. Los enlaces funcionan; formularios sin JS explican cómo contactar. Evitar contenido permanentemente oculto si falla la hidratación.
- [ ] M09.6 Inicializar ruta/estado sin acceso a navegador en el servidor. Chat y WhatsApp flotantes se montan después de hidratar y cumplir su unidad de carga.
- [ ] M09.7 Asegurar que Vercel sirve archivos generados antes del fallback, preserva API/estáticos y responde 404 a rutas desconocidas. No convertir este cambio en una migración completa de framework.
- [ ] M09.8 Revisar hidratación, foco, navegación interna y estabilidad visual manualmente. Ningún sensor cuenta skeletons ni genera eventos durante build.

**Punto de revisión obligatorio del lote:** si prerenderizado, hidratación y visibilidad no respetan simultáneamente AGENTS.md, resolver la arquitectura con Sol medium antes de ampliar el cambio. No eliminar el delay ni entregar solo el skeleton como HTML final. No garantizar indexación: comprobar el HTML renderizado en Search Console al activar.

## M10 — Demanda orgánica y contenido con intención comercial

**Entregables:** `docs/marketing/SEO_EDITORIAL.md` y configuración de Search Console.

- [ ] M10.1 Verificar propiedad del dominio con el método disponible, enviar sitemap solo tras aprobación de producción y revisar URLs prioritarias.
- [ ] M10.2 Crear una matriz por servicio: intención de búsqueda, página de destino, pregunta que responde, CTA y resultado comercial esperado.
- [ ] M10.3 Empezar con consultas reales de Search Console cuando existan; las ideas sin datos quedan como hipótesis, sin volúmenes inventados.
- [ ] M10.4 Separar búsquedas de marca y no marca; comparar impresiones/clics/CTR por página y dispositivo en periodos comparables.
- [ ] M10.5 Proponer títulos, FAQs y enlaces internos basados en esa matriz; no crear páginas casi duplicadas por ciudad ni afirmaciones terapéuticas nuevas.
- [ ] M10.6 Enlazar cada propuesta editorial con su métrica objetivo. Las consultas de Search Console son agregadas: no atribuir una palabra exacta a una compra individual.

**Aceptar cuando:** están configuradas las fuentes o consta el acceso pendiente; hay un backlog editorial trazable a datos/hipótesis, no una lista genérica de palabras.

## M11 — Libro de resultados e importación monetaria

**Nuevos:** `backend/marketing_ledger.py`, `backend/marketing_imports.py`, `scripts/import_marketing_data.py`, tests unitarios y migración generada con las herramientas vigentes. Usar el esquema privado existente; ver contratos del anexo.

- [x] M11.1 Inspeccionar esquema/permisos reales antes de cualquier migración. La planificación actual no aplicó cambios de base de datos.
- [x] M11.2 Crear tablas privadas de operaciones, movimientos, gasto y lotes de importación; índices/uniques definidos en el anexo. Ninguna lectura/escritura pública de datos monetarios.
- [x] M11.3 Implementar importador CLI con `--dry-run`, errores por fila y salida resumida. Las credenciales vienen del servidor; no archivos con secretos.
- [x] M11.4 Exigir referencia externa única, moneda ISO, importe decimal validado y estado. No usar float para dinero ni valores predeterminados que conviertan un dato ausente en cero.
- [x] M11.5 Importar pagos de consultas y ventas exportadas de Hotmart; permitir referencia pseudónima a interés existente si está disponible. No importar nombre/correo/teléfono al libro de marketing.
- [x] M11.6 Importar gasto por plataforma/campaña/fecha/moneda; distinguir gasto cero confirmado de gasto no entregado.
- [x] M11.7 Hacer idempotentes los reingresos; una corrección se registra como revisión o movimiento, no como otra venta. CSV y webhook del mismo pago comparten clave comercial.
- [x] M11.8 Mantener la atribución como desconocida si no hay evidencia. Los formularios actuales no suministran identidad de marketing: no unirlos con GA4 por email, teléfono, IP o coincidencia horaria.
- [x] M11.9 Probar importes inválidos, devoluciones parciales, distintas monedas, filas duplicadas, fórmulas de hoja de cálculo y archivos incompletos.

**Aceptar cuando:** importar dos veces un fixture produce el mismo resultado monetario, y el dry-run no muta datos. La funcionalidad de contactos sigue usando sus permisos actuales.

**Cierre M11:** codigo y fixtures verificados; esquema privado aplicado. Sin importaciones reales; escritura desactivada por defecto. Ver [evidencia M11](marketing/M11_IMPORTACION.md). Pausa solicitada por el usuario; M12 no iniciado.

## M12 — Compras de Hotmart por webhook

**Nuevos:** `api/hotmart_webhook.py`, `backend/hotmart_sales.py`, tests. **Modificar:** carga de entorno local, `.env.example`, servidor dev y configuración Vercel si hace falta.

- [ ] M12.1 Obtener documentación y payloads ficticios del producto digital y versión elegida; la página oficial consultada depende de JavaScript y no expuso el esquema completo. No copiar la API de productos físicos.
- [ ] M12.2 Verificar autenticación vigente, incluido `X-HOTMART-HOTTOK` si corresponde a esa versión; comparar secretos en tiempo constante y limitar tipo/tamaño del cuerpo.
- [ ] M12.3 Validar evento, transacción, producto, fecha, moneda e importes antes de normalizar. Extraer solo campos del libro; no guardar/loggear el JSON completo con datos de comprador.
- [ ] M12.4 Persistir recibo idempotente y movimiento en una transacción. Responder éxito solo después de escritura durable; un reintento idéntico se reconoce sin duplicar.
- [ ] M12.5 Resolver estados fuera de orden: una devolución/contracargo no puede desaparecer porque después llega una notificación vieja de aprobación. Guardar fechas del proveedor y recepción.
- [ ] M12.6 Mantener compra aprobada separada de compra completada; no sumar ambas como dos ventas. Registrar devoluciones parciales y contracargos sin duplicar reversos.
- [ ] M12.7 Verificar campos reales de seguimiento de campaña que devuelve Hotmart. Si no existen, conservar venta sin atribución; no asumir que la URL externa permite cross-domain GA4 o pasar IDs arbitrarios.
- [ ] M12.8 Probar autenticación incorrecta, replay, concurrencia simulada por contrato, payload inválido, DB no disponible, aprobación/reembolso en ambos órdenes y convergencia con importación CSV.

**Aceptar cuando:** los fixtures se reconcilian con el libro de M11. Las pruebas usan HTTP/almacenamiento simulados. La activación real del webhook es un paso manual autorizado en M15.

## M13 — Cálculos y exportación para marketing

**Nuevos:** `backend/marketing_metrics.py`, `scripts/export_marketing_report.py`, tests y vistas privadas si se necesitan; `docs/marketing/CONCILIACION.md`.

- [ ] M13.1 Implementar las fórmulas del anexo con fuente, granularidad y denominador explícitos.
- [ ] M13.2 Agregar primero cada fuente a su clave de reporte; después unir. Nunca unir filas de clics a filas de ventas y sumar importes sobre el producto cartesiano.
- [ ] M13.3 Separar calendario de caja y cohortes de adquisición. Fecha UTC almacenada, presentación de negocio en `America/Santiago`; Search Console conserva además su zona de origen.
- [ ] M13.4 Generar datasets separados de embudo, ingresos, campañas y calidad. La exportación no incluye IDs de visitantes/transacciones ni contactos.
- [ ] M13.5 Indicar retraso de datos, cobertura de consentimiento y porcentaje sin atribución. No sumar usuarios de GA4, navegadores de Hotmart y registros como si fueran personas únicas.
- [ ] M13.6 Exportar CSV UTF-8 con protección contra fórmulas inyectadas, moneda y fecha de corte; importarlo a una hoja privada con permisos mínimos.
- [ ] M13.7 Conciliar un periodo de muestra entre fuente comercial, libro y exportación; documentar diferencias sin corregir cifras a mano para que coincidan.

**Aceptar cuando:** fixtures de importación y webhook coinciden al céntimo/unidad menor con el reporte; los KPI con datos incompletos aparecen N/D.

## M14 — Construir el tablero y el informe de decisiones

**Entregables:** tablero privado en Looker Studio; `docs/marketing/TABLERO.md` con URL, dueños, fuentes, filtros, campos calculados y capturas sin datos personales.

- [ ] M14.1 Conectar GA4 y Search Console, y datasets comerciales agregados desde una hoja privada. No publicar enlaces abiertos ni credenciales de Supabase en Looker.
- [ ] M14.2 Crear pestaña Adquisición: fuente/campaña, landing, dispositivo, sesiones, intereses medidos, CPL y cobertura.
- [ ] M14.3 Crear pestaña Rediseño: exposición y clic por CTA/posición, embudos de formularios, abandono y enlaces a segmentos de Clarity.
- [ ] M14.4 Crear pestaña Ingresos: pagos confirmados, devoluciones, ingresos ajustados, gasto, ROAS y atribución desconocida; moneda y fecha de corte siempre visibles.
- [ ] M14.5 Crear pestaña SEO: consultas agregadas, páginas, marca/no marca, CTR y evolución; no mezclar sesiones con clics de búsqueda.
- [ ] M14.6 Añadir filtros de periodo, producto/servicio, campaña, dispositivo y versión donde existan; no inventar dimensiones faltantes en ventas.
- [ ] M14.7 Mostrar número de observaciones, datos faltantes y fecha de actualización en cada familia de indicadores.
- [ ] M14.8 Incluir un formato de decisión semanal: hallazgo → evidencia → hipótesis → cambio propuesto → métrica principal → fecha de revisión. No afirmar causalidad a partir de un mapa de calor.
- [ ] M14.9 Documentar actualización manual de CSV/hoja y restauración de fuentes; automatizarlo únicamente como lote posterior si aporta valor.

**Aceptar cuando:** las cifras coinciden con fixtures/reportes de origen y cada gráfica responde una pregunta comercial. Un dashboard vacío se identifica como sin datos, no como conversión cero.

## M15 — Validar y preparar activación

- [ ] M15.1 Ejecutar pruebas unitarias de los archivos cambiados en cada lote; al terminar, ejecutar suites completas y compilación.
- [ ] M15.2 Revisar manualmente en preview dedicado: consentimiento, navegación, clics, datos enviados, DebugView, enmascaramiento y rutas directas. Son comprobaciones manuales; no crear pruebas E2E/integración en este repositorio.
- [ ] M15.3 Comprobar que las pruebas/preview no contaminan producción. Usar propiedad/proyecto QA o proveedores mock según el caso.
- [ ] M15.4 Medir al menos 30 escenarios reales por nuevo consumo externo que se use para orientar esperas; registrar request_ms, reveal_ms, resultado, red/caché, inicial/recarga y estadísticas de AGENTS.md. Para etiquetas sin región revelada, registrar entrega y bloqueo, y marcar reveal_ms no aplicable. No inventar muestras ni modificar los 800 ms.
- [ ] M15.5 Revisar datos/permisos de tablas/vistas mediante las herramientas de Supabase vigentes y dejar migraciones reproducibles. La validación remota manual no se incorpora a la suite unitaria.
- [ ] M15.6 Preparar captura del tablero, preview, resultados de tests, configuración de dominios y diferencias de esquema para revisión concreta.
- [ ] M15.7 Activar únicamente los servicios/despliegues autorizados en la sesión de implementación; si falta autorización, solicitarla mostrando esos resultados.
- [ ] M15.8 Verificar manualmente postactivación robots/head, recepción de eventos consentidos y conciliación de una operación autorizada. No efectuar una compra real sin instrucción explícita.
- [ ] M15.9 Documentar reversión: apagar flags de tracking, desactivar webhook si procede, conservar libro e históricos, restaurar build anterior. No eliminar ventas ni recrear tablas como rollback.

Comandos de referencia, ajustando la lista de archivos a cada lote:

```powershell
node node_modules/vitest/vitest.mjs run --maxWorkers=1 --testTimeout=20000
.venv\Scripts\python -m unittest discover -s tests
npm.cmd run build
git diff --check
```

Son comandos de verificación futuros, no resultados obtenidos al redactar este documento.

## M16 — Mejorar conversión mediante evidencia

- [ ] M16.1 Recoger una línea base con campañas, versiones, consentimiento y periodo registrados; no fijar una cantidad de días como garantía de muestra suficiente.
- [ ] M16.2 Priorizar una hipótesis cada vez: orden de CTAs, propuesta de valor, ubicación de formulario, imagen o cantidad de campos.
- [ ] M16.3 Antes de A/B, definir unidad de asignación, métrica principal, conversión base, mejora mínima relevante, potencia, confianza y duración/muestra calculadas. Si faltan datos, mantener análisis descriptivo.
- [ ] M16.4 Si el volumen lo permite, implementar asignación estable y evento de exposición posterior al render, con feature flag y control. No cambiar variantes durante una sesión.
- [ ] M16.5 Registrar cambios de presupuesto/campaña y estacionalidad. Una comparación antes/después se etiqueta observacional, no prueba causal.
- [ ] M16.6 Actualizar el backlog editorial/de diseño y registrar la decisión con su evidencia y limitaciones.

## 5. Definición de terminado

- [ ] Todos los lotes del alcance acordado tienen evidencia y casillas verificadas; bloqueos externos aparecen como pendientes reales.
- [ ] SEO sirve HTML/metadatos correctos; producción y preview tienen políticas distintas comprobadas.
- [ ] Un evento corresponde a una acción definida; sin datos personales ni duplicados por SPA, reintento o doble proveedor.
- [ ] Los sensores cubren las rutas/controles del anexo y respetan skeletons y tiempos.
- [ ] El tablero distingue intención, interés confirmado y dinero recibido; no inventa ventas ni rentabilidad.
- [ ] Hay procedimiento reproducible de actualización, conciliación, activación y reversión.

## 6. Fuentes técnicas y límites de verificación

- Google advierte que un `noindex` inicial puede impedir renderizar la página; también documenta el renderizado del contenido JS: [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics). M08 y M09 deben verificarse sobre HTML real.
- Las vistas virtuales necesitan controlar navegación y referrer: [GA4 para SPA](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications).
- Consentimiento: [Google Consent Mode](https://developers.google.com/tag-platform/security/guides/consent), [Clarity Consent V2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2). La política de carga estricta elegida aquí es una decisión del proyecto.
- Enmascaramiento: [Clarity](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking). Debe comprobarse sobre la implementación, incluido texto reflejado fuera de inputs.
- Tablero: [Search Console, Analytics y Looker Studio](https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console).
- Webhook digital pendiente de recuperar con esquema completo: [Hotmart: eventos de solicitud](https://developers.hotmart.com/docs/es/2.0.0/webhook/purchase-webhook/).
- Acceso a datos: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). El índice de changelog Markdown no pudo leerse mediante el navegador utilizado; volver a consultarlo antes de implementar cambios de base.

No se ejecutaron servicios, migraciones, compras, mediciones de tráfico ni pruebas de producción para elaborar este plan.
