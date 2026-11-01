# Avisos de nuevos intereses

Destino fijo: **hola@nicolaszamara.com**. Proveedor: FormSubmit, sin cuenta ni clave API.

Destinatario restablecido a `hola@nicolaszamara.com` el 2026-11-01 mediante
`interest_email_recipient_hola`. La activación de Gmail documentada abajo no
acredita la activación de esta dirección.

Destinatario actualizado el 2026-11-01 desde `hola@nicolaszamara.com`.
La nueva dirección requiere su propia activación en FormSubmit.

Activación de Gmail confirmada por el proveedor el 2026-11-01: solicitud de
prueba pg_net #5, HTTP 200 y `success: "true"`. Destino del trigger verificado
como `justarapperguy@gmail.com`. La respuesta acredita aceptación del envío;
la recepción en el buzón debe comprobarla el destinatario.

Aplicado en Supabase `vsbolndzzkrhadprdlto` el 2026-11-01 mediante la migración
`interest_email_notifications`. Pruebas unitarias SQL aprobadas; revisión de
seguridad sin WARN/ERROR (RLS sin políticas es intencional para la tabla privada).
Solicitud de activación pg_net #2: HTTP 200, respuesta del proveedor indicando
que envió el correo y requiere pulsar **Activate Form**. Esto verifica la
solicitud, no la recepción en el buzón ni la entrega de avisos posteriores.

`database/interest_email_notifications.sql` instala un trigger AFTER INSERT en
`public.interest_registrations`: cubre formularios, chatbot e inserciones directas.
No envía registros históricos, modificaciones ni reintentos del chatbot que no
creen un registro nuevo. pg_net inicia la petición solo después del COMMIT.
No requiere publicar cambios del frontend y no añade esperas a sus componentes.

El aviso incluye motivo, nombre, email, teléfono, preferencia de contacto,
enlaces de contacto, ubicación y experiencia cuando existan, fecha, origen,
página e identificador. Reply-To usa el email de la persona. No se envían la
conversación del chatbot, huellas, cookies ni preferencias de marketing.

## Activación

FormSubmit envía un correo de activación al recibir la primera solicitud.
El propietario debe abrirlo y confirmar; revisar spam. El sistema no debe
considerarse operativo hasta confirmar y comprobar un aviso posterior.
Los datos de contacto se transmiten también a FormSubmit, cuyo archivo de
envíos conserva solicitudes durante 30 días según su documentación.

## Operación y límites

`private.interest_email_dispatches` conserva solo identificador del interés,
identificador de petición, fecha y fallo de encolado. No es accesible al público.
Una fila encolada no prueba entrega al buzón: consultar la respuesta del proveedor
en `net._http_response`, que pg_net conserva temporalmente (por defecto 6 horas).
No hay reintentos automáticos; un fallo HTTP requiere revisión y reenvío manual.
FormSubmit puede aplicar filtros antispam y no garantiza entrega. Los intereses
permanecen en Supabase aunque falle el correo. No registrar cuerpos con datos
personales en logs. La cola de pg_net contiene el cuerpo hasta procesarlo.

```sql
select d.interest_id, d.queued_at, d.enqueue_failed,
       r.status_code, r.timed_out, r.error_msg
from private.interest_email_dispatches d
left join net._http_response r on r.id = d.request_id
order by d.queued_at desc limit 30;
```

Pruebas unitarias: `tests/interest_email_unit.sql` verifica el resumen, permisos y
encolado con datos ficticios en una transacción revertida. No hace llamadas HTTP
reales. No se han medido 30 escenarios del proveedor: no se ajustó ninguna
coreografía temporal ni se inventaron estadísticas.

Para desactivar: `alter table public.interest_registrations disable trigger notify_interest_email;`

Referencias: https://formsubmit.co/documentation y
https://supabase.com/docs/guides/database/extensions/pg_net.
