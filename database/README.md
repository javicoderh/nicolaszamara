# Base de datos de Nicolás Zamara

Proyecto: `nicolaszamara` (`vsbolndzzkrhadprdlto`), organización My Team de Vercel, región São Paulo.

`interest_registrations.sql` conserva el esquema aplicado con la migración remota `create_interest_registrations`. No ejecutar de nuevo sobre una base ya creada.

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
