# Prueba manual de los formularios

Espera a que el despliegue de Vercel asociado al commit de GitHub termine correctamente. Usa la URL que muestre Vercel para `nicolaszamara`.

1. Abre `/cursos#interes-online`, completa nombre, correo ficticio y país. La experiencia es opcional.
2. Acepta el tratamiento para este interés. La autorización de novedades debe comenzar desmarcada y puede seguir así.
3. Envía. El botón y los campos se bloquean durante el envío. Tras la respuesta y 800 ms adicionales debe aparecer «Tu interés quedó registrado. Gracias.».
4. Abre Supabase Studio → proyecto `nicolaszamara` → Table Editor → `interest_registrations`. Comprueba `interest=online`, país, correo normalizado y `updates_consent=false`.
5. Abre `/#interes-naturaleza`, completa nombre, correo y ciudad, acepta la finalidad y envía. Comprueba `interest=nature`, ciudad y país vacío en Studio.
6. Usa «Registrar otro interés» para limpiar los campos. Comprueba también el envío con novedades activadas; la autorización debe guardarse como `true`.
7. Prueba campos obligatorios vacíos, correo inválido y autorización de finalidad desmarcada: no debe guardarse nada.
8. Prueba doble clic durante el envío: debe enviarse una sola solicitud. Si cortas la conexión, la interfaz no debe anunciar éxito ni borrar los campos. Una respuesta perdida podría haber guardado el dato: comprueba Studio antes de repetir una prueba.
9. Al superar cinco registros con el mismo correo en un minuto, debe aparecer el aviso de espera. El sexto registro no se guarda. Espera un minuto para continuar.

Puedes usar correos como `prueba-online@example.invalid` y nombres como «Prueba manual online». Los registros quedan guardados; elimínalos desde Studio cuando termines. Esta versión solicita datos ficticios y mantiene identificados los datos de privacidad pendientes.

## Comprobaciones técnicas

- En Network, el envío usa `POST /api/interests`; HTTP 201 y `{"status":"saved"}` confirman persistencia.
- HTTP 400: campos o autorización inválidos; 429: límite de frecuencia; 503: no se pudo confirmar almacenamiento.
- `GET /api/interests` devuelve 405 y no expone datos.
- Recargar `/cursos` y `/consulta` conserva la navegación; las rutas `/api` quedan excluidas de la regla SPA.
- Las pruebas automatizadas del repositorio son unitarias y usan mocks. La comprobación real de la web queda en esta lista manual.

## Mediciones pendientes

La regla implementada es duración real de la solicitud + 800 ms. La medición de al menos 30 escenarios reales del endpoint sigue pendiente hasta disponer del despliegue: alternar interés, primera carga, recarga, solicitudes consecutivas, conexión lenta, error y reintento. Registrar por escenario duración de la solicitud, resultado y tiempo hasta revelar; no incluir nombres ni correos. Calcular muestra, media, mediana, mínimo, máximo, desviación estándar, p90 y p95. No se sustituyeron estas mediciones por datos simulados.
