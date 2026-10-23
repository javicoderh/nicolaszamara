# Setter conversacional y catálogo revisado

Actualización 23-10-2026: el contrato vigente añade `reply` al JSON de decisión. La respuesta se redacta usando hechos verificados e historial; el servidor conserva acciones, enlaces, cuotas, consentimiento y textos de límites. La inscripción al curso presencial u online utiliza `show_hotmart` y muestra un enlace clickeable dentro de la respuesta, desde `siteSettings.courseUrl`. La opción pública de proponer correcciones está retirada; el [flujo de revisión](../../docs/APRENDIZAJE_CHATBOT.md) se conserva como referencia histórica.

El documento que sigue conserva el diseño inicial del selector de cuatro campos como referencia histórica; no describe el renderer conversacional actual.

---

# Configuración redactada para el setter

Estado: **implementado en el código y conectado al backend**. `backend/setter_config.py` carga política, esquema, textos y prompts. Las cuotas y la captura usan las RPC de Supabase. La activación de llamadas reales requiere las variables de `.env.example`; no se cambió el modelo predeterminado ni se verificó equivalencia entre modelos. Detalle y verificaciones en `docs/IMPLEMENTACION_SETTER.md`.

## Para implementar con Luna

Abre `prompts/implementar-con-luna.md` y úsalo como encargo junto con la fase que quieras implementar. Ejemplo de solicitud al agente:

> Lee AGENTS.md, docs/PLAN_MEJORA_CHATBOT.md y config/chatbot/README.md. Sigue config/chatbot/prompts/implementar-con-luna.md e implementa la fase 1. Conserva las decisiones de captación, cierre de 10 rondas y Hotmart. Verifica el contrato y las pruebas correspondientes antes de marcar pasos completos.

Ese encargo es para Luna como agente de desarrollo. Los prompts del selector son para el modelo que posteriormente ejecutará el setter. Usar Luna para implementar no cambia por sí mismo el modelo de la API.

Si también se elige Luna como modelo del setter, confirmar primero el identificador API exacto, disponibilidad, soporte del esquema y parámetros de esa versión. Por eso `model.api_model_id` está vacío y el modelo actual no se sustituye automáticamente por una etiqueta comercial.

## Archivos y responsabilidades

| Archivo | Uso |
| --- | --- |
| `setter.config.json` | Política versionada, rutas permitidas, combinaciones válidas y esquema de decisión. |
| `responses.es.json` | Textos predeterminados para orientación, captura y cierre; requieren revisión editorial antes de activarse. |
| `prompts/selector.system.md` | Identidad, objetivo y límites del selector. |
| `prompts/selector.developer.md` | Prioridades, desambiguación, contexto y ejemplos de entrada/salida. |
| `prompts/captura-contacto.md` | Guion determinista local del formulario de contacto; no se envía al modelo. |
| `prompts/implementar-con-luna.md` | Encargo de implementación por fases para el agente de desarrollo. |
| `decision-cases.json` | 32 casos de decisión y 9 de autorización previa, con resultados esperados aún no medidos en Luna ni en Sol. |

## Contrato previsto del selector

Salida única:

```json
{
  "topic": "course",
  "response_key": "hotmart_link",
  "action": "show_hotmart",
  "contact_signal": "none"
}
```

contact_signal permite respetar una negativa a dejar datos incluso cuando la accion principal es mostrar Hotmart. Es una senal de intencion, no la autorizacion de tratamiento de datos. none conserva la eleccion anterior.

El esquema estructurado limita las claves y sus valores. El backend también debe comprobar la combinación en `decisions` y la lista de acciones permitidas para esa petición. Un JSON válido todavía puede contener una decisión equivocada.

El renderer obtiene el texto desde `responses.es.json`. Para Hotmart resuelve la URL desde `siteSettings.courseUrl`, cuya fuente actual es `src/content/siteContent.js`. El modelo nunca escribe la URL. Mantener una fuente compartida para la web y el catálogo entregado al servidor al implementar el cargador.

`backend/chatbot.py` consume este contrato de cuatro campos. Valida esquema, combinación y preferencia de contacto; renderiza textos aprobados y devuelve la decisión con estado persistente. `chatbotService.js` conserva los metadatos. Los límites y el consentimiento siguen fuera del modelo.

## Construcción del contexto

1. Autorizar identidad, cuotas y presupuesto en el servidor antes de llamar al modelo.
2. Comprobar si la acción corresponde a captura local, recuperación idempotente o cierre; esos casos se resuelven sin llamar al modelo.
3. Cargar las instrucciones estáticas del sistema y del desarrollador como instrucciones de confianza.
4. Añadir el contexto preparado por el servidor, separado de los mensajes del visitante. Cada campo de `trusted_context_fields` lo construye el backend, no se copia desde declaraciones del navegador.
5. Enviar el texto del usuario y el historial reducido como datos sin permisos para cambiar política, consentimientos o hechos operativos.
6. Validar el resultado y ejecutar solo la acción implementada y permitida. No repetir automáticamente una llamada para arreglar una salida inválida.

