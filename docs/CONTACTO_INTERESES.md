# Teléfono y preferencia en los intereses

Actualización: 2026-10-23. Aplica a formularios de naturaleza, interés online y captura del setter, en `public.interest_registrations`.

Migración remota aplicada: `require_interest_phone_and_contact_preference`. Verificación final: **108 pruebas de frontend, 42 de Python, pruebas SQL con rollback y compilación aprobadas**. Cero contactos de prueba retenidos; revisión de seguridad sin nuevas observaciones (persisten los cuatro INFO documentados de RLS cerrado en tablas privadas). Se verificó que la clave local puede cargarse y que no está en los archivos del build. No se hicieron llamadas reales a OpenAI ni se desplegó el frontend en esta actualización.

| Campo | Regla de nuevos registros |
| --- | --- |
| `phone` | Obligatorio, prefijo internacional; normalizado a `+` seguido de 7–15 dígitos |
| `contact_preference` | Obligatorio: `video_call` (Videollamada), `phone` (Teléfono), `email` (Mail) |
| `email` | Siempre obligatorio en formularios existentes; en el setter obligatorio para videollamada/mail, opcional para teléfono |
| Consentimiento | Versión `2026-10-23-contact-v2`; novedades sigue siendo opcional y sin marcar |

La preferencia se elige explícitamente; no hay un valor predeterminado. `ContactPreference` presenta cámara, teléfono y sobre junto a un radio circular, con nombre visible y tooltip al pasar el mouse o enfocar el radio. Escape cierra el tooltip. Los radios nativos permiten navegación por teclado y tienen nombres accesibles. El componente comparte el ciclo de carga de su formulario, sin añadir otro delay; tiene su propio CSS, skeleton y pruebas unitarias.

El catálogo y la versión se centralizan en `config/interests/contact.config.json`. La API usa `backend/contact_details.py` para validar y normalizar ambos orígenes. El teléfono y la preferencia se vuelven a exigir en la base con `private.require_interest_contact_details`, incluso si se omite la API o se manipula el navegador. Las fechas, estado y fuente siguen fuera de los permisos públicos. La RPC del setter guarda los nuevos campos en la misma tabla y conserva la idempotencia.

La migración `interest_contact_preferences.sql` conserva filas anteriores: no asigna preferencias ni inventa teléfonos o autorizaciones. La columna admite NULL en filas históricas; el trigger impide omitirla en nuevas inserciones. No se convierte WhatsApp histórico a una preferencia distinta. Seleccionar videollamada no agenda ni confirma una sesión; el correo permite coordinarla.

Pruebas: Vitest/RTL cubren selección única, obligatoriedad, hover, foco, Escape, envío, revisión, conservación de campos y los 800 ms posteriores a la petición. Python cubre valores faltantes, inválidos, las tres preferencias y normalización. `tests/contact_preferences_unit.sql` y `tests/setter_unit.sql` ejercitan funciones/constraints con rollback, sin contactos retenidos ni llamadas a OpenAI.

El servidor de desarrollo carga las variables admitidas de `.env.local` y `.env` sin reemplazar las del proceso. La clave de OpenAI se conserva localmente solo en `.env.local`, ignorado por Git, y remotamente como secreto de Vercel; no se copia a archivos de ejemplo, documentación ni código público. Configurarla no habilita por sí solo el setter: también necesita firma de cookie, clave de Supabase y presupuesto. El Preview actual ya tiene la configuración y el contrato nuevos; ver [su estado y acceso](PRUEBA_MANUAL_SETTER.md). Production recibirá los cambios cuando se despliegue la versión actual allí.
