# Flujo de conversación test 2 — 2026-10-23

Modelo solicitado: **gpt-6-luna**, esfuerzo **high**.
Estado: **COMPLETADO CON INCIDENCIA DE PERSISTENCIA Y RECUPERACION EXPLICITA**. Inicio UTC: `2026-10-23T17:59:31.359736+00:00`.
Preview aislado: https://nicolaszamara-korwcwqqi-my-team-d5e0a31d.vercel.app.

## Alcance y configuración

Prueba E2E HTTP real del pipeline de la app: sesión/cookie → API Python → autorización atómica en Supabase → OpenAI Responses → validación → plantilla y acción → cierre. No utiliza mocks ni una llamada directa al modelo para simular el chat. No automatiza el DOM, los tooltips ni mide el tiempo de revelado de React.
La solicitud explícita del usuario autoriza estas dos pruebas reales como excepción puntual a la política general de unitarias de AGENTS.md.
Se usa el mismo guion de diez mensajes, una identidad independiente por caso y el mismo contrato del frontend de hasta 12 mensajes de contexto.
Solo estos Previews configuran `reasoning.effort=low/high`, `max_output_tokens=25000`, plazo de OpenAI de 25 s y métricas habilitadas. El valor normal de la app sigue siendo 256 tokens, 15 s y sin cambio del modelo público. El margen mayor incluye razonamiento, evita truncarlo artificialmente y está incorporado en la reserva de presupuesto.
El presupuesto global autorizado sigue siendo US$3/día. Las reservas conservadoras no son el costo facturado de los tokens.

## Tarifas y conversión

