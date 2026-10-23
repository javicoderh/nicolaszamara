# Plan de mejora del chatbot setter: 10 rondas y captación de prospectos

Fecha: 2026-10-22.

Estado actualizado al 2026-10-23: flujo principal implementado y migraciones de cuotas/captación aplicadas. Ver [implementación y verificaciones](IMPLEMENTACION_SETTER.md). Este documento conserva el diagnóstico original y el alcance; sus listas históricas no son el registro de avance actual. Siguen pendientes la configuración de activación, las mediciones reales, las evaluaciones de modelos, el control de tráfico del despliegue y la aprobación/operación de retención.

## 1. Revisión del estado actual

- [x] Revisar `src/components/Chatbot/Chatbot.jsx`, sus pruebas y su skeleton.
- [x] Revisar `src/services/chatbotService.js`, `api/chat.py`, `backend/chatbot.py` y las pruebas del adaptador.
- [x] Revisar el montaje en `src/app/App.jsx`, la constante compartida de 800 ms y el despliegue Python en Vercel.
- [x] Ejecutar las pruebas unitarias existentes del chatbot: 7 pruebas de frontend y 7 de backend aprobadas, con proveedores simulados y sin llamadas reales a OpenAI.

Hallazgos que orientan el plan:

| Lugar | Comportamiento actual | Mejora necesaria |
| --- | --- | --- |
| `Chatbot.jsx` | Envía los últimos 12 mensajes y permite seguir conversando indefinidamente. | Contar rondas acumuladas en el servidor; el historial reducido no constituye un límite de uso. |
| `backend/chatbot.py` | Valida cada petición por separado, sin visitante, conversación o contador persistente. | Autorizar cada consumo antes de llamar a OpenAI, con estado compartido entre instancias. |
| `chatbotService.js` | Valida `topic` y después devuelve únicamente `reply`. | Conservar tema, acciones y estado de cuotas para orientar el cierre. |
| `Chatbot.jsx` | Mezcla presentación, petición, temporizadores y estado; usa `sending` como barrera de envío. | Extraer coordinación a un hook y bloquear envíos simultáneos también mediante una referencia síncrona. |
| `Chatbot.jsx` | Los errores se muestran inmediatamente; no hay plazo total en el cliente. | Respetar petición más 800 ms tanto en éxito como en error y finalizar esperas con un plazo acotado. |
| Limpieza del componente | Aborta la petición y limpia el timer existente, pero no invalida la tarea activa. | Evitar que una respuesta tardía programe otro timer o actualice estado después del desmontaje. |
| Estado del chat | Se pierde al recargar o navegar con enlaces que cargan otro documento. | Recuperar la conversación y sus cuotas desde el servidor, sin reiniciarlas. |
| Respuestas | Existen ocho plantillas y el modelo selecciona una clave permitida. | Mantener este contrato y añadir orientación al cierre según la ronda y el tema. |
| Costos | No se registra `usage` de OpenAI ni hay presupuesto global aplicado por la aplicación. | Registrar consumo y reservar presupuesto antes de cada intento facturable. |
| Pipeline de intereses | El código y el esquema remoto solo admiten `online` y `nature`; el correo es obligatorio. | Admitir prospectos del setter, servicio y preferencia de contacto en la misma tabla, conservando los formularios existentes. |
| Consulta | Actualmente muestra un enlace a WhatsApp, no un formulario que inserte en intereses. | Incorporar consulta al catálogo del pipeline y documentar qué puntos de entrada están realmente conectados. |
| Datos personales | Las instrucciones actuales impiden que el modelo recoja datos personales. | Mantener esa restricción para OpenAI y añadir una captura guiada independiente que guarde los datos autorizados en intereses. |
| Cursos | Existe un enlace de Hotmart centralizado en `siteSettings.courseUrl`. | Poder entregarlo como acción directa del setter cuando la persona quiera inscribirse. |

## 2. Política de conversación

