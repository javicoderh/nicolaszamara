# Conexión del pipeline API a Vercel

Configuración realizada el 5 de noviembre de 2026.

- Proyecto Vercel: `nicolaszamara`, `prj_9NLR5XePMoPl4dVGO06bZHQ0r5jq`.
- Producción redesplegada desde la versión existente: `https://nicolaszamara-oh0lfhcph-my-team-d5e0a31d.vercel.app`.
- Endpoint estable: `https://www.nicolaszamara.com/api/blog_worker`.
- Variables de producción: `BLOG_GENERATION_ENABLED=true`, `BLOG_MODEL=gpt-6.1-sol`, `BLOG_JOB_BUDGET_MICRO_USD=12000000`, `BLOG_DAILY_BUDGET_MICRO_USD=36000000` y `BLOG_WORKER_SECRET` sensible. Se conserva la credencial OpenAI del servidor.
- Secreto aleatorio conservado también en `.env.local`, excluido de Git. No se documentan sus valores.
- Worker registrado mediante `scripts.configure_blog_worker`; cron `blog-generation-ticks` activo cada minuto en Supabase.

## Comprobaciones realizadas

- Acceso al modelo: consulta de metadatos OpenAI, HTTP 200 para `gpt-6.1-sol`.
- POST autenticado al worker de producción: HTTP 200, `status=empty`.
- POST desde Supabase mediante `pg_net`, usando el secreto almacenado: HTTP 200, `status=empty`, sin timeout.
- Cola vacía al configurar. No se creó un artículo ni se consumió inferencia para esta comprobación.

La conexión está verificada; una generación editorial completa y su costo real siguen pendientes de un encargo. Los límites indicados son presupuestos de reserva, no el precio de un artículo. Preview no se habilitó. Este registro actualiza únicamente los pendientes de conexión del worker de los checkpoints anteriores.
