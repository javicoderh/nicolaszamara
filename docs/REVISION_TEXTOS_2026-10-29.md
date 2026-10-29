# Revisión de textos — 29 de octubre de 2026

Se aplicó el contenido entregado para Inicio, consulta, curso y formularios. Los textos que ya coincidían se conservaron. Se añadieron las etiquetas «Consulta y terapias» y «Naturaleza y bienestar», se actualizó el enlace «Me interesa la modalidad online» y se sustituyeron título, descripción y confirmación del formulario online.

La edición online se presenta como futura, sin fecha ni inscripción confirmadas. El asistente enlaza a `/cursos#interes-online`; el servidor corrige también decisiones antiguas de inscripción online. El curso actual conserva Hotmart. Este criterio sustituye las indicaciones anteriores de inscripción directa para ambas modalidades en `APRENDIZAJE_CHATBOT.md` y en la configuración histórica del setter. No se realizaron llamadas reales al modelo para esta revisión.

Los formularios conservan campos, validaciones, consentimientos y sus ciclos de carga. La confirmación sigue requiriendo guardado correcto más 800 ms; los errores conservan los campos. Se restauró el aviso de versión de pruebas y uso de datos ficticios en ambos tipos de formulario y en privacidad. Debe revisarse junto con los pendientes de `CONTENT_STATUS.md` antes del lanzamiento definitivo.

La revisión visual se realiza sobre el servidor local; las capturas quedan en `.preview`, fuera de Git. No se incluyen pruebas de integración ni E2E ni se modifica el dominio definitivo.

## Verificación de la entrega

- Vitest y React Testing Library: 146 pruebas aprobadas en 39 archivos, con `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --testTimeout=20000`. Las primeras ejecuciones agotaron el tiempo de inicio de workers y el límite de 5 segundos de una prueba de navegación; la ejecución completa indicada terminó sin fallos. Los 800 ms de carga siguen comprobándose con temporizadores simulados.
- Python: 74 pruebas unitarias aprobadas con servicios simulados.
- Compilación local y compilación de Vercel aprobadas; `git diff --check` sin errores.
- Inicio y cursos revisados a 320, 390 y 1440 px, sin desbordes horizontales. Capturas locales `texts-home-*` y `texts-courses-*` en `.preview`.
- Preview listo: https://nicolaszamara-7vsf5wn4v-my-team-d5e0a31d.vercel.app. `/cursos` devuelve HTTP 200 usando la sesión autorizada de Vercel. El Preview requiere autenticación de Vercel; no se cambió el dominio definitivo.