- [ ] Centralizar una política versionada y devolver sus valores al frontend desde el servidor.
- [ ] Definir **una ronda como un mensaje del visitante y una respuesta entregada por el asistente**.
- [ ] Permitir como máximo **10 rondas completadas por conversación**.
- [ ] Mantener la bienvenida inicial como respuesta local, sin llamar a OpenAI ni consumir una ronda.
- [ ] Contar las sugerencias que se envían al modelo como cualquier otro mensaje del visitante.
- [ ] Mantener los enlaces de servicios y las preguntas frecuentes locales disponibles después del cierre, sin llamadas al modelo.
- [ ] Separar el número de mensajes enviados como contexto del contador acumulado de rondas. Conservar inicialmente los límites actuales de 12 mensajes de contexto y 1.000 caracteres por mensaje.

Experiencia prevista:

| Momento | Comportamiento |
| --- | --- |
| Rondas 1–7 | Orientación sobre los servicios y aclaraciones pertinentes. |
| Respuestas 8 y 9 | Responder la pregunta y ofrecer el próximo paso según el tema: inscripción en Hotmart, captura autorizada de contacto o información del servicio. |
| Respuesta 10 | Entregar la respuesta final y facilitar la acción elegida por el visitante. |
| Después de la 10 | Mantener el historial y las acciones útiles; cerrar los mensajes al modelo y conservar la captura de contacto y el enlace de inscripción. |
| Intento 11, incluso directo a la API | Devolver el estado de conversación cerrada sin consultar OpenAI. |

- [ ] Redactar el cierre sin mencionar tokens, facturación ni ahorro de recursos al visitante. Ejemplo: «Puedes continuar desde aquí con la información de consulta, cursos o naturaleza».
- [ ] Priorizar el tema de la consulta; evitar promocionar una oferta en una respuesta sobre urgencias o límites de orientación clínica.
- [ ] Permitir continuar usando el sitio aunque el chat haya alcanzado su límite.

## 3. Errores, reintentos y consumo real

Una respuesta fallida no debe presentarse como una ronda completada. Sin embargo, una llamada enviada al proveedor puede generar costo aunque el visitante no reciba respuesta.

- [ ] Mantener dos contadores: `completed_rounds` y `provider_attempts`.
- [ ] Permitir hasta 10 rondas completadas y un máximo adicional de **12 intentos de proveedor por conversación**, para tolerar hasta dos fallos sin permitir reintentos indefinidos.
- [ ] No gastar ronda ni intento de proveedor ante validación inválida, clave ausente o rechazo de cuota anterior al envío.
- [ ] Contabilizar como intento cualquier envío al proveedor cuyo costo pueda haberse generado, incluidos los resultados inciertos tras un timeout.
- [ ] No reintentar automáticamente una llamada a OpenAI con resultado incierto. Cancelar la petición del navegador no demuestra que el proveedor haya dejado de procesarla.
- [ ] Mantener el mismo identificador de petición en reintentos de transporte del mismo mensaje; recuperar su resultado o su estado pendiente sin duplicar el consumo.
- [ ] Informar de un fallo recuperable y conservar el texto para reintentar explícitamente, respetando las cuotas.

## 4. Identidad anónima y cuotas persistentes

Propuesta: reutilizar Supabase como almacenamiento compartido del control de uso. El navegador solo conversa con el backend Python. La clave publicable actual de los formularios no sirve para administrar estos contadores.

- [ ] Crear una identidad anónima mediante cookie emitida y validada por el servidor, con `HttpOnly`, `Secure` en producción y `SameSite=Lax`.
- [ ] Recuperar la misma conversación al cerrar y abrir el panel, recargar, navegar por el sitio o usar otra pestaña del mismo navegador.
- [ ] No permitir crear conversaciones paralelas para el mismo visitante mientras exista una conversación activa.
- [ ] Proponer una pausa de 30 minutos después del cierre antes de iniciar otra conversación; mostrar cuándo puede retomarse la orientación.
- [ ] Aplicar un máximo de **30 rondas completadas por visitante al día** y de tres conversaciones nuevas por día.
- [ ] Añadir un techo de **36 intentos de proveedor por visitante al día**, coherente con las tres conversaciones y sus márgenes de error.
- [ ] Usar el día calendario de `America/Santiago` para las cuotas diarias; guardar las fechas de eventos en UTC y comprobar los cambios de horario.
- [ ] Definir la vigencia de la cookie para que su expiración normal no reinicie la cuota dentro del mismo día; restaurar el contador aunque cambie la conversación.
- [ ] Mantener los contadores fuera de variables de proceso, React y almacenamiento editable del navegador.
- [ ] Documentar que una identidad anónima identifica un navegador, no una persona: borrar cookies o cambiar de dispositivo puede eludir esa cuota. Complementarla con protección de tráfico y presupuesto global.

