# Base de datos de Nicolás Zamara

Proyecto: `nicolaszamara` (`vsbolndzzkrhadprdlto`), organización My Team de Vercel, región São Paulo.

Contrato actual de contacto: `interest_contact_preferences.sql` añade `contact_preference` (`video_call`, `phone`, `email`) y exige teléfono y preferencia en cada INSERT mediante un trigger invoker. También amplía los permisos de inserción de `anon` únicamente para esas dos columnas. Los registros históricos conservan su teléfono y consentimiento; la preferencia desconocida permanece NULL, sin rellenados inventados. La versión de consentimiento nueva es `2026-10-23-contact-v2`. El campo `contact_channel` se conserva para compatibilidad histórica; en capturas nuevas coincide con la preferencia. Consulta [el contrato vigente](../docs/CONTACTO_INTERESES.md); las descripciones de WhatsApp y destinos excluyentes posteriores corresponden al esquema anterior.

`interest_registrations.sql` conserva el esquema aplicado con la migración remota `create_interest_registrations`. No ejecutar de nuevo sobre una base ya creada.

Actualización del setter, 2026-10-23: se aplicaron `setter_conversations_and_contact_capture` (`setter.sql`) y `setter_contact_policy_and_management` (`setter_contact_policy.sql`), en ese orden. Son ampliaciones del esquema existente, no scripts para recrearlo. Los formularios originales siguen usando `anon`, sus columnas y su consentimiento `2026-10-21`.

Los contactos del chat usan la misma tabla: `source=chatbot`, intereses `consultation`, `course`, `online` o `nature`, nombre y exactamente uno de correo o teléfono. `contact_channel` distingue email, teléfono o WhatsApp. Se registran consentimiento de contacto, versión `2026-10-23`, fecha asignada por el servidor, novedades opcionales, identificador de reintento y huella HMAC. El visitante no asigna fechas ni `management_status` (`new`, `contacted`, `closed`). El equipo puede filtrar en Studio por `source`, `interest`, `contact_channel`, `management_status` y fecha; no se creó un CRM ni se envían mensajes automáticamente.

Las tablas `private.setter_conversations`, `setter_daily`, `setter_requests` y `setter_budget` no están expuestas a visitantes. Tienen RLS activo sin políticas públicas; ese cierre es intencional. Las funciones `public.setter_transition` y `setter_save_contact` son `SECURITY INVOKER`, ejecutables solo por `service_role`, al que se asigna la clave secreta del backend. No se cambió el acceso de los formularios a una clave privilegiada. El trigger existente sigue siendo `SECURITY DEFINER` para aplicar el límite público, con ruta de búsqueda vacía y ejecución revocada a visitantes.

Verificación: `tests/setter_unit.sql` prueba las funciones y permisos con `BEGIN`/`ROLLBACK`, sin retener prospectos ni cuotas de prueba. La revisión posterior de seguridad solo informa cuatro avisos INFO por RLS sin políticas en las tablas privadas; no hay avisos WARN/ERROR. La propuesta de limpieza de metadatos tras 48 horas requiere aprobar su retención y operación antes de activar un trabajo de borrado. Actualmente no existe borrado automático. Los registros comerciales tienen una retención separada aún por definir.

El resto de este documento describe el esquema original; para la implementación actual, consulta [el estado del setter](../docs/IMPLEMENTACION_SETTER.md).

La tabla `public.interest_registrations` almacena:

- `interest`: `online` o `nature`.
- Nombre y correo normalizado; país y experiencia opcional para online, ciudad para naturaleza.
- Autorización obligatoria para esta finalidad, autorización independiente y opcional para novedades y versión del texto aceptado.
- Identificador UUID, fecha de registro y fecha de autorización asignados por la base.

RLS está activo. El rol `anon` solo puede insertar las columnas permitidas; no puede leer, actualizar, borrar ni asignar identificadores o fechas. No hay acceso para visitantes autenticados. La clave publicable del backend no es un secreto ni permite consultar datos. La revisión de registros requiere acceso autorizado a Supabase Studio.

Un trigger privado aplica límites compartidos entre instancias: máximo 5 registros por correo y minuto, y 200 registros totales por minuto. La API añade validación, límite de 8 KB y campo trampa. Esto es protección básica; no reemplaza un CAPTCHA para una campaña con abuso elevado.

Para ver registros: Supabase Studio → proyecto nicolaszamara → Table Editor → `interest_registrations`. La API pública no proporciona listado de registros.

Verificación realizada: inserciones de ambos intereses con rol `anon` dentro de una transacción revertida, privilegios y revisión de seguridad de Supabase. No se retuvieron los datos de verificación.

Antes de eliminar registros de prueba, seleccionarlos y revisarlos en Studio. No existe borrado automático por coincidencias de nombre o correo.


`setter_learning.sql` añade propuestas de corrección y ejemplos revisados en el esquema privado, con RPC exclusivas del servidor. Consulta `docs/APRENDIZAJE_CHATBOT.md` para su revisión y uso.

`interest_whatsapp_required_email.sql` añade WhatsApp al contrato de contacto v3. Las nuevas solicitudes eligen videollamada, teléfono o WhatsApp y requieren teléfono y correo en todos los casos. Las preferencias y autorizaciones históricas se conservan; la opción anterior de mail no se admite en nuevas altas. El trigger exige el correo también en inserciones directas y la política pública utiliza la versión v3.

`interest_sources_and_hotmart_clicks.sql` añade `source_path` a los intereses y el conteo privado de clics por navegador y origen. `source` mantiene la distinción entre `form` y `chatbot`; no se inventan rutas para registros anteriores. La vista `private.hotmart_click_summary` muestra `chatbot_clicks`, `course_clicks`, `home_clicks` y `total_clicks`. Consultas e identificación anónima documentadas en [ORIGEN_INTERESES_Y_HOTMART.md](../docs/ORIGEN_INTERESES_Y_HOTMART.md).
