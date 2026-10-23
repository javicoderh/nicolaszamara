# Revisión y prueba manual del setter

Revisión: 2026-10-23. **Actualización: Preview desplegado y configuración remota verificada.** [Abrir Preview](https://nicolaszamara-1utsmudos-my-team-d5e0a31d.vercel.app). Tiene protección de autenticación de Vercel: se necesita acceso autorizado para abrirlo. La primera conversación real con OpenAI sigue pendiente de la prueba manual; el diagnóstico no gastó llamadas al modelo.

Se cargaron como secretos en Preview y Production `OPENAI_API_KEY`, `OPENAI_MODEL`, `CHAT_COOKIE_SECRET`, ambas tarifas y el presupuesto autorizado de **US$3 diarios** (`3000000` micro-USD). `SUPABASE_SECRET_KEY` y `SUPABASE_URL` ya existían en Vercel y se conservaron. El GET autenticado a `/api/chat` respondió HTTP 200, `status=ready`, `provider_enabled=true`, `can_send=true` y cero rondas: firma de cookie, acceso a Supabase y configuración del proveedor operativos. No se envió ningún mensaje al modelo ni se guardó un contacto. Las variables de Production se aplicarán cuando se realice un nuevo despliegue de producción; en esta tarea se desplegó únicamente Preview.

La tabla y el diagnóstico local siguientes conservan la revisión previa al aprovisionamiento de Vercel; los bloqueos remotos quedaron resueltos. El entorno local todavía necesita su propia clave secreta de Supabase si se quiere probar fuera de Vercel.

## Evidencia de esta revisión

| Paso del pipeline | Resultado |
| --- | --- |
| Montaje del chatbot, skeleton y carga inicial | Implementado |
| Navegador → `/api/chat` → identidad anónima | Código verificado; falta secreto local de firma |
| Identidad → cuotas y reserva en Supabase | Tres migraciones aplicadas; falta clave secreta del backend |
| Reserva → OpenAI → decisión validada | Adaptador con mocks aprobado; clave OpenAI local presente, tarifas/presupuesto ausentes |
| Decisión → respuesta y acciones | Contrato, cierre y espera de petición + 800 ms verificados con pruebas unitarias |
| Captura → `/api/interests` → tabla de intereses | Validación, teléfono/preferencia obligatorios, RPC y permisos verificados |
| Enlace para participantes externos | No se ha desplegado ni validado una URL en esta revisión; el checkout no tiene `.vercel/project.json` |
| Suite frontend | 108 pruebas en 31 archivos aprobadas |
| Suite backend | 42 pruebas aprobadas |
| Compilación | Aprobada |

La verificación remota confirmó las columnas `phone` y `contact_preference`, el trigger obligatorio y la prohibición de leer intereses o ejecutar las RPC internas como visitante. No se insertaron contactos ni se llamó a OpenAI en esta revisión.

## Bloqueos de configuración

En el entorno local efectivo, después de cargar `.env.local`/`.env`, únicamente está presente `OPENAI_API_KEY` entre las variables obligatorias del setter. Faltan:

- `SUPABASE_SECRET_KEY`: obtener la clave secreta de este proyecto desde Supabase; configurarla solo en el servidor. La clave publicable de los formularios no sirve para las cuotas o la captura del setter.
- `CHAT_COOKIE_SECRET`: generar un secreto aleatorio de al menos 32 caracteres y mantener el mismo valor entre instancias.
- `CHAT_INPUT_USD_PER_MILLION` y `CHAT_OUTPUT_USD_PER_MILLION`: tarifas máximas verificadas para el modelo configurado, actualmente `gpt-4.1-mini`.
- `CHAT_DAILY_BUDGET_MICRO_USD`: elegir un techo diario global; 1 USD equivale a 1.000.000 micro-USD. No se eligió un gasto automáticamente.

El GET inicial intenta firmar la cookie; sin ese secreto devuelve `503 not_configured`. Aunque se configure la firma, sin clave de Supabase no puede recuperar la sesión ni guardar capturas del setter. Sin tarifas/presupuesto no habilita los mensajes al modelo. La presencia de la clave OpenAI no acredita su vigencia, permisos o saldo: eso sigue sin comprobarse contra el proveedor.

Los archivos `.env` son locales y no viajan al despliegue. Para invitar personas, configurar esas mismas variables y la clave OpenAI en un entorno de Vercel, y desplegar el código actual completo. La base ya exige el nuevo contrato: una versión antigua de los formularios que omita teléfono/preferencia no podrá guardar registros nuevos.

## Comprobación inicial del responsable

1. Configurar las variables sin pegarlas en capturas, documentación o mensajes a participantes.
2. Para probar localmente: ejecutar `.venv\Scripts\python -m backend.dev_server` y `npm run dev` en dos terminales. Para otras personas, usar una URL HTTPS compartida del despliegue con API; `localhost` y `vite preview` por sí solos no proporcionan ese recorrido remoto completo.
3. Abrir el panel y revisar en Network que `GET /api/chat` devuelve HTTP 200, `status: ready`, `provider_enabled: true`, `state.conversation_id` y contadores iniciales. Comprobar que se conserva la cookie entre solicitudes y que no aparece su valor en la interfaz.
4. Enviar «Quiero información sobre el curso». Debe aparecer un skeleton, luego una respuesta sobre el curso y el enlace configurado de Hotmart. Esta será una llamada real al modelo y consumirá un intento y presupuesto.
5. Solicitar contacto, guardar una captura autorizada con datos ficticios y comprobar en Supabase Studio que existe una sola fila correcta. Solo entonces compartir la URL con los participantes.

## Recorridos para dos o tres participantes

Cada participante usa su propio navegador. La prueba puede realizarse con datos ficticios, por ejemplo nombre «Prueba QA A», teléfono `+56900000000` y correo `qa-a@example.invalid`. El equipo debe distinguir estos registros antes de cualquier contacto manual. No introducir síntomas ni información clínica; el objetivo es revisar el flujo de servicios.

| Recorrido | Pasos | Resultado esperado |
| --- | --- | --- |
| Consulta y teléfono | Pedir información de consulta; solicitar contacto; elegir Teléfono; completar nombre/teléfono; revisar y autorizar | Correo opcional en el setter; éxito solo tras guardar; una fila con `source=chatbot`, `interest=consultation`, `contact_preference=phone`, teléfono normalizado y `management_status=new` |
| Curso e inscripción | Pedir el enlace del curso actual; rechazar dejar datos | Hotmart disponible sin exigir captura; no prometer pago o inscripción confirmados |
| Naturaleza y videollamada | Pedir información; abrir captura; elegir Videollamada | Teléfono y correo obligatorios; texto de coordinación sin confirmar cita; preferencia `video_call` persistida |
| Mail | Elegir Mail y registrar un interés | Teléfono y correo obligatorios; preferencia `email` persistida |
| Íconos y accesibilidad | Hover sobre los tres íconos; Tab a los radios; elegir con teclado y cerrar tooltip con Escape | Nombre correcto en cada tooltip, selección única y ninguna opción elegida inicialmente |
| Formularios existentes | Abrir interés online y naturaleza; intentar sin teléfono o preferencia; después completar | No enviar incompletos; guardar ambos datos y la preferencia exacta en la misma tabla |
| Revisión y consentimiento | Corregir un campo después de revisar; cancelar; volver a capturar; dejar novedades sin marcar | La corrección requiere nueva revisión/autorización; cancelar no inserta; no se activa novedades por defecto |
| Recuperación | Cerrar/reabrir el panel, recargar y abrir otra pestaña | Conservar cuotas y última orientación aprobada; no se promete recuperar el historial libre anterior ni los datos personales de un formulario recargado |
| Cierre | Completar 10 preguntas/respuestas en una conversación | Entregar respuesta 10 y cerrar mensajes al modelo; mantener captura y enlaces; pausa de 30 minutos y cuotas diarias conservadas |
| Fallo y reintento | Con datos ficticios, interrumpir la conexión durante el guardado, recuperarla y reintentar | Sin éxito falso; conservar campos mientras la pestaña siga abierta; misma captura confirmada sin duplicados |

La bienvenida no consume ronda. Hay hasta 10 respuestas y 12 intentos por conversación; 30 respuestas, 36 intentos y tres conversaciones nuevas por navegador/día de Santiago. No borrar cookies para probar la recuperación o el cumplimiento de cuotas. El guardado real requiere autorización explícita; no inicia videollamadas ni envía automáticamente mensajes.

## Registrar resultados

Por caso: identificador del participante (sin nombre real), URL/version del despliegue, navegador/dispositivo, acción, resultado esperado/obtenido, hora, estado HTTP y número de registros resultantes. Usar capturas con datos ficticios y evitar compartir HAR, cookies, tokens o claves. Anotar si el problema pertenece a interfaz, proveedor, cuotas, guardado o configuración.

Esta guía es una prueba manual solicitada al usuario; no añade pruebas automatizadas de integración o extremo a extremo. Las mediciones de al menos 30 escenarios por consumo exigidas por AGENTS.md siguen pendientes y no se sustituyen por los mocks. Para una prueba acotada usar contactos ficticios; la retención y los datos legales de privacidad continúan pendientes para un lanzamiento con registros reales.
