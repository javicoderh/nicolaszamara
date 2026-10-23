# Implementación del setter

Fecha: 2026-10-23. El código cubre el recorrido de orientación, próximo paso, captura autorizada y persistencia. Se aplicaron las dos migraciones de Supabase. El frontend no se ha desplegado durante esta implementación. No hay llamadas reales a OpenAI ni mediciones de calidad, latencia o costo.

Actualización de contacto posterior: [CONTACTO_INTERESES.md](CONTACTO_INTERESES.md) reemplaza la selección anterior de correo/teléfono/WhatsApp. Los nuevos registros requieren teléfono y preferencia videollamada/teléfono/mail, con selector de íconos, radios y tooltips. El servidor de desarrollo ahora carga `.env.local` y `.env` para las variables admitidas; sus valores no se incorporan al frontend.

## Recorrido implementado

1. La web muestra el launcher después del ciclo de carga de la página. Abrir el panel recupera `/api/chat` con una cookie firmada `HttpOnly`, `SameSite=Lax`, `Secure` en Vercel/producción. La bienvenida es local y no consume una ronda.
2. El backend valida hasta 12 mensajes y 1.000 caracteres por mensaje. Las instrucciones y el esquema cargan desde `config/chatbot`; el contexto de estado lo construye el servidor. No hay recuperación RAG.
3. Una RPC busca el resultado idempotente y autoriza cuotas. Otra operación atómica reserva un intento y presupuesto antes de OpenAI. Un bloqueo de fila por visitante serializa pestañas e instancias; el presupuesto global usa un `UPDATE` condicional sobre una fila diaria. Ninguna transacción se mantiene abierta durante la petición al proveedor.
4. El modelo selecciona `topic`, `response_key`, `action`, `contact_signal`. El servidor comprueba vocabulario, combinación y preferencias, y devuelve texto del catálogo. Un rechazo o una salida incompleta/incorrecta producen un fallo controlado, sin segunda llamada automática.
5. Desde la respuesta 8 se ofrece un próximo paso pertinente, respetando negativas a dejar contacto y los límites clínicos. La respuesta 10 se entrega antes de cerrar el formulario de mensajes. Se mantienen enlaces y captura independiente.
6. El formulario de contacto permite elegir servicio, nombre y correo/teléfono/WhatsApp, revisar, corregir, autorizar contacto y decidir novedades por separado. Los campos no se añaden a los mensajes del modelo ni a eventos analíticos.
7. `/api/interests` valida y guarda en `public.interest_registrations` mediante una RPC atómica. Solo confirma tras persistencia; el mismo identificador y contenido recuperan el éxito sin duplicar. El estado de captura también queda en el servidor. No se confirma reserva, pago ni compra.
8. Hotmart usa exclusivamente `siteSettings.courseUrl`; está disponible sin captura y sin clave del modelo. Se omite la promoción directa mientras la última orientación sea sobre salud/urgencia. El clic emite `hotmart_click`, sin datos personales. El guardado confirmado emite `chat_contact_saved`, también sin datos personales.

## Cuotas, fallos y recuperación

| Regla | Implementación |
| --- | --- |
| Rondas | 10 respuestas completadas por conversación |
| Intentos | 12 envíos al proveedor por conversación; el fallo no suma respuesta |
| Día del visitante | 30 respuestas, 36 intentos, tres conversaciones nuevas |
| Pausa | 30 minutos desde el cierre; reinicio explícito |
| Día calendario | Postgres usa `America/Santiago`; fechas de eventos en UTC |
| Cambio de día | El intento se atribuye al día de reserva y la respuesta al día de finalización |
| Concurrencia | Una reserva activa por conversación; otros envíos reciben `pending` |
| Interrupción | Reserva pendiente vence a los 75 s y pasa a `uncertain`; conserva el cargo |
| Reintento de transporte | Mismo `request_id`, misma huella HMAC, resultado almacenado o estado; no vuelve a OpenAI |
| Fallo definitivo | Solo un reintento explícito puede crear un intento nuevo, sujeto a cuotas |
| Otra pestaña | El servidor manda; si la conversación cambió, se recupera antes de continuar |
| Recuperación | Último tema, respuesta aprobada y contadores; el historial libre anterior no se guarda |
| Falta de almacenamiento | Se rechaza el consumo de OpenAI; no hay fallback de cuotas en memoria |

La identidad representa un navegador, no una persona. Borrar cookies o usar otro dispositivo puede eludir la cuota individual; el presupuesto global permanece compartido. Cambiar el secreto de firma invalida las identidades existentes: no rotarlo como mecanismo cotidiano de reinicio.

## Carga y modularidad

`useChatbot` coordina conversación; `useDelayedOperation` coordina una región remota, con bloqueo síncrono, plazo máximo, cancelación y descarte de resultados obsoletos. El componente recibe adaptadores sustituibles. `useContactCapture` coordina el guardado idempotente y deja a `ChatContactForm` sus campos y presentación, con ciclo remoto independiente. Cada componente nuevo tiene CSS, skeleton y pruebas junto a su código.

Cada resultado remoto, incluido error, cuota o recuperación, se revela **después de petición + 800 ms**. El skeleton es inmediato. El cliente acota conversación a 40 s y captura a 15 s; después cumple los 800 ms. Python acota cada RPC a 5 s y OpenAI a 15 s. Vercel admite 45 s para la función y empaqueta explícitamente `config/chatbot`.