## 5. Operaciones atómicas y privacidad del almacenamiento

- [ ] Definir un contrato `ChatUsageStore` para iniciar o recuperar conversación, reservar intento, finalizar respuesta y consultar estado.
- [ ] Crear un adaptador de producción para Supabase y un sustituto en memoria exclusivamente para pruebas unitarias y desarrollo controlado.
- [ ] Diseñar tablas privadas para visitantes/cuotas, conversaciones, peticiones y presupuesto; almacenar solo los identificadores y metadatos necesarios.
- [ ] Reservar en una operación atómica la disponibilidad de la conversación, la cuota diaria y el presupuesto global antes de enviar al proveedor.
- [ ] Permitir solo una petición en curso por conversación. No mantener una transacción de base de datos abierta durante la llamada HTTP a OpenAI.
- [ ] Usar un identificador único de petición ligado al visitante y a la conversación. Rechazar su reutilización con otro mensaje mediante una huella HMAC, sin guardar el texto.
- [ ] Definir estados `reserved`, `completed`, `failed` y `uncertain`, con vencimiento de reservas. Un proceso interrumpido no debe dejar al visitante bloqueado indefinidamente ni habilitar un reenvío facturable automático.
- [ ] Asegurar que dos peticiones concurrentes cuando hay nueve rondas completadas no produzcan dos respuestas adicionales.
- [ ] Persistir la clave y versión de la respuesta aprobada para poder repetir exactamente el resultado de una petición ya completada sin volver a OpenAI.
- [ ] Mantener el texto libre del visitante y el historial fuera de la base de cuotas y de los logs. La captura estructurada de contacto autorizada se guarda únicamente en `interest_registrations`, según la sección 11. Recuperar al menos el último tema, la respuesta aprobada y los contadores; explicar de forma breve si el historial visual de esa pestaña ya no está disponible.
- [ ] Proponer eliminación de metadatos identificables de conversación tras 48 horas y conservar solo agregados anónimos para estadísticas; documentar y aprobar esta retención antes de activarla.
- [ ] Configurar credenciales y permisos exclusivos del backend para estas operaciones; revocar el acceso de `PUBLIC`, `anon` y `authenticated` a los objetos internos. Aplicar RLS donde corresponda y preferir funciones `SECURITY INVOKER`.
- [ ] Generar y revisar la migración durante la implementación; revisar privilegios y avisos de seguridad antes de aplicarla. Este plan no crea tablas, funciones ni credenciales.
- [ ] Si el almacenamiento de cuotas falla, devolver una alternativa local y evitar nuevas llamadas a OpenAI mientras no pueda autorizarse el consumo.

## 6. Contrato de API y separación del backend

- [ ] Separar política y plantillas, decisión de OpenAI, control de conversación y acceso a cuotas en módulos con una responsabilidad concreta.
- [ ] Añadir operaciones para iniciar, recuperar y consultar el estado de la conversación sin llamar a OpenAI. Inicializar el servicio remoto cuando el usuario abra el panel, no por mostrar el botón flotante.
- [ ] Cambiar el envío para incluir `conversation_id` y `request_id`; validar su pertenencia al visitante identificado por el servidor.
- [ ] Mantener el historial reciente como contexto no confiable. No aceptar del cliente contadores, cupos restantes, identidad efectiva, tema previo autorizado ni presupuesto.
- [ ] Devolver un objeto con `reply`, `topic`, acciones permitidas y estado de conversación: rondas completadas/restantes, fase, motivo de cierre y fecha de disponibilidad cuando aplique.
- [ ] Distinguir cierre de conversación, cuota diaria, petición en curso, límite temporal, presupuesto agotado, falta de configuración y proveedor no disponible.
- [ ] Mantener los destinos de las acciones en una lista permitida del servidor.
- [ ] Usar los mismos contratos en el servidor local y en Vercel.
- [ ] Establecer un plazo total de procesamiento compatible con los 30 segundos configurados en Vercel, incluyendo las operaciones de cuotas y el proveedor.