Los datos de los controles de contacto no entran en ese historial. Durante la captura se usan los textos locales y el pipeline de intereses, con validación del servidor y autorización explícita.

Los documentos RAG futuros se tratan como evidencia no confiable hasta validar su procedencia; no reemplazan las instrucciones ni las reglas de cuota. Este borrador no añade recuperación RAG.

## Reglas ya trasladadas del plan

- 10 respuestas completadas; orientación al siguiente paso desde la respuesta 8.
- Máximo de 12 intentos facturables por conversación; reintentos idempotentes y cuotas diarias según la política.
- Captura independiente de nombre, servicio y preferencia teléfono/WhatsApp/correo; solo el dato necesario.
- Persistencia de prospectos en la misma `public.interest_registrations`, mediante ampliación compatible del pipeline.
- Hotmart como siguiente paso directo para inscripción actual, con contacto opcional.
- Captura y enlaces disponibles tras el cierre o sin clave del modelo.
- Ninguna confirmación de pago, inscripción, reserva o registro por decisión del selector.
- Petición real más 800 ms en cada unidad de carga, incluidos errores.
- Precios, fechas, horarios, credenciales y disponibilidad solo desde información aprobada.

## Conservación de calidad al usar Luna

Los prompts trasladan decisiones explícitas que, de otro modo, el modelo tendría que deducir. Eso reduce ambigüedad, pero **no garantiza que Luna tenga la misma capacidad de inferencia que Sol**.

El criterio útil es si obtiene las decisiones correctas para este trabajo. La configuración separa el vocabulario de salida, los textos aprobados, las reglas de autorización y los casos difíciles para poder comprobarlo.

Checklist previo a activar un cambio de modelo:

- [ ] Confirmar los identificadores exactos y parámetros admitidos de ambos modelos. No asumir que una etiqueta tiene el mismo identificador en Codex y en la API.
- [ ] Validar configuración, referencias, plantillas y combinaciones antes de hacer llamadas reales.
- [ ] Ejecutar los mismos casos de decisión con el mismo contexto, prompts y esquema en Luna y en Sol cuando exista acceso al proveedor.
- [ ] Comparar cada resultado con su expectativa aprobada, no únicamente contra la respuesta de Sol.
- [ ] Comprobar los 9 casos de autorización con mocks del controlador: nunca hace falta gastar una llamada para comprobar que el proveedor no se invoca.
- [ ] Registrar exactitud por categoría, desacuerdos, fallos críticos, tokens, costo y latencia.
- [ ] Exigir cero fallos críticos y todos los casos de referencia resueltos antes de activar; añadir frases nuevas y variaciones como conjunto reservado para evitar optimizar solo los ejemplos.
- [ ] Revisar discrepancias con criterio de negocio. Si una decisión sigue siendo ambigua, usar la aclaración prevista; no forzar una inferencia de consentimiento o compra.
- [ ] No afirmar equivalencia con Sol hasta disponer de resultados comparables. Si la calidad no alcanza el umbral, conservar el modelo validado y ajustar la tarea o los ejemplos.

Los 41 casos siguen siendo **especificaciones de comportamiento**, sin mediciones reales de calidad de modelos. Las pruebas unitarias comprueban las 32 combinaciones esperadas y el rechazo previo del controlador; no demuestran que un modelo elija correctamente ante texto real. Sus campos de resultados medidos permanecen vacíos.

## Presupuesto y activación

Enviar únicamente los prompts del selector y el contexto necesario. No adjuntar el encargo de implementación, el guion de captura, el archivo completo de casos, todas las respuestas ni todo el plan a cada llamada.

Los ejemplos del prompt están elegidos para desambiguar intención. Su extensión añade tokens respecto del prompt actual: volver a medir costo y latencia antes de reutilizar la estimación anterior de CLP por conversación. No cambiar el presupuesto de salida ni los parámetros de razonamiento de una versión de modelo por copiar configuraciones de otra.

`active` ahora es leído por el backend y permite deshabilitar nuevos intentos del selector sin retirar enlaces, recuperación ni captura. Está habilitado en el contrato; sin identidad firmada, almacenamiento autorizado, clave y presupuesto configurados no se autoriza una llamada. Cambiarlo requiere reiniciar o desplegar el backend, que carga el catálogo al iniciar.

## Documentación oficial consultada

La skill OpenAI Docs y estas fuentes orientan la estructura de los prompts y la validación:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering): instrucciones explícitas, ejemplos y contexto.
- [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses): esquema de salida y límites de la corrección semántica.
- [Model selection](https://developers.openai.com/api/docs/guides/model-selection): selección mediante resultados del caso de uso; capacidades y disponibilidad dependen del producto y versión.

No hay una garantía documental de que un prompt convierta la capacidad de Luna en la de Sol.
