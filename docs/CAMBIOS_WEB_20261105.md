# Actualización pública del 5 de noviembre de 2026

Se incorporaron los textos aprobados de Inicio, Consulta, Naturaleza y Sobre mí; los botones de cursos se actualizaron sin reescribir la descripción de la formación. Consulta presenta primero Villa Vida Natural y después Evaluz, con Maps y WhatsApp codificados. El relato personal y las fotografías se conservaron.

El formulario de consulta exige `attentionLocation`: `villa_vida_natural`, `evaluz` o `guidance`. Python valida el valor y guarda `attention_location`; aparece en la notificación y en el detalle administrativo. El campo es nullable en base para conservar registros históricos y el contrato del chatbot. Se mantiene el origen `form` y la ruta sin parámetros. No se añadió un campo de antecedentes médicos.

Avisos de prueba retirados de formularios públicos y privacidad tras confirmación del usuario sobre recepción de correos. El formulario del chatbot y su aviso no se modificaron, por la exclusión expresa del chatbot. Los consentimientos y las confirmaciones posteriores a guardado y 800 ms siguen vigentes. Ante error se conservan los campos y se ofrece WhatsApp.

Migraciones remotas aplicadas y copiadas en `supabase/migrations`: `20261105172142_interest_attention_location` y `20261105172429_interest_attention_location_insert_permission`. No ejecutar db push indiscriminado: el historial anterior sigue siendo parcial.

Verificación: 371 pruebas frontend en 101 archivos y 200 Python aprobadas; build cliente/SSR y diez rutas con 404 correcto. SQL con fixture bajo rol anon comprobó guardado, notificación encolada con lugar y permisos administrativos; ROLLBACK evitó entregar correos de prueba. La recepción real se considera confirmada por el usuario, no medida por este fixture. Advisors sin WARN/ERROR.

Revisión visual local de cinco páginas a 1440, 390 y 320 px: sin desbordamiento horizontal; Villa Vida Natural primero. Capturas y mediciones en `.preview/public-review/`, fuera del despliegue. No se midieron latencias ni se cambiaron tiempos aproximados. No se modificaron Terapias, los prompts/conocimiento del chatbot ni los presupuestos.