## 7. Frontend y estados de carga

- [ ] Crear un hook `useChatConversation` para coordinar recuperación, envío, cancelación, reintentos y tiempos.
- [ ] Hacer que `Chatbot` reciba o consuma ese estado mediante un contrato explícito, manteniendo la presentación separada de los adaptadores HTTP.
- [ ] Preservar `topic` y los metadatos en `chatbotService.js` para mostrar el próximo paso correspondiente.
- [ ] Añadir estados explícitos para recuperación, disponible, enviando, pausa temporal, conversación cerrada y error recuperable.
- [ ] Bloquear un segundo envío de forma síncrona y coordinar las pestañas con el estado autorizado por el servidor.
- [ ] Mantener un skeleton propio durante la recuperación y un indicador inmediato durante el envío.
- [ ] Aplicar petición completada **más 800 ms** antes de revelar cada resultado remoto, incluidos errores y estados de cuota. No sumar delays por cada nivel del árbol.
- [ ] Cancelar la petición, invalidar la tarea activa y limpiar los temporizadores al desmontar o sustituir una carga; descartar respuestas obsoletas.
- [ ] Acotar la espera del navegador y conservar la interfaz navegable ante fallos.
- [ ] Al completar la ronda 10, retirar el formulario de mensajes al modelo y mostrar las acciones finales, incluida la captura de contacto independiente. El cierre y el resto de la web deben seguir siendo utilizables con teclado y lectores de pantalla.
- [ ] Conservar los archivos CSS, skeletons y pruebas junto a cada componente nuevo, según `AGENTS.md`.

## 8. Presupuesto y preparación para RAG

- [ ] Mantener al modelo como selector de claves permitidas; ninguna regla de cuota o cierre dependerá de su decisión.
- [ ] Añadir las variantes de orientación y cierre como textos aprobados por servicio, sin aumentar los tokens de salida para redactarlas.
- [ ] Extraer el catálogo de temas y respuestas para que el futuro RAG pueda aportar candidatos al selector, conservando las mismas restricciones de conversación.
- [ ] Definir un presupuesto de tokens de entrada que incluya instrucciones, esquema, contexto y futuros fragmentos recuperados; 1.000 caracteres por mensaje no garantizan por sí solos un costo máximo en tokens.
- [ ] Reservar un costo máximo por intento contra un presupuesto global configurable, antes de llamar al proveedor. Registrar y conciliar el consumo real cuando esté disponible.
- [ ] Si el resultado es incierto o falta `usage`, conservar una reserva conservadora hasta su conciliación; no declarar costo cero.
- [ ] Registrar modelo, versión de política, tokens de entrada/salida, costo estimado y motivo de cierre, sin textos de usuarios ni secretos.
- [ ] Documentar que las estimaciones anteriores de $5–$12 CLP por 10 rondas no son mediciones ni un techo garantizado, y excluyen infraestructura, impuestos, reintentos y el futuro RAG.
- [ ] Usar controles de tráfico para reducir la creación masiva de identidades y complementar las cuotas anónimas. El presupuesto global debe proteger el gasto incluso si cambian las cookies.

## 9. Pruebas y criterios de aceptación

Solo pruebas unitarias, con servicios, reloj y almacenamiento simulados. No añadir pruebas de integración ni de extremo a extremo.

