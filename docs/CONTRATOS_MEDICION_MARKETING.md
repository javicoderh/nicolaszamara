# Contratos de medición para marketing y conversión

Estado: especificación propuesta, sin implementación. Versión `1`. Complementa [el plan](PLAN_SEO_ANALYTICS_CONVERSION.md); cerrar estos contratos en M01 antes de conectar sensores.

## A. Preguntas que debe responder la solución

| Pregunta | Evidencia mínima | Decisión |
|---|---|---|
| ¿Qué canal trae interesados? | Sesiones y `generate_lead` medidos por source/medium/campaign | Presupuesto y landing |
| ¿Qué canal trae dinero? | Pagos confirmados, atribución demostrable y gasto de igual moneda/periodo | Retorno publicitario |
| ¿Se ven los CTA? | Exposición real del CTA y clic por posición/dispositivo | Orden, ubicación y jerarquía |
| ¿Dónde se abandona? | Embudo observado de usuarios que inician y completan; errores agregados | Campos, copy, interacción |
| ¿Ayuda el chatbot? | Aperturas, uso y contactos confirmados del chat | Visibilidad, prompts y propuesta de contacto |
| ¿Qué contenido atrae búsquedas útiles? | Search Console por consulta/página y resultados de la landing | Prioridad editorial |
| ¿Mejoró el rediseño? | Versión, exposición, resultado y muestra comparable | Mantener, revisar o experimentar |

Clic, solicitud, consulta agendada, consulta pagada y compra son conceptos diferentes. Un `wa.me` solo permite observar el clic de salida. La conversación posterior y la venta no se infieren.

## B. Contrato del emisor

### B1. Campos comunes

`trackEvent(name, params)` valida antes de despachar. El llamador no puede sobreescribir contexto interno. Cada adaptador recibe solo el subconjunto que necesita.

| Campo | Tipo y límite | Uso |
|---|---|---|
| `schema_version` | entero, inicialmente 1 | Evolución controlada |
| `event_name` | enum de B2 | No nombres libres |
| `event_id` | UUID generado por emisor | Deduplicación interna; no dimensión GA4 |
| `occurred_at` | instante UTC | Diagnóstico local; proveedor mantiene su timestamp |
| `page_view_id` | UUID por visita de ruta | Deduplicación local; no dimensión GA4 |
| `page_path` | ruta conocida, sin query/hash, máximo 120 | Agrupación por página |
| `page_type` | `home`, `consultation`, `therapies`, `courses`, `nature`, `about`, `chatbot`, `privacy`, `not_found` | Baja cardinalidad |
| `site_version` | ID editorial aprobado, máximo 40 | Comparación de diseño |
| `environment` | `production`, `qa`, `development` | Impedir mezcla |
| `consent_version` | ID cerrado de política | Control local; no convierte rechazo en aceptación |

IDs de instancia de formulario y sesión se usan para deduplicación local, no como propiedades de usuario, dimensiones personalizadas o puente hacia datos de contacto. No prometer deduplicación genérica de GA4 por enviar `event_id`: resolver duplicados antes de enviar.

### B2. Catálogo de eventos

| Evento | Disparador | Parámetros propios permitidos | Deduplicación |
|---|---|---|---|
| `page_view` | Ruta revelada después del delay, con permiso | `page_title` del catálogo, `page_location` canónico limpio, `page_referrer` saneado | Una vez por `page_view_id` |
| `section_view` | Sentinel visible al 50% por 1 s continuo | `section_id` | Una vez por sección/vista |
| `cta_view` | CTA visible al 50% por 1 s continuo | `element_id`, `placement`, `service` | Una vez por CTA/vista |
| `cta_click` | Activación de enlace genérico interno | `element_id`, `placement`, `service`, `destination_path` | Una por activación; no por bubbling |
| `navigation_click` | Menú, marca o footer | `element_id`, `placement`, `destination_path` | Una por activación |
| `whatsapp_click` | Salida a WhatsApp | `element_id`, `placement`, `service` | Una por activación; no enviar número/URL |
| `hotmart_click` | Salida al curso | `element_id`, `placement`, `service`, `source` | Una por clic; reintento de contador mantiene UUID |
| `form_start` | Primera interacción del formulario | `form_kind`, `placement` | Una por instancia lógica |
| `form_validation_error` | Intento bloqueado por validación | `form_kind`, `placement`, `error_code`, `field_id` cerrado | Una por campo/código/intento |
| `form_submit_attempt` | Primer envío válido del intento | `form_kind`, `placement` | Una por instancia lógica |
| `form_retry` | Nuevo envío después de error | `form_kind`, `placement`, `error_code` | Una por acción explícita |
| `form_submit_error` | Error revelado tras petición +800 ms | `form_kind`, `placement`, `error_code` | Una por respuesta fallida presentada |
| `generate_lead` | Guardado confirmado y éxito revelado | `form_kind`, `placement`, `service`, `lead_source` | Una por instancia o request de chat |
| `chatbot_open` | Cerrado → abierto por usuario | `placement` | Una por apertura; no rerender |
| `chatbot_engaged` | Primer envío aceptado por la UI | `placement` | Una por conversación local; sin ID remoto |
| `chat_contact_open` | Captura de contacto visible | `placement` | Una por apertura; sin motivo inferido |
| `experiment_exposure` | Variante mostrada, solo M16 | `experiment_id`, `variant_id` | Una por asignación y exposición |

