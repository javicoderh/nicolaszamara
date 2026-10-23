# Renovar la conversación al refrescar

Al cargar `/chatbot`, o abrir por primera vez el asistente flotante después de cargar una página, el cliente obtiene su sesión firmada y solicita `refresh` con el identificador actual. El servidor limpia el tema, la acción, la última respuesta, el rechazo de contacto y el formulario abierto. Después de una conversación usada, genera un nuevo identificador y reinicia sus rondas e intentos.

Una conversación sin rondas ni intentos se limpia sin consumir otra conversación del cupo diario. Minimizar y volver a abrir el panel, navegar mediante los enlaces internos o ampliar a `/chatbot` conserva el diálogo. La renovación ocurre al recargar el documento y abrir el asistente, no al cambiar de ruta. «Recuperar estado» consulta la sesión y no inicia otra conversación.

La cookie anónima no cambia: las respuestas e intentos diarios, el máximo de tres conversaciones diarias, el presupuesto global de USD 3 y los clics a Hotmart conservan su contabilización. Si la conversación ya se cerró, se mantiene la pausa establecida de 30 minutos. Una petición de modelo pendiente impide reemplazar su conversación hasta que termine o venza su reserva; no se realizan nuevos llamados al modelo al refrescar.

El arranque completo (sesión y renovación) se revela tras finalizar las peticiones más los 800 ms de espera base. Las respuestas obsoletas se descartan mediante el hook de carga. Un identificador cambiado por una renovación concurrente se recupera una sola vez.

La migración `database/setter_refresh_conversation.sql` amplía la RPC existente sin cambiar el comportamiento previo de `restart` ni eliminar historiales de solicitudes. Las verificaciones SQL se ejecutan con ROLLBACK en `tests/setter_refresh_unit.sql`.
