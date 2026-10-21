# Línea gráfica aplicada

Referencia: las seis capturas JPEG de la carpeta `fotos estilo web`, facilitadas por el usuario. Se trasladó la identidad visual a las páginas y formularios de la aplicación actual.

## Tipografía y marca

- Italiana, serif de alto contraste, para títulos; portadas en mayúsculas.
- Poppins para párrafos, navegación, botones y formularios.
- Firma original del archivo `logo.jpeg` entregado por el usuario, aplicada en cabecera y footer mediante `public/brand/nicolas-zamara-logo.svg`. Se conservan las letras exactas, con un viewport que aísla el nombre y un filtro SVG que elimina el fondo azul y mantiene las letras blancas sobre cualquier fondo. El lema de la imagen queda fuera del recorte solicitado.
- Archivos locales en `public/fonts`, con licencias originales. No se solicita una fuente a servicios externos al visitar la web.

Italiana y Poppins se eligieron por semejanza visual; las capturas no identifican sus nombres exactos. La firma no depende de una fuente aproximada: reproduce el logo facilitado. Se retiró la carga de Mrs Saint Delafield.

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

Las decoraciones SVG quedan fuera del árbol de accesibilidad. Las agujas se dibujan en código; las flores conservan el grabado de la captura facilitada. Los skeletons conservan su CSS y adaptan color, proporciones y composición. Se eliminó la duplicación de cabecera y footer en el skeleton de inicio.

Las flores del footer reutilizan el dibujo exacto de `WhatsApp Image 2026-10-21 at 13.52.21 (2).jpeg`: la imagen original está embebida en `poppy-line.svg`, con un viewport que muestra solo el grabado y un filtro SVG que convierte el verde en transparencia y conserva los rellenos blancos. No se redibujan ni se regeneran sus pétalos. La resolución queda limitada por la captura; un archivo original permitiría mayor nitidez. Las tres agujas mantienen anilla, mango de alambre enrollado, cuello y cuerpo largo terminado en punta. En móvil, una franja inferior reserva espacio para los dibujos sin superponerlos al copyright.

El cambio visual mantiene los formularios, la API, los permisos de Supabase y la regla de respuesta más 800 ms. No añade servicios de datos ni modifica el contenido del curso para ofrecer la certificación que aparece en la web histórica.

## Revisión realizada

Las 47 pruebas unitarias de React y la compilación de producción pasaron. Se revisaron capturas del navegador en escritorio (1440 px), móvil (390 px), menú abierto, footer, cursos, consulta y privacidad a 320 px. Las fuentes locales cargaron correctamente y la última revisión no mostró desbordes horizontales. Las capturas de revisión son artefactos locales excluidos de Git en `.preview`.

Se calcularon los contrastes de los pares principales: párrafos, etiquetas, botones, mensajes de prueba y footer. Se conserva un tono más oscuro para texto pequeño y variantes verdes oscuras para botones y fondo del pie.