**Compras/refunds no se emiten desde el navegador en esta versión.** El libro comercial recibe evidencia del servidor/importación y alimenta el tablero. Enviar posteriormente ecommerce a GA4 requiere un lote propio con consentimiento, deduplicación, moneda y unión de identidad verificados.

Enums:

- `service`: `consultation`, `therapies`, `course`, `online`, `nature`, `about`, `general`. Solo intención expresada por el control; no diagnóstico ni perfil inferido.
- `form_kind`: `consultation`, `online`, `nature`, `chat_contact`.
- `lead_source`: `form`, `chatbot`.
- `error_code`: `required`, `format`, `too_long`, `consent_required`, `rate_limited`, `timeout`, `network`, `unavailable`. No mensajes literales del proveedor.
- `field_id`: `name`, `email`, `phone`, `contact_preference`, `city`, `country`, `privacy_consent`, `form`. Solo el nombre del campo, jamás su valor. No medir contenido de experiencia libre.
- `source` de Hotmart conserva `home`, `course`, `chatbot` para no romper el backend existente.

### B3. Prohibiciones y límites de transporte

- Rechazar claves desconocidas y textos arbitrarios; máximo 25 parámetros por evento GA4, contando comunes enviados y específicos. Mantener el subconjunto mínimo, no volcar el objeto interno entero.
- No nombres, correos, teléfonos, mensajes, respuestas del bot, texto de validación, ciudad introducida, motivo de consulta, IP persistida por la aplicación ni identificadores comerciales/personales.
- No `user_id` enlazado al contacto, no fingerprinting, no reutilizar HMAC/cookie del setter. GA4/Clarity tienen sus propias identificaciones consentidas.
- URLs internas: pathname del registro de rutas. Desconocidas se agrupan en `/404`, sin guardar el texto arbitrario. Externas: proveedor/hostname aprobado, nunca query o fragmento.
- UTM: aceptar únicamente valores del registro de campañas. El regex de slug por sí solo no demuestra ausencia de información personal. `utm_term`, referrer completo y parámetros no aprobados se descartan.
- Cola volátil con máximo 50 eventos/30 segundos, solo después del consentimiento. Al revocar, descartar cola e identificadores propios; no reemitir navegación histórica.
- No interceptar para esperar el envío de medición. El flujo de negocio funciona si todos los proveedores fallan.

### B4. Compatibilidad con eventos existentes

| Actual | Destino | Acción |
|---|---|---|
| `whatsapp_click` | mismo nombre + ubicación | Modificar ambos emisores; no envolverlos en otro `cta_click` |
| `hotmart_click` | mismo nombre + ubicación | Unificar evento y respetar contador backend independiente |
| `online_interest_saved` | `generate_lead`, `form_kind=online` | Sustituir; no emitir ambos hacia GA4 |
| `nature_interest_saved` | `generate_lead`, `form_kind=nature` | Sustituir |
| `consultation_interest_saved` | `generate_lead`, `form_kind=consultation` | Sustituir |
| `chat_contact_saved` | `generate_lead`, `form_kind=chat_contact` | Sustituir en un único punto de éxito |

Guardar fecha de cambio. El contador previo de Hotmart y GA4 tendrán coberturas distintas por consentimiento/bloqueadores. No fusionar sus series sin etiqueta y explicación.

## C. Mapa de sensores en la aplicación

