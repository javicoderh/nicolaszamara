# Dashboard por ventanas

- [x] Tarjetas con iconos y accesos rápidos para las tareas de Blog e Intereses.
- [x] Abrir cada módulo en una ventana, en lugar de insertar formularios entre los listados.
- [x] Extraer el editor completo a AdminArticleEditorModal: texto, imágenes, SEO, referencias, vista previa, publicación e historial.
- [x] Extraer la ficha del encargo a AdminBlogJobModal, con carga independiente, estado, etapa, brief, registros, consumo y acciones.
- [x] Compartir la base AdminModal con el detalle de intereses.
- [x] Cerrar mediante botón, Escape o clic en el fondo, sin cerrar al interactuar con el contenido o arrastrar texto desde dentro.
- [x] Conservar campos del editor al cerrar y ofrecer Continuar edición; el controlador de guardado permanece montado.
- [x] Conservar respuestas pendientes de aclaración por encargo durante la sesión del panel.
- [x] Restaurar foco y scroll, incluidos los detalles abiertos desde un listado en otra ventana.
- [x] Mostrar mensajes de operación dentro del módulo activo.
- [x] Iconos SVG decorativos con etiquetas de texto y sin dependencias externas.
- [x] Mantener los 800 ms posteriores a las peticiones y respetar movimiento reducido.
- [x] Pruebas unitarias del dashboard, formularios, modales, iconos, cierre y conservación de datos; build de producción.

Las tarjetas permanecen en la vista inicial. Los formularios conservan su estado al cerrar las ventanas durante la sesión del panel; cerrar o recargar la aplicación sigue sujeto al guardado del borrador. Los diálogos privados están marcados para ocultar su contenido a herramientas de grabación de interacción.

La verificación realizada es unitaria y de compilación. No sustituye la revisión visual de un navegador autenticado ni la validación pendiente del pipeline de generación real contra servicios externos.