- [ ] Comprobar bienvenida sin consumo y conteo correcto desde la primera ronda.
- [ ] Comprobar que las rondas 8 y 9 muestran el próximo paso y que la 10 entrega su respuesta antes de cerrar.
- [ ] Comprobar que el intento 11 nunca invoca al proveedor, incluso mediante una petición directa o un historial manipulado.
- [ ] Comprobar recuperación tras recarga, cierre del panel y otra pestaña, sin reiniciar el contador.
- [ ] Comprobar las cuotas de tres conversaciones, 30 rondas diarias y 36 intentos, la pausa entre conversaciones y el cambio de día en Santiago.
- [ ] Comprobar que repetir un `request_id` no repite la llamada ni el incremento; rechazar el mismo ID con otro contenido o propietario.
- [ ] Simular peticiones concurrentes, reservas vencidas e interrupciones para verificar el contrato de exclusión y cierre.
- [ ] Comprobar que errores previos al envío no consumen intentos y que los envíos inciertos sí quedan registrados.
- [ ] Comprobar el margen de 12 intentos de proveedor por conversación y la finalización útil cuando se agota.
- [ ] Comprobar presupuesto global agotado y almacenamiento de cuotas no disponible: cero llamadas adicionales al proveedor.
- [ ] Comprobar 799/800 ms después de éxito, error y recuperación; limpiar timers al desmontar y descartar respuestas tardías.
- [ ] Comprobar que la falta de clave conserva los enlaces útiles y no consume cuota de proveedor.
- [ ] Comprobar plantillas y destinos permitidos, límites clínicos y cierre accesible mediante teclado.
- [ ] Ejecutar las pruebas unitarias afectadas y la compilación al implementar. Registrar resultados y limitaciones sin afirmar que los mocks demuestran por sí solos la configuración real del servicio remoto.

## 10. Medición posterior y entrega

- [ ] Actualizar README, configuración de ejemplo y privacidad con identidad anónima, contadores y retención. No activar cambios remotos como parte de esta planificación.
- [ ] Después de disponer de clave y entorno de medición, registrar al menos 30 escenarios reales por consumo externo: OpenAI y almacenamiento de cuotas por separado.
- [ ] Documentar condiciones de red, caché, carga inicial, recuperación, fallos y recargas; separar tiempo real de petición y tiempo total de revelado.
- [ ] Conservar registros sin datos personales, método reproducible, tamaño de muestra, media, mediana, mínimo, máximo, desviación estándar, p90 y p95.
- [ ] Revisar costo real por conversación, porcentaje de cierres en la ronda 10, errores y avance hacia los servicios antes de cambiar las cuotas. No usar estimaciones como mediciones ni modificar los 800 ms obligatorios.
- [ ] Entregar los cambios de código y esquema para revisión con las pruebas correspondientes, antes de habilitar OpenAI públicamente.

## 11. Captura de prospectos para el closer en el pipeline de intereses

Alcance añadido por decisión del usuario: el setter debe facilitar que el equipo comercial contacte al interesado por teléfono, WhatsApp o correo, usando **la misma tabla `public.interest_registrations`** que recibe los formularios. El prospecto también puede continuar directamente a Hotmart cuando su objetivo sea inscribirse al curso.

- [x] Revisar el adaptador y la validación de `backend/interests.py`, los formularios actuales y el esquema local.
- [x] Consultar únicamente metadatos del proyecto Supabase `vsbolndzzkrhadprdlto`: columnas, restricciones, política de inserción y permisos. No leer registros personales ni modificar la base.
- [x] Confirmar que el esquema remoto requiere `email`, restringe `interest` a `online`/`nature` y fija la versión de privacidad `2026-10-21`. No existen todavía columnas de teléfono, preferencia de contacto ni estado comercial.

### 11.1. Flujo de conversación y entrega del prospecto