## Configuración de activación

Configurar en el proceso Python o en los entornos de Vercel, sin prefijos `VITE_`:

- `SUPABASE_SECRET_KEY`: clave secreta exclusiva del servidor; jamás añadirla al contenido público o al repositorio.
- `CHAT_COOKIE_SECRET`: secreto aleatorio de al menos 32 caracteres, idéntico entre instancias.
- `OPENAI_API_KEY` y, opcionalmente, `OPENAI_MODEL` (se conserva `gpt-4.1-mini`). No se sustituyó por una etiqueta de modelo de Codex.
- `CHAT_INPUT_USD_PER_MILLION`, `CHAT_OUTPUT_USD_PER_MILLION`: tarifas máximas explícitas del modelo exacto.
- `CHAT_DAILY_BUDGET_MICRO_USD`: techo diario global elegido por el responsable. Un USD equivale a 1.000.000 micro-USD.

`.env.example` contiene las variables vacías. El servidor de desarrollo carga las variables admitidas desde `.env.local` y `.env`, sin sobrescribir las del proceso; en Vercel se usan las variables del proyecto. Para Windows se creó `.venv` y se instaló `tzdata==2026.5`; `requirements.txt` declara esa dependencia para el despliegue. Ejecutar `.venv\Scripts\python -m backend.dev_server` y `npm run dev`. Ver [revisión y guía de prueba manual](PRUEBA_MANUAL_SETTER.md) para los bloqueos comprobados y el recorrido de validación.

Sin clave de OpenAI, captura, recuperación y enlaces siguen disponibles si la firma y Supabase están configurados. Sin presupuesto/tarifas válidos, no se habilitan envíos al modelo. Sin firma/almacenamiento no se inicia la captura persistente; se muestran errores y navegación útil. No se configuraron secretos ni un gasto elegido arbitrariamente durante esta implementación.

## Presupuesto y privacidad operativa

Se limita la entrada serializada a 65.536 bytes (con margen previo a la reserva) y la salida a 256 tokens. La reserva utiliza un margen de 2.048 tokens adicionales para estructura del protocolo y las tarifas explícitas del operador. La reserva es conservadora: no se libera automáticamente tras errores ni se declara costo cero por falta de `usage`. Se guardan modelo, versión de política, tokens devueltos y costo estimado cuando `usage` está disponible; el presupuesto contabiliza las reservas, sin liberar automáticamente su diferencia con el costo estimado. El límite depende de tarifas correctas para ese modelo y de conservar este contrato exclusivamente textual; no es una garantía sobre modelos futuros, RAG, impuestos ni infraestructura. Las antiguas estimaciones de CLP por conversación no son mediciones.

No se guarda texto libre, historial, prompts ni datos clínicos en tablas de cuotas/logs. Se guardan IDs anónimos, huellas HMAC, estado y respuestas aprobadas; los contactos autorizados van solo a intereses. Los datos de los formularios se mantienen en memoria de la pestaña durante el envío/reintento. No se persistieron en almacenamiento del navegador.

Antes de abrir al público falta configurar protección de tráfico del despliegue y aprobar/operar la retención de metadatos (propuesta: 48 h), distinguiéndola de la retención de prospectos. No se activó limpieza automática sin esa decisión. Las cuatro observaciones INFO de RLS sin políticas en tablas privadas corresponden al cierre deliberado a visitantes; las RPC son invoker y de uso exclusivo del backend. Ver `database/README.md`.

## Verificación y límites

Resultado de la ronda final del 2026-10-23: **99 pruebas de frontend en 29 archivos y 38 pruebas de Python aprobadas; compilación aprobada; pruebas SQL aprobadas con rollback**. Las migraciones remotas figuran como `20261023162823_setter_conversations_and_contact_capture` y `20261023163235_setter_contact_policy_and_management`. La consulta posterior confirmó cero contactos de los fixtures retenidos. `git diff --check` no detectó errores de espacios; solo avisos de conversión de fin de línea de Git en Windows.

- `npm test`: suite completa de Vitest/React Testing Library; servicios simulados y temporizadores falsos.
- `.venv\Scripts\python -m unittest discover -s tests`: validación, coordinador, cookies, adaptadores HTTP y contacto con mocks.
- `npm run build`: compilación de producción.
- `tests/setter_unit.sql`: pruebas unitarias de funciones de base de datos con fixtures en una transacción revertida, sin OpenAI, sin prospectos retenidos. Ejecutar `BEGIN;`, el archivo y `ROLLBACK;` después de aplicar el esquema.
- Revisión de privilegios y avisos de seguridad del proyecto remoto tras las migraciones.

Los casos de decisión preparados comprueban contratos esperados; los mocks no acreditan exactitud semántica real ni equivalencia de modelos. No se añadieron pruebas de integración ni de extremo a extremo. Quedan pendientes las mediciones reales exigidas por AGENTS.md: al menos 30 escenarios por consumo (OpenAI, cuotas y persistencia de contactos), con condiciones reproducibles, duración de solicitud, resultado, tiempo de revelado, media, mediana, mínimo, máximo, desviación estándar, p90 y p95. No se inventaron registros.

Documentación consultada: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [funciones de Supabase](https://supabase.com/docs/guides/database/functions), [claves de API de Supabase](https://supabase.com/docs/guides/getting-started/api-keys) y [configuración de funciones de Vercel](https://vercel.com/docs/project-configuration/vercel-json#functions).
