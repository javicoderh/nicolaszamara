# Limpieza previa al nuevo intento completo

Ejecutada por petición expresa del usuario el 2026-11-04.

- [x] Inventariar encargos, borradores, publicaciones, relaciones y reservas.
- [x] Eliminar los cuatro encargos existentes, incluidos los dos fallidos.
- [x] Eliminar el borrador de muestra no publicado y sus revisiones por cascada.
- [x] Conservar el artículo publicado de migrañas y sus datos asociados.
- [x] Comparar hashes de la publicación y su registro privado antes y después, dentro de la misma transacción; ambos permanecen idénticos.
- [x] Verificar cero encargos, cero artículos sin publicación y una publicación conservada.
- [x] Consultar el worker en base de datos: `empty`, sin trabajo ni bloqueo pendiente.
- [x] Conservar las reservas diarias anteriores, sin falsear consumo ni ampliar límites.
- [x] Confirmar configuración local: generación activada, `gpt-6.1-sol`, techo de US$12 por trabajo y US$36 al día.
- [x] Verificar US$15 ya reservados en el día y US$21 restantes: un trabajo nuevo puede reservar las cuatro etapas, US$12 en total.
- [x] Solicitar `web_search_call.action.sources` también al recuperar respuestas en segundo plano, para conservar la evidencia que comprueba el brief.
- [x] Ejecutar 57 pruebas unitarias del backend del blog.
- [ ] Completar el nuevo recorrido real desde el dashboard contra OpenAI; no se inició generación durante esta limpieza.

La propuesta anterior de aumentar a US$15 el techo por trabajo correspondía al encargo eliminado con intentos acumulados. Para un trabajo nuevo no hace falta ese aumento; los límites permanecen iguales.

Antes del intento, reiniciar `npm run dev` para que Python cargue el código vigente y su worker. Actualizar la página para descartar listados e identificadores de encargos ya eliminados. Crear una sola idea y seguir ese mismo encargo desde la cola hasta su entrega como borrador. Las imágenes se incorporan después y publicar sigue siendo una acción manual.

La configuración de dispatch remoto está vacía; esta revisión corresponde al entorno local, donde `npm run dev` inicia el worker. No demuestra que el pipeline esté desplegado ni que el recorrido real de generación ya haya pasado.
