# Flujo de conversación test 1 — 2026-10-23

Modelo solicitado: **gpt-6-luna**, esfuerzo **low**.
Estado: **APROBADO**. Inicio UTC: `2026-10-23T17:56:53.500315+00:00`.
Preview aislado: https://nicolaszamara-f5hkn7shu-my-team-d5e0a31d.vercel.app.

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
| 1 | 200 / completed | 2591 | 2588 | 0 | 48 | 14 | 2639 | 0.000050180 | 0.049507 | 8127.39 |
| 2 | 200 / completed | 2648 | 2541 | 104 | 62 | 28 | 2710 | 0.000069710 | 0.068774 | 10357.09 |
| 3 | 200 / completed | 2700 | 2645 | 52 | 85 | 50 | 2785 | 0.000075750 | 0.074733 | 14316.39 |
| 4 | 200 / completed | 2749 | 2542 | 204 | 76 | 41 | 2825 | 0.000089220 | 0.088023 | 21819.84 |
| 5 | 200 / completed | 2794 | 2542 | 249 | 52 | 16 | 2846 | 0.000082845 | 0.081733 | 9499.42 |
| 6 | 200 / completed | 2837 | 2791 | 43 | 94 | 59 | 2931 | 0.000080585 | 0.079504 | 10225.5 |
| 7 | 200 / completed | 2846 | 2541 | 302 | 78 | 37 | 2924 | 0.000102460 | 0.101085 | 10299.04 |
| 8 | 200 / completed | 2857 | 2546 | 308 | 104 | 66 | 2961 | 0.000116260 | 0.114700 | 11029.06 |
| 9 | 200 / completed | 2859 | 2544 | 312 | 97 | 62 | 2956 | 0.000113240 | 0.111720 | 13099.17 |
| 10 | 200 / completed | 2850 | 2541 | 306 | 88 | 52 | 2938 | 0.000107960 | 0.106511 | 9274.84 |

## Total de la interacción

- Pasos de conversación: 10/10; respuestas entregadas: 10; intentos de proveedor contabilizados: 10.
- Tokens medidos: entrada **27731**, salida **784**, total **28515**.
- Subconjuntos incluidos en los totales: **425** tokens de razonamiento en salida; **25821** de lectura de caché y **1880** de escritura de caché en entrada. No se suman otra vez al total.
- Costo total calculado: **US$0.000888210 / CLP $0.876290**.
- Intentos con usage y costo determinables: 10/10. `N/D` significa no medido; no equivale a costo cero.

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

Decisión: `consultation` / `show_consultation`. Contadores: 8 respuestas, 8 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 9

**Visitante:** ¿Puedes confirmar cuánto dura y qué disponibilidad hay para la consulta? Si no está publicado, no lo inventes.

**Asistente:** Ese dato no está confirmado en la información disponible. Puedes revisarlo con el equipo antes de decidir.

Decisión: `consultation` / `none`. Contadores: 9 respuestas, 9 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 10

**Visitante:** Quiero que el equipo me contacte por una consulta individual.

**Asistente:** Podemos continuar con una solicitud para que el equipo te contacte por el servicio que te interesa.

Decisión: `consultation` / `start_contact_capture`. Contadores: 10 respuestas, 10 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

## Comprobaciones adicionales

- **Sesión y configuración del esfuerzo**: APROBADO — HTTP 200; configuración {"model": "gpt-6-luna", "reasoning_effort": "low", "max_output_tokens": 25000}
- **Diez respuestas y cierre**: APROBADO — completed_rounds=10, closed=True
- **Intento 11 sin llamada al proveedor**: APROBADO — status=conversation_closed; intentos=10
- **Repetición idempotente de ronda 10**: APROBADO — Mismo request_id; sin incremento de intentos.
- **Captura disponible después del cierre**: APROBADO — Comando local, sin OpenAI.
- **Guardado de contacto ficticio autorizado**: APROBADO — Preferencia phone; lead_request_id=7b95b35b-5f73-4cf1-b175-93e4122ef9d2.
- **Reintento del contacto sin duplicar**: APROBADO — Se reutilizó el identificador de guardado; comprobar unicidad en Supabase.
- **Cuotas conservadas después de guardar**: APROBADO — Sin nuevas rondas ni intentos durante la captura.
- **Contraste independiente con Supabase**: APROBADO — 10 peticiones completadas, 28515 tokens de respuestas completadas coincidentes y exactamente un contacto con preferencia phone, sin novedades activadas. Los intentos inciertos se contabilizan adicionalmente con el usage capturado en HTTP.
- **Entrega de acción y enlace Hotmart**: APROBADO — El paso 5 seleccionó show_hotmart sin exigir captura. El frontend resuelve el destino desde siteSettings.courseUrl: https://nzamara-mtc.hotmart.host/flores-de-bach-vida-cotidiana. No se automatizó el clic ni una compra; no se confirmó disponibilidad del checkout externo.

## Evidencia y reproducibilidad

Script independiente: `scripts/test_1_luna_low.py`.
Registro JSON: `evidence/test-1-4bc0fd39-57e7-4a26-ba7e-6e9a31daad3d/run.json`; configuración de despliegue en el mismo directorio. Fuentes en `evidence/sources.json`.
Las cookies y los archivos transitorios de transporte quedan fuera de los informes, en `.preview/chatbot-testing`. No se incluyen claves ni bypass de Vercel.
Una ejecución por esfuerzo no permite afirmar superioridad estadística, igualdad de inferencia ni cubrir los 30 escenarios por consumo exigidos para estudiar coreografías de carga.

## Consumo preliminar de este caso (separado de la interacción principal)

Antes de esta corrida se ejecutó una conversación de diez pasos que se descartó de la comparación por un error de decodificación UTF-8 del capturador en Windows. Sus tokens sí fueron consumidos y no se ocultan en el balance.
- Preliminar: 28709 tokens; US$0.003216045; CLP $3.172886.
- Principal + preliminar de este caso: US$0.004104255; CLP $4.049176.
- Evidencia original: `evidence\test-1-7f8bf533-d1ab-4722-a67e-b362070c580e\run.json`; el informe archivado está junto a ese JSON.
- La corrida principal usa decodificación UTF-8 explícita y reenvía las respuestas con sus acentos intactos.