- [ ] Ofrecer «Solicitar que me contacten» cuando el visitante lo pida o manifieste interés por avanzar; permitirlo antes de la ronda 8.
- [ ] Preguntar «¿Prefieres que te contacten por teléfono, WhatsApp o correo?» y mostrar esas tres opciones explícitas.
- [ ] Pedir nombre y únicamente el dato de contacto necesario para el canal elegido; no exigir correo a quien prefiera teléfono o WhatsApp.
- [ ] Confirmar el servicio de interés mediante una selección explícita. El tema reconocido por el modelo puede sugerir una opción, pero el usuario puede corregirla.
- [ ] Mostrar un resumen editable del servicio, nombre, canal y destino antes de guardar, junto a la autorización de contacto y la información de privacidad.
- [ ] Pedir autorización explícita para que el equipo contacte por el servicio indicado. Mantener separada y desmarcada la autorización opcional para novedades.
- [ ] Permitir rechazar o cancelar la captura y seguir usando la web; nunca guardar un contacto incompleto ni una autorización inferida del silencio.
- [ ] Confirmar el registro solo después de la persistencia real: «Registramos tu solicitud para que el equipo te contacte por [canal]».
- [ ] Evitar prometer un plazo de respuesta, una reserva o una inscripción que el sistema no puede confirmar.
- [ ] Conservar los datos en el formulario ante un fallo y permitir reintentar sin perderlos ni insertar duplicados.

### 11.2. Datos mínimos y reglas de validación

Los nombres de columnas nuevos son una propuesta para la implementación. El objetivo es conservar los datos existentes y ampliar su contrato, sin crear otra tabla de prospectos.

| Dato | Regla propuesta |
| --- | --- |
| `full_name` | Obligatorio; conservar el máximo actual de 120 caracteres. |
| `interest` | Ampliar el catálogo con `consultation` y `course`; conservar `online` para futura modalidad online y `nature` para naturaleza. |
| `therapy_interest` | Opcional y limitado al catálogo publicado; corresponde a una consulta terapéutica, sin guardar síntomas o detalles clínicos. |
| `contact_preference` | Una opción entre `phone`, `whatsapp` y `email`. |
| `phone` | Obligatorio para teléfono o WhatsApp; solicitar prefijo internacional y validar formato normalizado, sin asumir país ni existencia de cuenta de WhatsApp. |
| `email` | Obligatorio y normalizado para correo; puede ser nulo en una captura por teléfono o WhatsApp. Los formularios actuales siguen requiriéndolo. |
| `source` | Identificar el flujo de entrada: chatbot o formulario. Es metadato de procedencia, no prueba de identidad del visitante. |
| `contact_consent` | Obligatorio para prospectos de contacto; conservar texto/versionado y fecha de la autorización. No atribuir esta nueva autorización a registros antiguos. |
| `privacy_consent` y `privacy_version` | Mantener la autorización existente y admitir la nueva versión publicada de forma compatible con registros y formularios anteriores. |
| `updates_consent` | Opcional, independiente y falso por defecto. |
| `handoff_status` | Los nuevos prospectos de contacto entran pendientes de gestión. Lo asigna el sistema y solo lo cambia el personal autorizado. |
| Identificador de envío | Único por captura confirmada para reintentos idempotentes; no reutilizarlo para otro servicio o datos distintos. |

- [ ] Evitar pedir ciudad, país, experiencia u horario preferido si no son necesarios para ese contacto. Conservar los requisitos actuales de los formularios existentes durante la migración.
- [ ] No almacenar el historial del chat ni un resumen clínico como contexto comercial. Entregar al closer el interés estructurado y el canal autorizado.
- [ ] Si posteriormente se añade horario de contacto, incluir su zona horaria y mantenerlo opcional.

### 11.3. Integración con el pipeline y migración compatible

