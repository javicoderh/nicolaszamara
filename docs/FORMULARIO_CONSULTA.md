# Interés en consulta

La ruta `/consulta` incluye `InterestForm` con el tipo `consultation`: nombre, correo, teléfono internacional, preferencia de contacto y consentimiento. No solicita antecedentes clínicos ni confirma automáticamente una hora. Se reutilizan el skeleton y el ciclo de petición más 800 ms; los errores conservan los campos.

`backend/interests.py` valida el nuevo tipo y guarda con el origen `form` y la ruta `/consulta`. La ampliación de la restricción existente se conserva en `database/interest_consultation_form.sql`, aplicada en Supabase como `allow_consultation_interest_form`. No cambia permisos ni políticas de acceso.

El WhatsApp configurado en `src/content/siteContent.js` es `+56953961219`; el botón abre `https://wa.me/56953961219` con un mensaje para consultar disponibilidad.

Se mantienen el aviso de versión de pruebas y los pendientes de privacidad de `CONTENT_STATUS.md`. No se han medido 30 escenarios reales del nuevo formulario ni se han enviado contactos reales para comprobarlo. Las verificaciones unitarias usan servicios simulados.
