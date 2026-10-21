# Plan de implementación — Nicolás Zamara

Fuente funcional: `Encargo_Web_Nicolas_Zamara_React_Vite (1).docx`.
Normativa de desarrollo: `AGENTS.md`.

## Estado de esta entrega

La implementación base del frontend está construida. La suite vigente ejecutó **35 pruebas unitarias en 16 archivos: 35 aprobadas**; `npm run build` también finalizó correctamente. Se completaron las rutas, componentes, formularios en modo no disponible, metadatos de cliente, configuración visual y documentación de datos faltantes.

Las casillas que siguen vacías identifican contenido o verificaciones que todavía no se han completado, especialmente revisión manual en dispositivos, confirmaciones del titular y todo lo reservado para la etapa de servicios y lanzamiento. La suite valida unidades con JSDOM; no sustituye esa revisión visual manual. La API, Supabase y la publicación siguen fuera de esta etapa.

El alcance actual es el frontend con React + Vite. Este plan no autoriza publicación. La API Python, Supabase y las integraciones reales se abordarán posteriormente. Las casillas representan trabajo pendiente; se marcarán únicamente después de verificar cada entrega.

## 1. Preparar y verificar el proyecto

- [x] Revisar el estado actual del proyecto y conservar los archivos de requisitos.
- [x] Sincronizar dependencias de Vitest y React Testing Library y actualizar el lockfile (pendiente de acceso al registro npm).
- [x] Verificar que el comando de compilación de producción funciona (`npm run build`).
- [x] Verificar la configuración de Vitest, JSDOM y React Testing Library cuando sea posible instalar las dependencias.
- [x] Añadir comandos para ejecutar pruebas unitarias una vez y en modo observación.
- [x] Documentar requisitos de ejecución y comandos en el README.

## 2. Inventariar contenido y recursos

- [x] Inventariar los documentos históricos disponibles; en esta carpeta no se encontraron capturas ni fotografías originales.
- [x] Identificar fotografías necesarias: portada en consulta, espacio, retrato, curso y naturaleza.
- [x] Registrar recursos faltantes y su estado de confirmación, incluyendo permisos de uso.
- [x] Registrar datos pendientes: WhatsApp, correo, dirección, horarios, duración, accesibilidad, valores y redes.
- [x] Identificar biografía, credenciales, técnicas y contenido del curso que requieren confirmación.
- [x] Mantener pendientes identificables en desarrollo y excluirlos del contenido publicable.
- [x] Definir espacios de imagen de desarrollo sin inventar personas, escenas ni testimonios.

## 3. Definir estructura y contratos

- [ ] Organizar carpetas para páginas, componentes, contextos, hooks, servicios, contenido, estilos globales y recursos.
- [ ] Establecer carpeta propia por componente, con implementación, CSS propio, skeleton y pruebas unitarias Vitest + React Testing Library; probar también el skeleton.
- [ ] Definir contratos de props pequeños y responsabilidades separadas siguiendo SOLID.
- [ ] Centralizar enlaces, contacto, ofertas, textos y estados de disponibilidad en contenido editable.
- [ ] Definir un contexto de contenido/configuración compartida y contenedores que entreguen props a las interfaces.
- [ ] Mantener estado local cuando no exista una necesidad real de compartirlo.
- [ ] Definir contratos de servicios sustituibles para formularios, sin incorporar todavía API Python ni Supabase.
- [ ] Preparar la estructura para futuros artículos sin publicar rutas o secciones vacías.

## 4. Preparar fundamentos visuales y maquetas

- [ ] Definir variables de color: marino `#05234B`, salvia `#698C6D`, fondo `#F7F5F0` y texto `#232B2B`.
- [ ] Definir espaciado, anchos de lectura, tamaños tipográficos, bordes y estados de foco.
- [ ] Elegir como máximo dos familias: serif legible para títulos y sans serif para cuerpo; comprobar licencias.
- [ ] Verificar contraste de texto, botones y estados interactivos.
- [ ] Diseñar maquetas revisables de inicio, consulta y cursos en móvil y escritorio.
- [ ] Incluir navegación, privacidad y estados de formularios en la revisión de diseño.
- [ ] Mantener márgenes amplios, párrafos breves y detalles botánicos discretos; evitar títulos demasiado finos y texto justificado.
- [ ] Revisar las maquetas antes de consolidar las páginas.

## 5. Implementar carga y skeletons compartidos

- [ ] Centralizar el delay base de **800 ms**.
- [ ] Crear lógica reutilizable de carga para unidades independientes, separada de la presentación.
- [ ] Sin servicios externos, mostrar el skeleton inmediatamente y revelar contenido al cumplir 800 ms.
- [ ] Con servicios externos futuros, iniciar la petición inmediatamente y revelar el resultado tras su finalización más 800 ms.
- [ ] Aplicar el mismo contrato a recargas y errores, evitando skeletons indefinidos.
- [ ] Limpiar temporizadores y descartar respuestas obsoletas al desmontar o cambiar de carga.
- [ ] Evitar delays encadenados entre componentes que pertenecen a una misma unidad de carga.
- [ ] Hacer que los skeletons reserven espacio y aparezcan sin delay ni skeleton recursivo.
- [ ] Respetar movimiento reducido en las animaciones.
- [ ] Verificar la lógica mediante pruebas unitarias con temporizadores simulados y servicios mock.

