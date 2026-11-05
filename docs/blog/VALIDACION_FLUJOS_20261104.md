# Validación de ingreso manual y generación desde la app

Fecha: 2026-11-04.

- [x] Añadir entrada para pegar un artículo completo en Contenido, conservando párrafos, subtítulos y listas editables.
- [x] Mantener edición bloque por bloque y distinguir añadir de reemplazar el contenido.
- [x] Validar límites sin truncamiento y representar HTML pegado como texto inerte.
- [x] Prueba unitaria del formulario manual: datos de lectura, revisión, categoría, referencias, reel, SEO/social, políticas, imágenes de apertura/interior y ubicación.
- [x] Comprobar guardado y reapertura en el componente con el servicio administrativo simulado; verificar que no genera encargos ni publica.
- [x] Compilación de producción y prerender.
- [x] Arrancar servidor local real e intentar inicio de sesión mediante HTTP con una cuenta temporal propia.
- [x] Eliminar la cuenta temporal y sus credenciales locales; detener el servidor iniciado para esta revisión.
- [ ] Guardar y recuperar el artículo manual en la base de datos mediante la app real.
- [ ] Ejecutar un encargo API completo desde el textarea hasta su entrega como borrador.
- [ ] Revisar visualmente ambos recorridos en un navegador autenticado real.

## Bloqueos observados

El servidor iniciado por Codex informa `storage_unavailable / rpc_connection_failed`. El intento HTTP de login devuelve `unavailable`; por tanto, no llegó a crear artículos ni encargos y no se consumió API de generación durante esta revisión. Las comprobaciones con servicio simulado no sustituyen esos recorridos reales.

La revisión automática rechazó iniciar Edge con el comando de apertura de una ventana de prueba. No se eludió ese rechazo. Se solicitó acceso a una sesión de pruebas, sin pedir contraseñas por chat.

Las pruebas nuevas son unitarias de componentes y del parser; no se incorporó una suite de integración ni de extremo a extremo.

## Uso manual

Dashboard → Blog → Crear manualmente. Completar los datos de lectura, clasificación, fuentes y SEO. En Contenido → Pegar un artículo ya escrito, pegar el cuerpo y pulsar Añadir texto al contenido. Los subtítulos se reconocen con `##` y las listas con guiones o números. El título tiene su propio campo. También se puede escribir directamente usando los botones de bloques.

Subir y guardar cada recorte, completar sus descripciones y guardar el borrador. La publicación sigue siendo una acción manual independiente.