- [ ] Reutilizar validación, persistencia y tratamiento de éxito/error de intereses; añadir un contrato explícito de captura del chatbot y evitar un segundo pipeline independiente.
- [ ] Validar el contrato completo en el servidor y reflejar las reglas necesarias en restricciones de la base: canal y dato requerido, tipos de interés y consentimiento.
- [ ] Distinguir las variantes del formulario y del chatbot sin debilitar las validaciones que ya protegen a los formularios actuales.
- [ ] Preparar una migración incremental sobre `interest_registrations` para las columnas nuevas, correo condicional y nuevos intereses; no volver a ejecutar el script original de creación.
- [ ] Ajustar `interest_fields_match`, la restricción de intereses, la versión de privacidad, RLS y los permisos por columna como un cambio coherente.
- [ ] Mantener la inserción pública limitada a columnas de captura. No conceder lectura, actualización, asignación de closer, estado comercial ni fechas internas a visitantes.
- [ ] Revisar los límites de frecuencia actuales: el trigger cuenta por correo y debe cubrir también contactos telefónicos cuando `email` sea nulo, conservando el límite global.
- [ ] Añadir idempotencia persistente a la inserción: doble clic, recarga o timeout posterior a guardar no deben producir dos prospectos para la misma captura.
- [ ] Mantener intereses legítimos distintos del mismo contacto como solicitudes distintas; no fusionarlos automáticamente por coincidencia de correo o teléfono.
- [ ] Definir valores históricos compatibles para las columnas nuevas, sin inventar consentimientos, preferencias ni estados de gestión de registros anteriores.
- [ ] Desplegar primero la ampliación compatible del esquema y después el backend y la interfaz; comprobar que los formularios antiguos siguen insertando durante la transición.
- [ ] Actualizar privacidad, README y documentación de base de datos para reflejar que se guardan solicitudes autorizadas de contacto procedentes del chatbot.

### 11.4. Captura guiada y límite de 10 rondas

- [ ] Implementar la captura como estados y controles propios dentro del chat, usando textos predeterminados y un formulario accesible. OpenAI puede proponer la acción de contacto, pero no decide si una autorización es válida ni ejecuta inserciones por su cuenta.
- [ ] Mantener nombre, teléfono y correo fuera de los mensajes enviados al modelo durante esta captura; el envío de datos debe ir al pipeline de intereses.
- [ ] Actualizar las instrucciones del selector para distinguir orientación con OpenAI y captura privada de contacto, conservando la prohibición de solicitar datos personales en el texto libre generado por el modelo.
- [ ] Mantener «Solicitar contacto» disponible sin clave de OpenAI y después del cierre de la ronda 10.
- [ ] No consumir rondas de OpenAI ni llamar al modelo para elegir canal, validar campos, revisar autorización o guardar el prospecto. Proteger estos envíos con los límites propios del pipeline de intereses.
- [ ] Aplicar a la persistencia el tiempo real de la petición más los 800 ms adicionales; mostrar carga inmediata, error recuperable y éxito confirmado.
- [ ] Crear componentes con carpeta, CSS, skeleton y pruebas propios; reutilizar hooks y contratos existentes donde corresponda.

### 11.5. Entrega al closer

- [ ] Los prospectos nuevos deben quedar disponibles para el equipo autorizado en la misma tabla, con fecha, origen, interés, canal, dato de contacto y autorización.
- [ ] Definir una vista operativa o consulta autorizada de solicitudes pendientes; no exponer un listado de prospectos desde la API pública.
- [ ] Documentar el proceso de toma y seguimiento del prospecto para evitar contactos duplicados entre miembros del equipo. La captura inicial no implica que ya exista un panel de CRM.
- [ ] Mantener las actualizaciones de asignación y estado dentro del acceso del equipo autorizado.
- [ ] No enviar automáticamente correos, WhatsApp o llamadas como parte del registro: el objetivo de esta etapa es entregar el prospecto para que el closer continúe por el canal elegido.

## 12. Inscripción directa al curso mediante Hotmart

