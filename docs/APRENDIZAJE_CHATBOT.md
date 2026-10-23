# Correcciones y ejemplos revisados (archivo histórico)

**Estado actual:** la opción «Sugerir una mejor respuesta» fue retirada de la interfaz y su endpoint devuelve HTTP 410 sin guardar nuevas propuestas. Los registros y ejemplos históricos se conservan privados. El procedimiento siguiente documenta la implementación anterior.

La página `/chatbot` ofrece **Sugerir una mejor respuesta** debajo de cada respuesta real (no de la bienvenida). Permite completar:

- Motivo: no respondió, falta información, perdió la conversación o información incorrecta.
- Pregunta o caso que faltó, escrito expresamente por la persona.
- Respuesta propuesta y comentario opcional.
- Autorización independiente para guardar ese caso y la respuesta señalada.

No se copia el historial ni se solicitan datos personales. La respuesta original se recupera en el servidor verificando que el intento completado pertenece a la cookie del visitante y a esa conversación. Un visitante no puede aprobar propuestas, consultar las ajenas ni enviar un historial como feedback. Cada respuesta admite una propuesta; reintentar el mismo guardado es idempotente. Hay un máximo de 20 propuestas por visitante y día de Santiago.

## Dónde revisar

En el SQL Editor del proyecto Supabase, con permisos administrativos:

```sql
select id, category, question, actual_reply, suggestion, comment, created_at
from private.setter_feedback
where status = 'pending'
order by created_at;
```

Revisar pertinencia, exactitud, ausencia de datos personales, afirmaciones clínicas e instrucciones ajenas al caso. La sugerencia no se aprueba automáticamente. Preparar un JSON con el ejemplo corregido, por ejemplo:

```json
{
  "question": "¿Puedo aprender Flores de Bach sin conocimientos previos?",
  "answer": "Sí, el curso está pensado también para quienes comienzan. Trabaja con ejemplos cotidianos y práctica guiada para reconocer estados emocionales y comprender el método original de Bach.",
  "topic": "course"
}
```

Desde la raíz del proyecto, aprobar una propuesta con el ejemplo revisado:

```powershell
.\.venv\Scripts\python scripts/review_chatbot_feedback.py --id UUID_DE_LA_PROPUESTA --reviewer "Nombre del revisor" --approve-file ejemplo-revisado.json
```

O rechazarla:

```powershell
.\.venv\Scripts\python scripts/review_chatbot_feedback.py --id UUID_DE_LA_PROPUESTA --reviewer "Nombre del revisor" --reject
```

La revisión usa la clave privada del servidor; no existe una ruta pública de aprobación. `private.setter_examples` guarda el ejemplo, revisor, fecha y estado habilitado. Para retirar un ejemplo aprobado, cambiar `enabled` a `false` en esa tabla con permisos administrativos. No hace falta reiniciar el backend para agregar o retirar ejemplos.

## Cómo se utilizan

Cada llamada puede incorporar hasta ocho ejemplos aprobados habilitados, ordenados por fecha de revisión, junto con los hechos de `config/chatbot/knowledge.es.json`. Las propuestas pendientes o rechazadas nunca se incluyen. Si la lectura opcional de ejemplos falla, el chat conserva su catálogo base; la escritura de una propuesta solo se confirma tras persistirla.

Esto es enriquecimiento del contexto, no entrenamiento de los pesos del modelo. El límite inicial de ocho ejemplos mantiene acotado el contexto; cuando crezca el catálogo habrá que medir y añadir recuperación por relevancia. Los ejemplos orientan estilo y casos, no sustituyen información verificada, controles de cuota ni consentimiento.

## Conversación

La voz del asistente es institucional y colectiva: «podemos orientarte», «nuestro curso», «ofrecemos», «te contactaremos». No presenta a Nicolás como un tercero externo. Los prompts, hechos del catálogo, bienvenida y textos protegidos usan ese criterio; los ejemplos históricos revisados se adaptan a esa voz. El formulario mantiene la identificación del responsable en la autorización legal.

En `/chatbot`, la bienvenida se presenta una sola vez como título, seguida de conversación y campo de escritura. La navegación predeterminada está debajo del campo en una fila, con desplazamiento horizontal en pantallas estrechas. Los controles de recuperación aparecen cuando hacen falta. La corrección de respuestas sigue disponible dentro de cada turno.

El contrato ahora exige `reply`, una respuesta de hasta 700 caracteres además de `topic`, `response_key`, `action` y `contact_signal`. El historial reciente y la respuesta anterior permiten continuar una conversación. Las URLs y acciones siguen procediendo del catálogo; las respuestas de límites clínicos, urgencia, pagos, privacidad, despedida y fuera de alcance conservan texto protegido. El esquema valida estructura, no garantiza exactitud factual: las pruebas manuales y la revisión siguen siendo necesarias.

El límite predeterminado de salida pasa a 512 tokens; se incluye en la reserva conservadora del presupuesto. Se mantienen modelo configurado, presupuesto diario de USD 3, diez respuestas, captura separada y espera de petición más 800 ms. No se han medido de nuevo 30 escenarios de latencia por consumo, ni se han inventado estadísticas.

Fuentes del cambio: [Structured Outputs de OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs), [descripción del sistema Bach](https://bachcentre.com/en/remedies/the-38-remedies/) y contenidos publicados en `src/content/siteContent.js`. La descripción del método no implica una afirmación de eficacia clínica.

## Explicación del método y orientación individual

Las preguntas generales sobre qué flores asocia Bach al miedo o la ansiedad son educativas y deben recibir una explicación de las asociaciones documentadas, aunque utilicen la palabra «sirven». Pueden nombrarse y compararse Mimulus, Aspen, Rock Rose, Red Chestnut y White Chestnut; sus fuentes individuales están registradas en `knowledge.es.json`.

El encuadre «según el método de Bach» permite explicar la propuesta sin prometer efectos clínicos. No se añade una negativa ni un descargo automático a cada explicación. Pedir una fórmula individual, dosis, cambios de medicación o una indicación para una condición diagnosticada conserva la respuesta de límite y la posibilidad de solicitar una consulta. Mencionar pánico como parte de una descripción tradicional no equivale a estar sufriendo una urgencia.

`config/chatbot/education-cases.json` especifica cinco casos de regresión. Las pruebas unitarias verifican el catálogo disponible y el tratamiento de las decisiones; no demuestran por sí solas qué decisión elegirá el modelo. Las verificaciones manuales de clasificación se registran por separado.