Tarifas estándar por millón de tokens: entrada US$0.10; entrada en caché US$0.01; escritura explícita de caché US$0.125; salida US$0.50.
Fuente: [OpenAI, GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), consultada 2026-10-23.
Conversión: **1 USD = 986.58 CLP**, dólar observado del 2026-10-23. [Banco Central](https://si3.bcentral.cl/indicadoressiete/secure/indicadoresdiarios.aspx).
Costo USD = (entrada no cacheada × tarifa entrada + lectura caché × tarifa caché + escritura caché × tarifa escritura + salida × tarifa salida) / 1.000.000. Los tokens de razonamiento ya forman parte de salida: no se cobran dos veces.
Son costos calculados a partir de usage real y tarifas publicadas, no una factura liquidada. No incluyen impuestos, comisión/tipo de cambio de tarjeta, Vercel ni Supabase. La duración incluye la CLI, autenticación/protección de Vercel y red; no es latencia pura de OpenAI.

## Consumo por ronda

| Ronda | HTTP / resultado | Entrada | Lectura caché | Escritura caché | Salida | Razonamiento (incluido) | Tokens totales | USD | CLP | Duración ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 200 / completed | 2591 | 2588 | 0 | 87 | 53 | 2678 | 0.000069680 | 0.068745 | 11722.67 |
| 2 | 200 / completed | 2648 | 2541 | 104 | 70 | 36 | 2718 | 0.000073710 | 0.072721 | 12358.51 |
| 3 | 200 / completed | 2700 | 2645 | 52 | 81 | 46 | 2781 | 0.000073750 | 0.072760 | 12048.74 |
| 4 | 200 / completed | 2749 | 2542 | 204 | 79 | 44 | 2828 | 0.000090720 | 0.089503 | 10482.77 |
| 5 | 200 / completed | 2794 | 2542 | 249 | 71 | 35 | 2865 | 0.000092345 | 0.091106 | 17770.27 |
| 6 | 200 / completed | 2837 | 2791 | 43 | 199 | 164 | 3036 | 0.000133085 | 0.131299 | 14129.68 |
| 7 | 200 / completed | 2846 | 2541 | 302 | 135 | 94 | 2981 | 0.000130960 | 0.129203 | 10309.19 |
| 8 | 200 / completed (+1 intento fallido) | 5714 | 5400 | 308 | 368 | 292 | 6082 | 0.000277100 | 0.273381 | 31962.1 |
| 9 | 200 / completed | 2859 | 2544 | 312 | 132 | 97 | 2991 | 0.000130740 | 0.128985 | 11285.59 |
| 10 | 200 / completed | 2850 | 2541 | 306 | 92 | 56 | 2942 | 0.000109960 | 0.108484 | 11004.54 |

## Total de la interacción

- Pasos de conversación: 10/10; respuestas entregadas: 10; intentos de proveedor contabilizados: 11.
- Tokens medidos: entrada **30588**, salida **1314**, total **31902**.
- Subconjuntos incluidos en los totales: **917** tokens de razonamiento en salida; **28675** de lectura de caché y **1880** de escritura de caché en entrada. No se suman otra vez al total.
- Costo total calculado: **US$0.001182050 / CLP $1.166187**.
- Intentos con usage y costo determinables: 11/11. `N/D` significa no medido; no equivale a costo cero.

## Conversación registrada

### Paso 1

**Visitante:** Hola, quiero información sobre el curso Flores de Bach para la vida cotidiana.

**Asistente:** Puedes conocer la propuesta de Flores de Bach para la vida cotidiana en la página de cursos. Si quieres inscribirte al curso actual, puedo mostrarte su enlace.

Decisión: `course` / `show_course`. Contadores: 1 respuestas, 1 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 2

**Visitante:** ¿Qué propuesta tiene ese curso? Busco información general para aprender.

**Asistente:** Puedes conocer la propuesta de Flores de Bach para la vida cotidiana en la página de cursos. Si quieres inscribirte al curso actual, puedo mostrarte su enlace.

Decisión: `course` / `show_course`. Contadores: 2 respuestas, 2 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 3

**Visitante:** ¿La futura modalidad online ya está abierta?

**Asistente:** Puedes registrar tu interés para recibir información cuando se abra una edición online. La web todavía no confirma su apertura.

Decisión: `online` / `show_online_interest`. Contadores: 3 respuestas, 3 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 4

**Visitante:** Prefiero volver al curso actual. ¿Dónde puedo revisar su precio y condiciones?

**Asistente:** Puedes revisar el precio y las condiciones vigentes del curso actual en su página de inscripción en Hotmart.

Decisión: `course` / `show_hotmart`. Contadores: 4 respuestas, 4 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 5

**Visitante:** ¿Puedes mostrarme el enlace para inscribirme al curso actual?

**Asistente:** Aquí tienes el enlace para conocer el curso actual y continuar con la inscripción en Hotmart.

Decisión: `course` / `show_hotmart`. Contadores: 5 respuestas, 5 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 6

**Visitante:** No quiero dejar mis datos por ahora, solo seguir leyendo información del curso.

**Asistente:** Puedes conocer la propuesta de Flores de Bach para la vida cotidiana en la página de cursos. Si quieres inscribirte al curso actual, puedo mostrarte su enlace.

Decisión: `course` / `show_course`. Contadores: 6 respuestas, 6 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 7

**Visitante:** Gracias. ¿También puedo encontrar información sobre las terapias en la web?

**Asistente:** En la web encontrarás acupuntura, moxibustión, ventosaterapia, tuina, Flores de Bach, medicina bioenergética, iridología y meditación y mindfulness.

Decisión: `therapies` / `show_therapies`. Contadores: 7 respuestas, 7 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 8

**Visitante:** Me interesa una primera consulta individual. ¿Cómo comienza?

**Asistente:** La primera consulta incluye una conversación y una evaluación individual. Puedes revisar cómo comienza la atención en la página de consulta.

Decisión: `consultation` / `show_consultation`. Contadores: 8 respuestas, 9 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 9

**Visitante:** ¿Puedes confirmar cuánto dura y qué disponibilidad hay para la consulta? Si no está publicado, no lo inventes.

**Asistente:** Ese dato no está confirmado en la información disponible. Puedes revisarlo con el equipo antes de decidir.

Decisión: `consultation` / `none`. Contadores: 9 respuestas, 10 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 10

**Visitante:** Quiero que el equipo me contacte por una consulta individual.

**Asistente:** Podemos continuar con una solicitud para que el equipo te contacte por el servicio que te interesa.

Decisión: `consultation` / `start_contact_capture`. Contadores: 10 respuestas, 11 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

## Incidencia real y recuperación explícita

La ronda 8 recibió HTTP 503 storage_unavailable después de OpenAI. Su respuesta no se persistió; los pasos 9 y 10 recibieron pending y no llamaron al proveedor. Se preserva el consumo del intento fallido. Tras vencer la reserva, el operador consulta el mismo ID y realiza un solo reintento nuevo explícito para completar las diez respuestas.

La tabla principal agrega en la ronda 8 el intento inicial fallido y el reintento que entregó la respuesta. El intento inicial siguiente se desglosa aquí, pero **ya está incluido** en la fila 8 y en los totales; no debe sumarse de nuevo:

| Paso / intento adicional | Estado | Entrada | Salida | Total tokens | USD | CLP |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 8 / inicial | storage_unavailable | 2857 | 190 | 3047 | 0.000159260 | 0.157123 |

**Visitante, intento inicial del paso 8:** Me interesa una primera consulta individual. ¿Cómo comienza?

**Resultado:** HTTP 503, `storage_unavailable`. OpenAI devolvió usage, pero no se entregó una respuesta guardada al visitante.

**Visitante, envío bloqueado del paso 9:** ¿Puedes confirmar cuánto dura y qué disponibilidad hay para la consulta? Si no está publicado, no lo inventes.

**Resultado:** HTTP 200, `pending`. La reserva activa bloqueó la llamada al proveedor; no se contó como ronda completada. Se conservó el evento en `before_explicit_recovery.json`.

**Visitante, envío bloqueado del paso 10:** Quiero que el equipo me contacte por una consulta individual.

**Resultado:** HTTP 200, `pending`. La reserva activa bloqueó la llamada al proveedor; no se contó como ronda completada. Se conservó el evento en `before_explicit_recovery.json`.

Tras consultar el ID original, el servidor devolvió `uncertain` sin repetir OpenAI. El operador inició un nuevo intento explícito para el paso 8; no hubo reintento automático del proveedor. Después se completaron los pasos 9 y 10.

## Comprobaciones adicionales

- **Sesión original recuperada**: APROBADO — Respuestas=7; intentos=8; busy=False
- **Intento incierto no reenvía al modelo**: APROBADO — status=uncertain; intentos=8
- **Diez respuestas tras la recuperación explícita**: APROBADO — 10 respuestas entregadas, 11 intentos de proveedor; uno incierto conservado y cobrado en el informe.
- **Intento 11 de conversación cerrado sin nueva llamada**: APROBADO — La cifra 11 de provider_attempts incluye el intento incierto, no otra respuesta después del cierre.
- **Replay de ronda 10 sin duplicar consumo**: APROBADO —
- **Captura disponible después del cierre**: APROBADO —
- **Contacto ficticio autorizado guardado**: APROBADO — lead_request_id=a0f94666-4b50-4359-ab06-dc1addda1149; video_call.
- **Guardado repetido sin duplicado**: APROBADO —
- **Cuotas conservadas tras el contacto**: APROBADO —
- **Contraste independiente con Supabase**: APROBADO — 10 peticiones completadas, 28855 tokens de respuestas completadas coincidentes y exactamente un contacto con preferencia video_call, sin novedades activadas. Los intentos inciertos se contabilizan adicionalmente con el usage capturado en HTTP.
- **Entrega de acción y enlace Hotmart**: APROBADO — El paso 5 seleccionó show_hotmart sin exigir captura. El frontend resuelve el destino desde siteSettings.courseUrl: https://nzamara-mtc.hotmart.host/flores-de-bach-vida-cotidiana. No se automatizó el clic ni una compra; no se confirmó disponibilidad del checkout externo.

## Evidencia y reproducibilidad

Script independiente: `scripts/test_2_luna_high.py`.
Registro JSON: `evidence/test-2-51161abd-e5b7-437f-a5af-e3f42682e9e5/run.json`; configuración de despliegue en el mismo directorio. Fuentes en `evidence/sources.json`.
Las cookies y los archivos transitorios de transporte quedan fuera de los informes, en `.preview/chatbot-testing`. No se incluyen claves ni bypass de Vercel.
Una ejecución por esfuerzo no permite afirmar superioridad estadística, igualdad de inferencia ni cubrir los 30 escenarios por consumo exigidos para estudiar coreografías de carga.

## Consumo preliminar de este caso (separado de la interacción principal)

Antes de esta corrida se ejecutó una conversación de diez pasos que se descartó de la comparación por un error de decodificación UTF-8 del capturador en Windows. Sus tokens sí fueron consumidos y no se ocultan en el balance.
- Preliminar: 29180 tokens; US$0.003451545; CLP $3.405225.
- Principal + preliminar de este caso: US$0.004633595; CLP $4.571412.
- Evidencia original: `evidence\test-2-3e71e011-05ce-48cb-b1aa-8fc317bd2a12\run.json`; el informe archivado está junto a ese JSON.
- La corrida principal usa decodificación UTF-8 explícita y reenvía las respuestas con sus acentos intactos.