Los controles comparten `destination_path` cuando procede, pero no `element_id`. Poner IDs como props explícitas; el texto visible puede cambiar sin romper series. La instrumentación no modifica destinos por su cuenta.

| Ruta/archivo | Elementos y placement | Evento |
|---|---|---|
| `SiteHeader` en todas | `nav_home`, `nav_therapies`, `nav_consultation`, `nav_courses`, `nav_nature`, `nav_about`; `header` | `navigation_click` |
| `SiteHeader` marca y CTA | `brand_home`, `header_consultation`; `header` | `navigation_click` / `cta_click` |
| `/` `HomePage` héroe | `hero_consultation`, `hero_courses`, `hero_nature`; `home_hero` | `cta_view`, `cta_click` |
| `/` `AreaGrid` círculos | `area_consultation_visual`, `area_courses_visual`, `area_nature_visual`; `home_areas` | `cta_view`, `cta_click` |
| `/` `AreaGrid` textos | `area_consultation_text`, `area_courses_text`, `area_nature_text`; `home_areas` | `cta_view`, `cta_click` |
| `/` banda consulta | `home_consultation_details`; `home_consultation` | `cta_view`, `cta_click` |
| `/` curso | `home_course_hotmart`, `home_course_online`; `home_course` | `cta_view`, `hotmart_click` / `cta_click` |
| `/` naturaleza | `home_nature_interest`; `home_nature` | `cta_view`, `cta_click` con destino raíz y sección conocida |
| `/` formulario naturaleza | `nature`, `home_nature_form` | Eventos de formulario |
| `/consulta` CTA WhatsApp | `consultation_whatsapp`; `consultation_contact` | `cta_view`, `whatsapp_click` |
| `/consulta` formulario | `consultation`, `consultation_form` | Eventos de formulario |
| `/terapias` tarjetas/CTA | `therapy_<id>_consultation` si la tarjeta tiene acción; `therapies_grid` | `cta_view`, `cta_click` |
| `/cursos` Hotmart | `courses_hotmart`; `courses_offer` | `cta_view`, `hotmart_click` |
| `/cursos` interés online | `courses_online_interest`; `courses_offer` | `cta_view`, `cta_click` |
| `/cursos` formulario | `online`, `courses_online_form` | Eventos de formulario |
| `/naturaleza` CTA | `nature_interest`; `nature_intro` | `cta_view`, `cta_click` |
| `/naturaleza` formulario | `nature`, `nature_page_form` | Eventos de formulario |
| `/sobre-mi` presentación | `about_bio` | `section_view`; no inventar CTA que no existe |
| `SiteFooter` | `footer_<destino>` y ubicación de link si se repite; `footer` | `navigation_click` |
| `FloatingWhatsApp` | `floating_whatsapp`; `floating_contact` | `cta_view`, `whatsapp_click` |
| `Chatbot` flotante | `floating_chatbot`; `floating_contact` | `cta_view`, `chatbot_open` |
| `Chatbot` contenido | `chatbot_engaged`, `chat_contact_open`; `floating_chat` o `embedded_chat` | Eventos del asistente, sin texto |
| `Chatbot` enlaces | `chat_<destino>`; `floating_chat` o `embedded_chat` | `cta_click`, `hotmart_click`, `navigation_click` según acción |
| `ChatContactForm` | `chat_contact`, `floating_chat_form` o `embedded_chat_form` | Eventos de formulario |
| `AnalyticsConsent` | preferencia funcional local | No evento comercial por aceptar/rechazar |

`ActionLink` no es dueño de todos los eventos: WhatsApp/Hotmart mantienen un solo emisor especializado. En eventos de chat no usar `state.topic` como dato de marketing; tomar el servicio únicamente de la selección explícita autorizada del formulario si corresponde.

Secciones a observar después de revelar contenido:

- Inicio: `home_hero`, `home_areas`, `home_consultation`, `home_course`, `home_about`, `home_nature`, `home_nature_form`.
- Consulta: `consultation_intro`, `consultation_steps`, `consultation_details`, `consultation_faq`, `consultation_form`, `consultation_contact`.
- Terapias: encabezado y `therapies_grid`; tarjetas solo si existe una pregunta de negocio que justifique su volumen.
- Cursos: `courses_intro`, `courses_offer`, `courses_online_form`.
- Naturaleza: `nature_intro`, `nature_page_form`.
- Sobre mí: `about_bio`.

