# Administración de intereses

Ruta: `/admin`. Estado: implementación del frontend y API local, esquema remoto aplicado y usuario inicial creado el 2026-11-01. Esto no publica el frontend en Vercel.

## Acceso

El usuario inicial es `Nzamara`, con la contraseña indicada por el titular durante la implementación. La contraseña no se incluye en el repositorio ni se incorpora al bundle: la base conserva un hash PBKDF2-HMAC-SHA256 con sal aleatoria de 16 bytes y 600.000 iteraciones. La comparación se realiza en Python con tiempo constante para el digest.

No existe registro público de administradores. La cuenta es independiente de la identidad anónima del asistente y no usa las preferencias de analítica.

El acceso requiere `SUPABASE_SECRET_KEY` en el servidor y el esquema de administración en el mismo proyecto de `SUPABASE_URL`. No depende de OpenAI ni de `CHAT_COOKIE_SECRET`.

## Funcionalidad

- Total del historial completo y resumen del filtro aplicado, por servicio, origen y estado nuevo.
- Filtros por día, mes, rango inclusivo de fechas, servicio y lectura (Nuevos, Leídos o Todos). El dashboard comienza en Nuevos (sin leer).
- Fechas interpretadas y mostradas en `America/Santiago`, con límites convertidos individualmente a UTC para respetar cambios de horario.
- Lista de 20 solicitudes por página, ordenadas por `created_at DESC, id DESC`; cursor compuesto para evitar omisiones por empates de fecha. El resumen se calcula sobre todo el resultado, no solo la página visible.
- Detalle en modal nativo accesible: contacto, ubicación, experiencia, origen, estado, autorizaciones, versión y fechas. Los valores ausentes se muestran como «Sin registro» y no se reconstruyen datos históricos.
- El modal solicita el registro al abrir, permite reintentar, cierra con Escape/botón/fondo y restaura el foco. No devuelve huellas HMAC ni identificadores internos de reintento.
- Actualización manual del listado, cierre de sesión y cambio de contraseña.
- Botón «Marcar como leído» en el detalle. Abrir el modal no marca automáticamente: el administrador confirma que terminó de revisarlo. Se conserva la fecha de primera lectura y quién la marcó; reintentar no cambia esa fecha. Al guardar, se recalculan el resumen y el listado desde la primera página.

Lectura y gestión son independientes: «Nuevo» en el filtro de lectura significa sin lectura registrada; «Contactado» y «Cerrado» siguen perteneciendo a gestión. Marcar como leído no confirma que se haya contactado a la persona. Los intereses leídos desaparecen de Nuevos, pero permanecen en Leídos/Todos y en el total histórico. Los registros existentes empiezan sin marca; no se inventan fechas de revisión anteriores.

No se añaden edición, eliminación, exportación ni cambios de estado de gestión. Esas operaciones quedan fuera del alcance de esta entrega.

## API y sesiones

Todas las operaciones usan `POST /api/admin` con JSON y `X-Admin-Request: 1`. El servidor valida el origen y rechaza peticiones sin ese header. El cuerpo máximo es de 4 KB; no se envían credenciales en URLs.

| operation | Campos adicionales | Resultado |
| --- | --- | --- |
| session | Ninguno | Sesión autenticada o 401. |
| login | username, password | Cookie de sesión y nombre del usuario. |
| logout | Ninguno | Revoca la sesión actual y elimina la cookie. |
| interests | filters, cursor opcional | Resumen completo y página de registros. |
| detail | id | Detalle de un interés o 404. |
| mark_read | id | Guarda lectura para el interés; idempotente y con sesión obligatoria. |
| password | currentPassword, newPassword | Cambia contraseña y revoca todas las sesiones. |

La cookie `nz_admin` es `HttpOnly`, `SameSite=Strict`, con `Path=/api/admin`, y `Secure` en Vercel o con `APP_ENV=production`. Expira a las ocho horas, sin renovación deslizante. El valor es aleatorio de 32 bytes; la base solo conserva su SHA-256 y verifica expiración y versión de credencial en cada operación protegida.

Hay cinco intentos de acceso por usuario en una ventana de 15 minutos. Un inicio correcto reinicia su contador; el cambio de contraseña también verifica la actual y consume ese límite. No se usan contadores en memoria del proceso, por lo que el límite se comparte entre instancias. Si el almacenamiento falla, el acceso se cierra con 503.

El cambio admite entre 12 y 128 caracteres, exige una contraseña distinta y confirmación en la interfaz. La actualización del hash, incremento de versión y eliminación de sesiones son atómicos. Tras el éxito se solicita ingresar nuevamente. Cerrar una sesión no cierra las de otros dispositivos; cambiar contraseña sí.

