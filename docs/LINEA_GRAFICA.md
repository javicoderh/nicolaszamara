# Línea gráfica aplicada

Referencia: las seis capturas JPEG de la carpeta `fotos estilo web`, facilitadas por el usuario. Se trasladó la identidad visual a las páginas y formularios de la aplicación actual.

## Tipografía y marca

- Italiana, serif de alto contraste, para títulos; portadas en mayúsculas.
- Poppins para párrafos, navegación, botones y formularios.
- Composición manuscrita provisional con Mrs Saint Delafield para el nombre. Reemplazar por la firma original cuando se entregue.
- Archivos locales en `public/fonts`, con licencias originales. No se solicita una fuente a servicios externos al visitar la web.

Las familias se eligieron por semejanza visual; las capturas no identifican sus nombres exactos.

## Paleta

| Uso | Color |
| --- | --- |
| Marino de cabecera y títulos | `#05234B` |
| Salvia de identidad | `#698C6D` |
| Verde de acciones | `#4D7052` |
| Verde de etiquetas pequeñas | `#36513B` |
| Verde de footer | `#527456` |
| Fondo gris cálido | `#DEDBD9` |
| Secciones gris verdoso | `#C4CDCA` |
| Fondo de formularios | `#E9E7E4` |

Los verdes oscuros de acciones y footer conservan texto blanco legible. Los párrafos se alinean a la izquierda, con separación y ancho de lectura adaptados a móvil.

## Composición

Cabecera de dos niveles: marca blanca centrada sobre marino y navegación debajo. Menú desplegable en móvil. Footer verde, marca a la izquierda, cuatro grupos de enlaces y dibujos de flores y agujas en los extremos inferiores.

Las tres áreas usan ilustraciones lineales en círculos; los bloques alternan texto e imagen rectangular. Las fotografías de las capturas no se recortaron ni se presentaron como originales de la app. Se conservan los espacios de foto pendientes, ahora con la nueva paleta.

Los dibujos SVG son decoración creada en código y quedan fuera del árbol de accesibilidad. Los skeletons conservan su CSS y adaptan color, proporciones y composición. Se eliminó la duplicación de cabecera y footer en el skeleton de inicio.

Las ilustraciones del footer se refinaron como grabados blancos sobre fondo transparente: amapolas con pétalos superpuestos, nervaduras, estambres, hojas divididas y un capullo inclinado; tres agujas de acupuntura con anilla, mango de alambre enrollado, cuello y cuerpo largo terminado en punta. En móvil, una franja inferior reserva espacio para los dibujos sin superponerlos al copyright.

El cambio visual mantiene los formularios, la API, los permisos de Supabase y la regla de respuesta más 800 ms. No añade servicios de datos ni modifica el contenido del curso para ofrecer la certificación que aparece en la web histórica.

## Revisión realizada

Las 47 pruebas unitarias de React y la compilación de producción pasaron. Se revisaron capturas del navegador en escritorio (1440 px), móvil (390 px), menú abierto, footer, cursos, consulta y privacidad a 320 px. Las fuentes locales cargaron correctamente y la última revisión no mostró desbordes horizontales. Las capturas de revisión son artefactos locales excluidos de Git en `.preview`.

Se calcularon los contrastes de los pares principales: párrafos, etiquetas, botones, mensajes de prueba y footer. Se conserva un tono más oscuro para texto pequeño y variantes verdes oscuras para botones y fondo del pie.