No añadir hover, cada pulsación, cada pixel de scroll ni contenido de mensajes. `section_view` permite saber que llegó a una región; no demuestra que leyó o comprendió el texto.

## D. Contrato del libro comercial privado

Este libro sirve al análisis, no a una nueva agenda/CRM. El acceso es del servidor/importador autorizado. Datos reales de contacto permanecen en su tabla actual.

### D1. Tablas propuestas

| Tabla privada | Clave | Campos y responsabilidad |
|---|---|---|
| `marketing_import_batches` | UUID de lote | `source`, `file_digest`, versión de importador, fecha UTC, filas válidas/rechazadas, estado; no archivo personal bruto |
| `marketing_transactions` | único `(provider, external_transaction_id)` | `service`, producto aprobado, fecha de compra, moneda, estado derivado, atribución y evidencia; IDs comerciales solo aquí |
| `marketing_movements` | único `(provider, external_event_id)` o clave determinista documentada | Transacción, tipo `sale/refund/chargeback/fee/tax/adjustment`, importe en unidades menores, fecha de hecho/recepción, lote |
| `marketing_ad_spend` | único `(platform, campaign_id, spend_date, currency)` | Gasto diario; reemplazo versionado para correcciones, no suma al reimportar |
| `marketing_webhook_receipts` | único `(provider, event_id)` | Hash del payload autorizado, estado de procesamiento y fechas, sin conservar datos de comprador |

Todas las tablas privadas revocan acceso a `anon`, `authenticated` y `PUBLIC`; RLS como defensa adicional y permisos mínimos al proceso autorizado. No dar acceso del cliente a movimientos. Vistas, si se crean, con semántica `security_invoker` cuando corresponda. Crear migraciones mediante herramientas actuales, inspeccionando primero el esquema real.

Relación opcional con un interés: referencia opaca interna o ID de registro ya conocido por el operador, solo en la zona privada. Ausencia de referencia no invalida una venta. No ampliar privilegios públicos de `interest_registrations` para facilitar el reporte.

### D2. Importes y estados

- Primera versión admite CLP (0 decimales), USD/EUR (2). Otras monedas se rechazan para mapeo explícito; no asumir que todas usan 2 decimales.
- Parsear con decimal exacto y guardar unidades menores enteras. El tipo de movimiento determina el signo; rechazar cantidades negativas ambiguas y sobre-reembolsos sin justificación.
- Conservar importe bruto, reversos, comisión y tributo solo cuando la fuente los proporciona. Valor desconocido es NULL, nunca cero.
- Una aprobación genera una venta; completar la garantía no genera otra. Una actualización de estado no es un ingreso adicional.
- Reembolso parcial reduce el importe una sola vez. Chargeback y refund del mismo reverso requieren reconciliación por referencia, no sumar ambos ciegamente.
- Reconciliar CSV y webhook por transacción/referencia comercial; el lote o canal de entrada no crea una venta distinta.
- No convertir divisas en el primer reporte: filtrar por moneda. Si luego se agrega FX, almacenar fuente, fecha, tasa y política de redondeo, mostrando también el original.

### D3. Formatos CSV de entrada

No crear datos de producción al completar las plantillas. Los fixtures usan referencias sintéticas.

**Pagos/movimientos:** `provider, external_transaction_id, external_event_id, event_type, occurred_at, service, product_id, currency, amount_decimal, campaign_id, attribution_method, attribution_reference`.

Campos de atribución pueden estar vacíos y entonces se normalizan a `unknown`. `provider` permitido: `hotmart`, `consultation_payments`; tipos/campos adicionales se incorporan mediante contrato versionado. Timestamp con zona explícita; fechas locales sin zona se rechazan o exigen parámetro de zona en el lote.

**Gasto:** `platform, campaign_id, spend_date, source_timezone, currency, spend_decimal`.

Rechazar columnas extra sensibles, duplicados contradictorios y referencias inválidas. El parser entrega un reporte de filas sin volcar contenidos personales. `--dry-run` valida todo y no escribe; `--apply` exige validación completa del lote. No hacer importación parcial silenciosa.

### D4. Atribución comercial

Valores permitidos: `provider_campaign`, `documented_manual`, `unknown`. Cada atribución incluye referencia verificable; cambiarla deja revisión.