Las respuestas usan `no-store`. El handler de Vercel añade `X-Robots-Tag` y `Vary: Cookie`; la ruta HTML conserva `noindex,nofollow` incluso cuando el resto del sitio puede indexarse. `/admin` queda fuera del sitemap, del panel de consentimiento, de los sensores de marketing y del asistente público. El HTML prerenderizado contiene solo un shell de espera, sin datos ni credenciales.

## Esquema y permisos

Migración remota y archivo local: `20261101191608_admin_dashboard`, en `supabase/migrations/`.

Ampliación de lectura aplicada: `20261101193950_admin_interest_reads`. La tabla `private.admin_interest_reads` conserva una marca por interés, fecha y administrador, con RLS y sin acceso público. La RPC de servidor permite únicamente registrar y consultar la lectura; los permisos públicos de contactos no se amplían. El filtro `filters.reading` admite `unread`, `read` o `all`. El valor por defecto del endpoint es `all` por compatibilidad; la interfaz solicita explícitamente `unread` al abrir.

- `private.admin_users`: usuario, hash, versión, intentos y fechas de operación.
- `private.admin_sessions`: hash del token, usuario, versión y expiración.
- `public.admin_access(text, jsonb)`: RPC `SECURITY INVOKER` con `search_path` vacío, ejecutable exclusivamente por `service_role`.
- RLS habilitado en ambas tablas privadas, sin políticas ni acceso público. No se amplían permisos de lectura de contactos a `anon` ni `authenticated`.
- Índice compuesto sobre fecha e identificador para el cursor y índices de sesión por usuario/expiración.

Las sesiones expiradas se descartan al autorizar y se eliminan al iniciar nuevas sesiones. No se añade un job de retención ni se cambia la conservación de contactos.

Para una base nueva, aplicar el esquema conciliando antes el historial completo del repositorio. Un operador autorizado debe crear la cuenta con un hash generado mediante `backend.admin_security.password_hash`; no introducir contraseñas en claro en SQL, migraciones o scripts versionados. No volver a crear ni sobrescribir la contraseña de una cuenta existente al desplegar.

### Recuperación administrativa

Si se alcanza el límite de intentos, esperar la ventana de 15 minutos. No existe recuperación pública por correo. Si se pierde la contraseña, un operador con acceso administrativo a la base puede generar un hash nuevo fuera del repositorio, introduciendo la contraseña mediante una entrada oculta, y actualizar la cuenta en una transacción: reemplazar `password_hash`, incrementar `version`, actualizar `password_changed_at`, reiniciar `attempts` y `window_started_at`, y eliminar sus filas de `private.admin_sessions`. Confirmar la identidad del titular antes de esa operación. El incremento de versión y la eliminación de sesiones impiden que un acceso anterior sobreviva al restablecimiento.

## Desarrollo y verificación

Ejecutar `npm run dev`, que inicia Python y Vite de forma coordinada, y abrir `/admin`. Alternativamente, usar `npm run dev:api` y `npm run dev:frontend` en terminales separadas. No basta con `npm run preview` para usar la API. En Vercel, la ruta dispone de rewrite propio a `/admin/index.html` y la función `api/admin.py` usa las variables del servidor.

Los componentes tienen CSS, skeleton y pruebas junto a su implementación. La carga de sesión, los resultados, el detalle y las operaciones de acceso/contraseña respetan la petición real más 800 ms, con limpieza de temporizadores y descarte de respuestas al desmontar. Autenticación y listado son dependencias reales; detalle y contraseña conservan ciclos independientes.

Pruebas unitarias:

```powershell
.\.venv\Scripts\python.exe -m unittest tests.test_admin -v
node node_modules/vitest/vitest.mjs run src/hooks/useAdminQuery src/services/adminService.test.js src/components/AdminLogin src/components/AdminPasswordForm src/components/AdminDashboard src/components/AdminInterestModal src/pages/AdminPage src/app/App.admin.test.jsx --pool=vmThreads --maxWorkers=1 --testTimeout=20000
```

`tests/admin_unit.sql` verifica permisos, contador de intentos, sesión expirada, cambio de hash, revocación, resumen completo y límite de página con una cuenta sintética en transacción revertida. No crea contactos ni envía avisos de correo. La revisión de seguridad posterior a la migración solo reportó INFO por RLS sin políticas en tablas privadas; sin WARN/ERROR.

`tests/admin_reads_unit.sql` verifica autorización, exclusión de Nuevos, inclusión en Leídos, detalle, fecha idempotente y conservación del estado de gestión. Usa un interés ficticio y rollback; la cola de aviso también se revierte sin enviar correos. Las pruebas de React comprueban la petición más 800 ms, errores/reintentos, filtros y recarga del contador tras guardar. No se modificaron marcas de intereses reales para verificar la implementación.

No se han medido 30 escenarios de latencia de estos consumos. No se ajustaron los tiempos con estimaciones ni se generaron estadísticas ficticias. Las pruebas unitarias usan mocks; no acreditan disponibilidad o comportamiento visual del despliegue remoto.
