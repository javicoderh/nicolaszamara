# Contenido y recursos pendientes de confirmación

Esta lista acompaña la versión frontend de revisión. Los valores vacíos en `src/content/siteContent.js` son intencionales: no se inventaron datos y no deben publicarse como información confirmada.

## Contacto y consulta

- [ ] Número de WhatsApp y texto de contacto.
- [ ] Correo de contacto.
- [ ] Dirección o modalidad de atención.
- [ ] Horarios, duración, accesibilidad y valores vigentes.
- [ ] Técnicas actualmente disponibles y preguntas frecuentes aprobadas.
- [ ] Perfiles de redes sociales que se mostrarán en el pie de página.

## Identidad y biografía

- [x] Firma manuscrita Nicolás Zamara recibida en `logo.jpeg` e incorporada en cabecera y footer con letras blancas y fondo transparente.
- La identidad visual ya está adaptada a las seis capturas de referencia. La marca utiliza una composición manuscrita provisional y las imágenes pendientes mantienen sus etiquetas; las fotografías de las capturas no se reutilizaron como originales.
- [ ] Retrato autorizado en consulta y fotografías originales del espacio.
- [ ] Retrato y credenciales exactas que se pueden publicar.
- [ ] Revisión del texto biográfico y del relato sobre naturaleza.
- [ ] Confirmación de autoría, permisos de uso y autorizaciones para cualquier persona identificable en fotografías.

## Cursos

- [ ] Fotografía original del curso o de sus materiales y permiso de uso.
- [ ] Confirmación del texto sobre propósito, público, alcance y metodología.
- [ ] Verificar destino, edición, fechas, precio, condiciones y proceso de inscripción de Hotmart antes del lanzamiento.
- [ ] No duplicar en la web fechas, precios ni condiciones comerciales que deban mantenerse en Hotmart.

## Naturaleza y privacidad

- [ ] Fotografías propias autorizadas de Conguillío, Huerquehue, bosques, montañas o ríos.
- [ ] Definir actividad, lugar, recorrido, fechas, cupos, valor, accesibilidad, exigencia física, equipamiento, clima, cancelaciones y responsabilidades antes de abrir una convocatoria de baños de bosque.
- [ ] Confirmar si la primera convocatoria guiada se presenta como tal.
- [ ] Definir responsable legal, canal de contacto, finalidad, conservación, servicio receptor, mecanismo para retirar autorización y demás términos de privacidad.
- [ ] Revisar y aprobar la página de privacidad antes de activar registros.

## Estado funcional del frontend

- Los formularios de interés validan datos en el navegador, distinguen el interés y dejan sin marcar la autorización para novedades.
- La API Python recibe ambos formularios y guarda en Supabase. La interfaz confirma éxito solo después de HTTP 201 y de los 800 ms adicionales; ante un error conserva los campos para reintentar.
- La versión de revisión indica usar datos ficticios mientras se confirman el responsable, la conservación y el canal de solicitudes de privacidad. No envía correos ni suscribe automáticamente a listas.
- No se solicita información clínica.
- El evento de analítica está limitado a nombres de eventos permitidos y no incluye datos personales; aún no hay proveedor de analítica configurado.
- La portada, `/consulta`, `/cursos`, `/privacidad` y la vista 404 tienen contenido de revisión; la página de privacidad es un borrador.
- No se dispone de fotografías originales en el repositorio. Los espacios temporales identifican expresamente los recursos pendientes.
- El enlace de Hotmart procede del encargo y requiere verificación manual antes de publicar.