- Campaña devuelta por el proveedor solo si su semántica está documentada y coincide con el registro de campañas.
- Atribución manual exige una evidencia específica y se muestra separada de la automática.
- Un pago de consulta puede estar confirmado sin origen conocido. No adivinar el canal a partir del día, dirección IP o perfil de cliente.
- La atribución de GA4 describe tráfico medido; la atribución del libro describe evidencia comercial. Pueden discrepar: mostrar ambos ámbitos.
- GSC entrega consultas agregadas y parcialmente ocultas; nunca relacionar una keyword exacta con una persona/pago.
- El plan inicial no necesita IDs de GA4 en contactos ni una unión individual entre ambas herramientas. Si luego se requiere, diseñar otro contrato de consentimiento/atribución antes de capturar identificadores.

## E. Contrato de métricas

Cada gráfico debe incluir fuente, periodo, moneda cuando aplique, muestra y cobertura. Divisor cero → N/D; fuente incompleta → N/D con motivo; ningún dato recibido → sin datos.

Como se ha elegido no medir antes del consentimiento, no existe automáticamente un denominador de todos los visitantes. No calcular una tasa global de aceptación, bloqueo o cobertura de tráfico a partir de GA4. Mostrar «tráfico medido con consentimiento; cobertura total desconocida» salvo que exista una fuente agregada independiente, autorizada y comparable. Esa fuente no se incorpora por suposición en este alcance.

| KPI | Fórmula/definición | Fuente y cautela |
|---|---|---|
| Sesiones medidas | Sesiones GA4 con permiso y etiqueta disponible | No equivale a todo el tráfico |
| Alcance de sección | Vistas distintas expuestas a sección / vistas medidas elegibles | Si el conector no permite contar vistas distintas, mostrar conteo y marcar tasa no disponible |
| CTR por CTA | Vistas expuestas con al menos un clic / vistas expuestas al CTA | Necesita deduplicación por vista; clics sin exposición van a una columna aparte, no se eliminan |
| Frecuencia de clic | Clics / exposiciones | Se puede reportar con conteos, pero puede superar 100%; no llamarla CTR único |
| Intereses observados | `generate_lead` emitidos después de éxito | Puede faltar un registro si el navegador cerró o bloqueó la medición |
| Registros persistidos | Conteo de filas nuevas válidas de intereses | Fuente operativa agregada; no deduplica personas ni se une por email |
| Conversión de usuarios a interés | Usuarios con `generate_lead` / usuarios medidos elegibles del segmento | Mismo ámbito de usuario/periodo; no mezclar sesiones como divisor |
| Conversión por sesión | Sesiones con al menos un `generate_lead` / sesiones medidas | Solo si la fuente permite ese cálculo exacto; no dividir eventos por sesiones y darle ese nombre |
| Abandono observado de formulario | 1 − usuarios que completan el embudo / usuarios que lo inician | Embudo cerrado de GA4 por `form_kind`, ventana declarada; no es número de intentos ni abandono definitivo |
| Tasa de error de envío | Envíos con error / envíos efectuados | Definir si incluye retries; en conteos presentar ambos por separado |
| Contacto del chat | Usuarios con lead de chat / usuarios que abrieron chat | Asociación observada; no prueba incremento causado por el chatbot |
| Costo por interés medido | Gasto de campaña / intereses observados asignados a esa campaña | Etiquetar cobertura y modelo; no llamarlo costo por cliente |
| Pagos confirmados | Transacciones únicas con venta válida | Del libro, no clics ni solicitudes |
| Ventas brutas | Suma de movimientos de venta | Una moneda y mismo ámbito de periodo |
| Ingreso ajustado por reversos | Ventas − reembolsos − contracargos no duplicados | No es ganancia; comisiones/tributos/costos se informan aparte |
| Importe después de comisiones | Ingreso ajustado − comisiones conocidas − tributos aplicables conocidos | Solo cuando cobertura de componentes es completa y su semántica evita doble resta |
| ROAS bruto | Ventas atribuidas / gasto publicitario | Misma campaña, periodo y moneda; etiqueta `bruto` |
| ROAS ajustado | Ingreso atribuido después de reversos / gasto | No equivale a rentabilidad/ROI |
| Costo por pago | Gasto / transacciones pagadas atribuidas | No es CAC si no existe identidad de cliente nuevo verificable |
| Ticket medio | Ventas brutas / transacciones pagadas | No mezclar con ticket neto después de reversos |
| Cobertura de atribución | Ingreso atribuible / ingreso confirmado total del periodo | Mostrar también monto y número de operaciones desconocidas |
| CTR orgánico | Clics de búsqueda / impresiones de búsqueda | Search Console; no sumar con vistas/sesiones |