- [ ] Permitir que el setter entregue el enlace de inscripción cuando el visitante quiera comprar o inscribirse al curso, sin exigir una captura previa de datos.
- [ ] Usar el destino configurado en `siteSettings.courseUrl`: actualmente `https://nzamara-mtc.hotmart.host/flores-de-bach-vida-cotidiana`. Mantener una única fuente editable para la web y el chat.
- [ ] Renderizar un enlace visible y accionable, por ejemplo «Ver el curso e inscribirme», usando únicamente el destino permitido; el modelo selecciona la acción y no inventa la URL.
- [ ] Mantener el enlace disponible antes y después del cierre de las 10 rondas, y también sin clave de OpenAI. Mostrarlo no necesita otra llamada al modelo.
- [ ] Ofrecer contacto con el equipo si la persona tiene dudas o solicita acompañamiento, respetando la decisión de continuar directamente a Hotmart.
- [ ] Distinguir el curso actual de una futura modalidad online: dirigir la inscripción actual a Hotmart y el interés por la modalidad futura al pipeline correspondiente, sin anunciar disponibilidad no confirmada.
- [ ] No duplicar precios, fechas ni condiciones comerciales no confirmadas y no afirmar que un clic o un registro de interés equivalen a una inscripción o pago completados.
- [ ] Reutilizar el evento `hotmart_click` sin datos personales. Si el enlace abre otra pestaña, indicar ese comportamiento y configurar `rel="noopener noreferrer"`.
- [ ] Dejar la confirmación de compras mediante integración de Hotmart fuera de esta etapa; requiere un contrato y autorización posteriores.

## 13. Criterios de aceptación de captación e inscripción

- [ ] Probar teléfono, WhatsApp y correo con datos válidos, inválidos y faltantes. Comprobar que el canal elegido solo exige su dato necesario.
- [ ] Probar autorización rechazada y novedades desmarcadas: ninguna inserción sin autorización y ninguna suscripción automática.
- [ ] Probar confirmación editable, cancelación, doble envío y reintento tras una respuesta perdida; una sola captura confirmada debe generar un solo prospecto.
- [ ] Probar validación del servidor aunque se manipule el navegador; impedir que el visitante asigne fechas, closer o estado comercial.
- [ ] Comprobar que los datos estructurados de contacto no se envían a OpenAI ni aparecen en logs o eventos de analítica.
- [ ] Probar que la captura sigue disponible tras la ronda 10, no aumenta los intentos del modelo y funciona sin clave de OpenAI.
- [ ] Probar los formularios `online` y `nature` existentes para detectar regresiones de la ampliación del pipeline.
- [ ] Probar recepción diferenciada de consulta, terapias, curso actual, futura modalidad online y naturaleza con el contexto mínimo necesario.
- [ ] Probar enlace de Hotmart exacto, visibilidad tras el cierre, navegación accesible y registro de clic sin datos personales.
- [ ] Probar errores, límites y tiempos de revelado de la persistencia con servicios y temporizadores simulados; no usar prospectos reales en pruebas unitarias.
- [ ] Documentar al menos 30 escenarios reales del consumo de persistencia del nuevo flujo cuando se habilite su medición, con el mismo método de la sección 10, sin conservar contactos de personas reales en los registros de medición.

## 14. Prompts de configuración preparados para implementar con Luna

- [x] Redactar la política y el contrato del selector en `config/chatbot/setter.config.json`, como borrador sin activar.
- [x] Redactar prompts de sistema y decisión, guion local de captura y encargo de implementación por fases para Luna en `config/chatbot/prompts/`.
- [x] Separar las respuestas aprobables y las acciones permitidas de la inferencia del modelo.
- [x] Preparar 32 casos de decisión y 9 de autorización previa con resultados esperados, sin presentarlos como mediciones reales de Luna o Sol.
- [ ] Implementar los consumidores de esta configuración y verificar su contrato antes de activarla.
- [ ] Comparar Luna y Sol con el mismo corpus y contexto; exigir ausencia de fallos críticos y validar el comportamiento con frases no incluidas en los ejemplos.
- [ ] Confirmar el identificador API y las capacidades de la versión de Luna elegida si también se usará como modelo del setter. Redactar estos prompts no modifica el modelo actual.

Guía de uso, límites de equivalencia y fuentes oficiales: [configuración del setter](../config/chatbot/README.md).

Orden de implementación: contratos de conversación y captación → esquema compatible de intereses y cuotas → autorización atómica y pipeline → API y selector → hook, captura guiada, cierre y enlaces → pruebas y documentación → medición real.

Referencias de diseño para el almacenamiento: [funciones de base de datos](https://supabase.com/docs/guides/database/functions) y [seguridad de la Data API](https://supabase.com/docs/guides/api/securing-your-api). Su existencia no implica que esta infraestructura ya esté configurada.
