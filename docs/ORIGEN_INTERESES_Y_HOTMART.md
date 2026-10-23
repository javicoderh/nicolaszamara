# Origen de intereses y clics a Hotmart

## Intereses

`public.interest_registrations.source` ya distinguía `chatbot` y `form`. El nuevo campo `source_path` registra la ruta desde la que se envía el formulario, sin query string ni fragmento. Por ejemplo:

| source | source_path | Procedencia |
| --- | --- | --- |
| chatbot | /chatbot | Formulario del asistente en su página |
| chatbot | /cursos | Formulario del asistente flotante dentro de cursos |
| form | /cursos | Formulario de interés del curso online |
| form | / | Formulario de naturaleza en Inicio |

La ruta pasa por validación del servidor y se guarda tanto en la inserción pública como en la RPC del setter. Los registros anteriores conservan `source`; `source_path` queda en NULL cuando no se conocía. No se inventan rutas históricas.

```sql
select created_at, interest, source, source_path
from public.interest_registrations
order by created_at desc;
```

## Clics por navegador

La aplicación no tiene usuarios autenticados. El contador identifica un navegador mediante la misma cookie anónima firmada del asistente, con vigencia de hasta ocho días. Borrar esa cookie, usar otro navegador o dejarla expirar genera otra identidad; no permite reconocer a una misma persona en dispositivos diferentes.

`private.hotmart_click_events` conserva los eventos con UUID, origen, ruta y fecha. `private.hotmart_click_counts` mantiene el contador acumulado por visitante y origen. La vista `private.hotmart_click_summary` ofrece las columnas `chatbot_clicks`, `course_clicks`, `home_clicks` y `total_clicks`.

En el SQL Editor de Supabase, con permisos administrativos:

```sql
select visitor, chatbot_clicks, course_clicks, home_clicks, total_clicks, last_clicked_at
from private.hotmart_click_summary
order by last_clicked_at desc;
```

Totales por origen:

```sql
select source, sum(click_count) as clicks, count(*) as browsers_with_clicks
from private.hotmart_click_counts
group by source;
```

La fuente `chatbot` corresponde al enlace del asistente, independientemente de la página donde se use. `course` corresponde al enlace propio de `/cursos`. `home` mantiene separados los clics del enlace de Inicio. El conteo empieza al aplicar este cambio; los antiguos eventos del navegador no se almacenaban y no pueden reconstruirse.

## Entrega y controles

El enlace a Hotmart se abre normalmente, sin esperar la medición. El evento viaja al mismo origen con cookie y `keepalive`. La primera respuesta puede emitir la cookie si no existía. Los envíos se serializan para reutilizar esa identidad. Un error de red se reintenta una vez con el mismo UUID; cada intento tiene un límite de ocho segundos.

La RPC inserta el evento y aumenta el contador en una transacción corta. El UUID único impide duplicar un clic cuando se reintenta. Hay un límite de 60 eventos por navegador y minuto. Las tablas, vista y RPC no son accesibles a visitantes; el endpoint público solo registra, no consulta contadores. La atribución del origen se envía desde los controles de la app y no prueba una compra.

La medición es de mejor esfuerzo: bloqueo de red o cierre del navegador pueden impedir registrar un clic. No se añaden nombres, teléfonos, correos, mensajes ni datos clínicos a los eventos. No se usa OpenAI para esta función.

Verificación: pruebas unitarias con mocks y SQL transaccional en `tests/hotmart_tracking_unit.sql`; los datos de estas comprobaciones se revierten con ROLLBACK.