No calcular margen, ROI, CAC o LTV sin datos que sostengan costos, identidad de cliente nuevo, recurrencia y ventana de observación. Presentar N/D con el dato faltante; no estimarlo usando una constante inventada.

### E1. Granularidad y uniones

- Dimensiones comunes comparables: fecha de reporte normalizada, campaña del registro, landing cuando se conoce, servicio y moneda para dinero.
- GA4 configura su zona en Santiago. Al exportar GSC conservar zona de origen y explicar desfases; no desplazar a mano agregados diarios sin timestamps suficientes.
- Agregar cada fuente antes del join. Prueba obligatoria: una venta, tres clics y dos sesiones deben seguir representando una venta.
- Mantener dos reportes: movimientos por fecha del hecho (caja/actividad) y cohortes por fecha de adquisición si la evidencia existe. Un reembolso de noviembre puede corresponder a venta de octubre; ambos reportes explican esa diferencia.
- Looker no debe unir eventos crudos con importes. Usar un dataset comercial ya agregado; mostrar métricas GA4 en su propia fuente si no hay claves comparables.
- No se garantiza un CTR único por vista con conectores estándar. En la primera versión usar las métricas exactas disponibles (conteos/frecuencia y embudos de usuarios); cualquier exportación de eventos para mayor granularidad requiere un lote adicional, costos revisados y esquema aprobado. No introducir BigQuery silenciosamente.

## F. Tablero mínimo y acciones que habilita

| Vista | Gráficos/tabla mínimos | Acción posible |
|---|---|---|
| Adquisición | Source/medium/campaign, landing, sesiones/usuarios, intereses observados, gasto, costo por interés | Reasignar campañas con muestras comparables |
| Diseño | Exposición, clics/frecuencia por CTA y posición, móvil/escritorio, embudo, error por código | Reubicar CTA, simplificar formulario, ajustar copy |
| Ingresos | Ventas, reversos, ingreso ajustado, gasto, ROAS, porcentaje desconocido | Elegir canales con retorno documentado |
| SEO | Consultas/páginas, marca/no marca, impresiones, clics, CTR | Priorizar contenidos y títulos |
| Calidad visible | Última actualización, versión, fuentes pendientes y tamaño de muestra | Evitar decidir con datos incompletos |

Comparación de diseño: filtrar `site_version`. Antes/después admite cambios de campañas/estación como confusores. Un A/B necesita asignación estable, exposición verificada y tamaño de muestra calculado; no declarar ganador por observar dos porcentajes diferentes.

## G. Pruebas mínimas que deben existir

- [ ] Catálogo: rechaza extras, datos personales, rutas/query y enums inválidos.
- [ ] Consentimiento: no hay loader ni transporte antes de aceptar; revocación vacía cola.
- [ ] SPA: una vista por visita; hash y StrictMode no duplican; regreso real sí cuenta.
- [ ] Exposición: visible 999 ms no cuenta; 1000 ms sí; salir/ocultar pestaña cancela; skeleton nunca cuenta.
- [ ] Clic: AreaGrid imagen y texto comparten destino, conservan IDs distintos y no duplican por padre/hijo.
- [ ] Formularios: error y éxito cumplen request +800 ms; no se transmite ningún valor.
- [ ] Lead: una confirmación por intento; retry no duplica éxito; cerrar página puede dejar registro no observado y se documenta.
- [ ] Clarity: adaptador respeta consentimiento/ruta y contrato de enmascaramiento; revisión manual de datos ficticios fuera de la suite.
- [ ] Dinero: importación doble, webhook duplicado y CSV+webhook no duplican operación.
- [ ] Dinero: reembolso parcial, evento viejo, moneda distinta y campos faltantes producen resultado esperado/N/D.
- [ ] Reporte: joins no multiplican importes; divisor cero no produce Infinity; importes sin FX no se suman entre monedas.
- [ ] SEO: helpers generan robots/canonical/head/sitemap de producción y preview correctamente; no se ocultan regresiones sustituyendo assertions sin revisar comportamiento.

La lógica JS usa Vitest; componentes y hooks DOM, React Testing Library. Python usa unittest con proveedores simulados. No incorporar pruebas E2E ni tests que dependan de servicios reales. Las comprobaciones manuales se documentan separadamente.