## 6. Construir componentes compartidos

Cada componente de esta fase debe entregarse con CSS, skeleton y pruebas unitarias, conforme a su unidad de carga.

- [x] Implementar marca/firma con enlace al inicio; usar recurso original cuando esté disponible.
- [x] Implementar botones y enlaces con variantes y estados accesibles.
- [x] Implementar contenedores de sección y tarjetas de áreas.
- [x] Implementar imagen adaptable y espacio de imagen pendiente para desarrollo.
- [x] Implementar campos, consentimiento, mensajes de validación y estados de formulario.
- [x] Implementar cabecera y menú: Consulta, Cursos, Naturaleza y Sobre mí.
- [x] Añadir “Consultar una hora” hacia `/consulta`.
- [x] Implementar menú móvil con teclado, foco y atributos de accesibilidad adecuados.
- [x] Implementar pie con firma, contacto y redes confirmados, navegación y privacidad.
- [x] Verificar comportamiento, props e interacciones de cada componente con Vitest + React Testing Library.

## 7. Implementar navegación y metadatos

- [x] Configurar `/`, `/consulta`, `/cursos` y `/privacidad`.
- [x] Implementar navegación a `/#naturaleza` y `/#sobre-mi`, también desde páginas interiores.
- [x] Implementar página no encontrada.
- [x] Definir título, descripción y metadatos sociales por página con contenido revisable.
- [x] Evaluar y documentar una solución de prerenderizado para contenido público y futuros artículos.
- [x] Preparar la configuración necesaria para acceso directo y recarga de rutas en Vercel.
- [x] Añadir pruebas unitarias Vitest + React Testing Library del comportamiento de navegación propio de los componentes.

## 8. Implementar la página de inicio

- [x] Construir presentación con nombre, fotografía real o espacio identificado y descripción breve.
- [x] Añadir “Consultar una hora” hacia `/consulta` y “Explorar cursos” hacia `/cursos`.
- [x] Construir las tres áreas con descripción y enlace: consulta, cursos y naturaleza.
- [x] Construir bloque de consulta centrado en inicio de atención y evaluación individual.
- [x] Construir bloque del curso Flores de Bach para la vida cotidiana con acceso a Hotmart.
- [x] Añadir acceso secundario al registro de interés online.
- [x] Construir “Sobre mí” con Medicina China Integrativa, Flores de Bach y antecedentes confirmados.
- [x] Construir “Naturaleza” con relato sensorial, fotografía propia o espacio pendiente y acceso al registro.
- [x] Integrar cabecera y pie sin ocultar las acciones principales bajo una portada móvil excesiva.
- [x] Completar skeletons y pruebas unitarias de los componentes de la página.

## 9. Implementar la página de consulta

- [x] Presentar la atención y explicar cómo comienza la primera sesión.
- [x] Explicar la evaluación individual antes de enumerar técnicas vigentes.
- [x] Mostrar únicamente técnicas y antecedentes confirmados.
- [x] Incorporar datos prácticos configurables sin inventar valores, horarios ni dirección.
- [x] Construir preguntas frecuentes con respuestas revisables.
- [x] Preparar “Consultar disponibilidad” hacia WhatsApp con número confirmado y mensaje pertinente.
- [x] Si falta el número, mostrar un estado honesto en revisión y evitar enlaces ficticios.
- [x] Explicar que el contacto inicia una conversación; no confirma una reserva ni exige elegir técnica.
- [x] Completar skeletons y pruebas unitarias, incluyendo disponibilidad o ausencia de datos de contacto.

## 10. Implementar la página de cursos

- [x] Presentar propósito, público, alcance y metodología aprobados del curso.
- [x] Explicar uso responsable y respeto por la autonomía de las personas cercanas.
- [x] Evitar presentarlo como certificación Practitioner.
- [x] Añadir “Ver curso e inscripción” hacia `https://nzamara-mtc.hotmart.host/flores-de-bach-vida-cotidiana`.
- [x] Mantener precios, fechas y condiciones comerciales en Hotmart.
- [x] Integrar registro de interés para futura modalidad online hispanohablante, sin prometer fecha.
- [x] Excluir venta y landing de mentoría.
- [x] Completar skeletons y pruebas unitarias de contenido, enlaces y estados.

## 11. Completar naturaleza y registros de interés

