# Prompt de implementación para Luna

Implementa la fase indicada por el usuario del chatbot setter de este repositorio. Lee primero AGENTS.md, docs/PLAN_MEJORA_CHATBOT.md y config/chatbot/README.md. Conserva las decisiones allí documentadas y revisa el código real antes de modificarlo.

Este archivo es un encargo para el agente que programa; nunca se envía como prompt al chatbot de visitantes. Si el usuario solicita solo redacción o planificación, produce esos artefactos y conserva el runtime actual.

# Resultado que debes preservar

- Hasta 10 rondas completadas; orientación al siguiente paso desde la respuesta 8; respuesta 10 entregada antes del cierre; intento 11 sin llamada a OpenAI.
- Cuotas e idempotencia autorizadas de forma atómica en almacenamiento compartido. El historial limitado a 12 mensajes no reemplaza el contador acumulado.
- Separar 10 respuestas completadas de 12 intentos máximos por conversación. Aplicar los límites diarios y la pausa definidos en setter.config.json.
- El modelo decide únicamente topic, response_key, action y contact_signal. Validar la combinación contra decisions y la lista de acciones del servidor.
- Contacto guiado por teléfono, WhatsApp o correo; solo nombre, servicio y dato necesario. Revisión, consentimiento explícito y novedades independiente.
- Insertar en la misma interest_registrations, mediante el pipeline de intereses ampliado. Los formularios online y nature existentes deben seguir funcionando.
- El modelo y la analítica no reciben los datos de los controles de contacto. La captura se completa también tras la ronda 10 y sin clave de OpenAI.
- Inscripción actual por siteSettings.courseUrl, sin forzar captura. No suponer que Hotmart implica una edición online disponible ni que un clic confirma una compra.
- Cada carga remota respeta petición más 800 ms, también en error, usando BASE_DELAY_MS. Invalidar respuestas obsoletas y limpiar timers.
- Componentes con carpeta, CSS, skeleton y pruebas unitarias; adaptadores externos simulados. Mantener la identidad visual existente.

# Secuencia de fases acotadas

Fase 1: cargar y validar esta configuración con una interfaz explícita; adaptar el selector y el contrato de respuesta; comprobar los casos de decisión mediante mocks. El esquema nuevo no es compatible por sí solo con el parser actual de backend/chatbot.py: cambiar cargador, parser, validación, renderer y consumidor como una unidad coherente. No activar claves de respuesta que todavía no tengan acción implementada.

Fase 2: implementar el contrato de cuotas, reservas, presupuesto e idempotencia y su adaptador persistente. Revisar permisos y concurrencia; preparar una migración revisable. Una variable global o localStorage no son límites de producción.

Fase 3: ampliar intereses y su esquema de forma compatible para consulta, curso, teléfono, preferencia y consentimiento de contacto. Ajustar restricciones, permisos de inserción y rate limit por contacto. Mantener datos históricos sin inventar consentimientos. No crear otra tabla de prospectos ni otro pipeline comercial.

Fase 4: implementar el hook de conversación y los controles de captura, orientación desde la ronda 8, cierre tras la 10 y enlace Hotmart. Mostrar estados de carga, error y confirmación real; no exponer nombres internos como «closer» al visitante.

Fase 5: ejecutar pruebas unitarias y compilación; convertir los casos de referencia en evaluaciones reproducibles. Comparar Luna y Sol con los mismos casos antes de afirmar equivalencia. Las mediciones reales de latencia y tokens se realizan solo cuando exista acceso al proveedor y autorización vigente; no inventar resultados ni gastar llamadas reales para verificar mocks.

Al iniciar, indica la fase y comprueba sus dependencias. Trabaja en la fase pedida; si faltan decisiones de negocio, usa la opción de aclaración documentada. No sustituyas el modelo solicitado ni alteres precios, disponibilidad o textos clínicos para resolver un bloqueo.

# Límites técnicos que no puedes resolver mediante prompting

- No usar la decisión del modelo como prueba de consentimiento, pago, registro guardado o autorización de cuota.
- No aceptar contadores enviados por el navegador.
- No repetir llamadas de resultado incierto automáticamente. Reutilizar request_id y conservar reservas conservadoras.
- No aplicar ni desplegar cambios remotos por interpretar que un documento de planificación los autoriza; seguir la autorización vigente de la conversación.
- No exponer claves privilegiadas; no reutilizar la clave publicable actual para operaciones para las que carece de permisos.
- No afirmar que activar structured outputs garantiza una decisión semántica correcta.
- No declarar equivalencia con Sol basándose en ejemplos escritos o en pruebas con mocks.

# Verificación y entrega

Usa decision-cases.json como referencia de comportamiento y añade pruebas unitarias para cuotas, persistencia y UI en la fase correspondiente. Incluye timeout, cancelación, doble clic, dos pestañas y fallo después de insertar. Respeta que el repositorio admite únicamente pruebas unitarias automatizadas.

Conserva trazabilidad entre requisito, cambio y resultado de prueba. Marca checkboxes solo cuando el trabajo real esté completo. Informa archivos modificados, pruebas realizadas, resultados, pendientes e infraestructura aún no aplicada. Mantén el trabajo previo del usuario.
