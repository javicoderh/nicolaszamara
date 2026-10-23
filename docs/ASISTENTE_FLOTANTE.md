# Asistente global

El asistente se monta una vez en `App`, fuera de las cargas de cada ruta. Usa un portal de React hacia `document.body` para evitar recortes por contenedores. El botón queda fijo en la esquina inferior derecha y abre un modal lateral pegado al borde derecho, con un fondo atenuado. La vista `/chatbot` comparte la conversación y suprime el modal mientras está visible.

`ChatbotContext` mantiene mensajes, borrador, operación pendiente y estado de apertura en memoria. Los enlaces internos conocidos usan History API; los clics modificados, descargas, enlaces externos y destinos en otra pestaña conservan su comportamiento nativo. Minimizar mantiene montado y oculto el panel, incluido el formulario de contacto. Una recarga completa vuelve a solicitar `refresh` al abrir el asistente. No se escriben conversaciones en almacenamiento persistente del navegador.

El botón aparece cerrado tras los 800 ms de carga inicial y no solicita sesión hasta abrirlo. Las peticiones mantienen su espera real más 800 ms. Cambiar de ruta, minimizar o ampliar no solicita otra renovación ni cancela una respuesta pendiente. La lógica de presupuesto, contacto y enlaces de Hotmart permanece en los servicios existentes.

Al inicio de cada página solo se ve el icono del botón. La etiqueta «Conversemos» tiene opacidad 0 y aparece suavemente después de bajar más de 64 px; vuelve a ocultarse al regresar arriba. La etiqueta oculta no intercepta clics sobre la fotografía y el icono mantiene su nombre accesible y su funcionamiento.

La estética combina la tipografía y paleta de la web con bordes geométricos, líneas verde salvia y un brillo discreto. El panel ocupa la altura visible y se adapta a `visualViewport` cuando aparece el teclado, con `100dvh` como respaldo. No abre el teclado automáticamente. No muestra barras de desplazamiento; la conversación, los enlaces y el formulario conservan su scroll táctil, con rueda y teclado.

El modal entra desde la derecha con fade in y sale con fade out durante 240 ms. La salida mantiene el panel montado y el fondo bloqueado hasta terminar. Escape, el botón de cierre y un clic en el fondo cierran sin borrar la conversación. El foco queda contenido en el modal y vuelve al botón al cerrarlo; se restauran los estilos de scroll y el estado `inert` anteriores. La preferencia de movimiento reducido elimina las animaciones y la espera de cierre. Estos tiempos son de transición visual, independientes de los 800 ms de carga de datos.

Las pruebas unitarias usan Vitest, React Testing Library, temporizadores simulados y APIs sustituidas. Cubren portal, apertura, espera, error, mensajes, Hotmart, borradores, formulario al minimizar, navegación, vista amplia, desmontaje, StrictMode y cambios de viewport. La revisión visual usa datos simulados, no conversaciones reales ni registros de intereses. No se han medido 30 escenarios de latencia; este rediseño no modifica los tiempos ni incorpora estimaciones de servicios externos.