- [x] Adaptar el relato autobiográfico de la segunda versión con lenguaje sencillo y sensorial.
- [x] Evitar atribuir certificación, experiencia guiando baños de bosque o resultados clínicos.
- [x] Mostrar únicamente “Quiero recibir información” hasta confirmar actividad, lugar, fecha y condiciones.
- [x] Implementar formulario online: nombre, correo, país y nivel previo opcional.
- [x] Implementar formulario de naturaleza: nombre, correo y ciudad.
- [x] Distinguir el interés en los contratos de datos de ambos formularios.
- [x] Incluir finalidad, consentimiento específico sin preseleccionar y enlace a privacidad.
- [x] Implementar validación, errores claros, reintento y prevención de envíos duplicados durante la carga.
- [x] Mientras falte integración, informar que el envío no está disponible; no mostrar confirmaciones ficticias.
- [x] Reservar la confirmación real para respuestas de persistencia exitosa del servicio futuro.
- [x] Evitar solicitar antecedentes clínicos.
- [x] Completar skeletons y pruebas unitarias con mocks para éxito, error, validación, consentimiento y servicio no configurado.

## 12. Preparar privacidad y medición

- [x] Preparar página de privacidad con estructura para finalidad, responsable, contacto y preferencias.
- [x] Identificar el texto y los datos que necesitan revisión antes de considerarla publicable.
- [x] Definir contratos de eventos para clics a WhatsApp, Hotmart y registros realmente completados.
- [x] Mantener la medición desacoplada de los componentes mediante un adaptador sustituible.
- [x] No enviar nombres, correos, antecedentes clínicos ni otros datos personales a analítica.
- [x] No registrar clics como reservas o ventas ni validaciones locales como registros guardados.
- [x] Probar unitariamente los eventos con mocks, sin activar servicios externos de medición.

## 13. Verificar el frontend y entregar revisión

- [ ] Ejecutar y aprobar la suite de pruebas unitarias Vitest + React Testing Library; no incorporar pruebas automatizadas de integración ni E2E.
- [ ] Generar correctamente la compilación de producción.
- [ ] Revisar manualmente móvil y escritorio: desbordes, texto, contraste y acciones visibles.
- [ ] Revisar manualmente menú, teclado, foco, anclas y enlaces.
- [ ] Verificar acceso directo, recarga y página no encontrada en el entorno disponible; dejar constancia de lo pendiente en alojamiento.
- [ ] Comprobar skeletons, delays y estabilidad del espacio reservado.
- [ ] Revisar que no existan carruseles automáticos, ventanas emergentes ni videos automáticos.
- [ ] Optimizar fotografías disponibles y comprobar dimensiones y textos alternativos.
- [ ] Comprobar metadatos y viabilidad de vistas previas sociales según la solución elegida.
- [ ] Entregar una versión revisable sin conectarla al dominio de producción.
- [ ] Documentar qué funciona, qué está simulado en pruebas y qué depende de servicios o contenido pendientes.
- [ ] Actualizar README, guía de edición y procedimiento de respaldo y recuperación.

## 14. Etapa posterior: servicios y mediciones reales

Esta fase queda fuera del frontend actual. No debe bloquear la revisión visual, pero sí los formularios operativos y cualquier confirmación de guardado real.

- [ ] Definir el servicio receptor de registros y su responsable operativo.
- [ ] Implementar API Python y conexión segura con Supabase según el alcance posterior.
- [ ] Mantener secretos exclusivamente en el servidor e integrar los adaptadores del frontend.
- [ ] Resolver protección contra spam y mecanismo de baja según el servicio elegido.
- [ ] Medir al menos **30 escenarios por consumo externo**, registrando condiciones y resultados reales.
- [ ] Calcular tamaño de muestra, media, mediana, mínimo, máximo, desviación estándar, p90 y p95.
- [ ] Guardar registros y metodología reproducible, sin inventar mediciones.
- [ ] Ajustar la coreografía de regiones independientes con base en resultados, respetando finalización real más 800 ms.
- [ ] Verificar recepción, interés asignado, consentimiento, errores y reintentos reales.
- [ ] Activar medición únicamente cuando exista un destino configurado y revisado.

## 15. Etapa posterior: preparación y aprobación de lanzamiento

- [ ] Obtener fotografías, textos, credenciales y datos comerciales definitivos.
- [ ] Verificar permisos de uso y excluir contenido pendiente de publicación.
- [ ] Comprobar el destino de Hotmart, edición y acceso a compra sin efectuar un pago.
- [ ] Comprobar WhatsApp con datos reales y distinguir contacto de reserva.
- [ ] Completar y revisar privacidad según los servicios finalmente utilizados.
- [ ] Preparar alojamiento en Vercel, rutas, HTTPS y redirección entre dominio raíz y `www`.
- [ ] Bloquear indexación en revisión y preparar la indexación de producción.
- [ ] Confirmar acceso de Nicolás al repositorio y cuentas necesarias.
- [ ] Verificar respaldo externo y procedimiento de recuperación.
- [ ] Presentar la versión final y obtener aprobación expresa para publicar.
- [ ] Publicar únicamente después de la aprobación y comprobar el resultado en el dominio definitivo.

## Criterio transversal de finalización

Una tarea de componente no se considera completa sin CSS propio, skeleton y pruebas unitarias pertinentes. Los tiempos se verifican con temporizadores simulados de Vitest; el DOM y las interacciones, con React Testing Library; los servicios, con mocks unitarios. La revisión manual complementa estas pruebas. Ningún ejemplo de código queda exento de `AGENTS.md`.
