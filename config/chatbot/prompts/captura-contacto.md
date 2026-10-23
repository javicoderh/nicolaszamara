# Guion local de captación del setter

Este archivo configura el flujo de interfaz y los textos aprobados. No se envía a OpenAI ni se usa como un segundo agente. Las copias literales están en responses.es.json.

1. Ofrecer contacto cuando el visitante lo pida o como siguiente paso pertinente.
2. Confirmar el servicio si todavía no está seleccionado: consulta/terapia, curso actual, curso online o naturaleza.
3. Preguntar «¿Prefieres que te contactemos por videollamada, teléfono o WhatsApp?».
4. Solicitar nombre, teléfono internacional y correo obligatorios, cualquiera sea la preferencia.
5. Mostrar servicio, nombre, teléfono, correo y preferencia para corregirlos.
6. Solicitar autorización explícita para ese contacto y mostrar la información de privacidad. Novedades es una opción separada, desmarcada.
7. Enviar una única captura confirmada al pipeline de intereses con un identificador idempotente.
8. Confirmar el registro solo con el resultado real de persistencia; mostrar error recuperable si no se confirma.

# Reglas de ejecución

- Mantener los datos personales en los controles locales y en la petición de intereses, fuera del historial enviado al modelo.
- En el setter y los formularios de interés, correo y teléfono son siempre obligatorios.
- No convertir la aceptación de abrir el formulario en consentimiento de uso de datos.
- No confirmar una reserva, un horario, una llamada realizada o una compra por guardar un interés.
- Permitir cancelar y corregir; ante un error conservar campos para reintentar con el mismo identificador.
- La captura sigue disponible después de 10 respuestas del modelo y sin clave de OpenAI. No consume intentos del proveedor.
- Aplicar la duración real de la petición más 800 ms, con skeleton o estado inmediato de espera.
- Guardar en public.interest_registrations mediante el pipeline existente y el contrato de contacto v3.
- El estado de gestión lo asigna el sistema. El closer accede con permisos del equipo y continúa por el canal autorizado.

# Inscripción directa

Cuando el visitante quiera inscribirse al curso actual, mostrar «Ver el curso e inscribirme» con la URL de siteSettings.courseUrl. No requerir este formulario antes del enlace. No atribuir formato online al curso actual solo porque su inscripción se gestione en Hotmart.
