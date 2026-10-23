> CORRIDA DESCARTADA: error de decodificación UTF-8 en el capturador Windows. Los consumos son reales y se mantienen para contabilizar el costo de la tarea; esta corrida no es la comparación principal.

# Flujo de conversación test 1 — 2026-10-23

Modelo solicitado: **gpt-6-luna**, esfuerzo **low**.
Estado: **APROBADO**. Inicio UTC: `2026-10-23T17:35:09.661631+00:00`.
Preview aislado: https://nicolaszamara-f5hkn7shu-my-team-d5e0a31d.vercel.app.

## Alcance y configuración

Prueba E2E HTTP real del pipeline de la app: sesión/cookie → API Python → autorización atómica en Supabase → OpenAI Responses → validación → plantilla y acción → cierre. No utiliza mocks ni una llamada directa al modelo para simular el chat. No automatiza el DOM, los tooltips ni mide el tiempo de revelado de React.
La solicitud explícita del usuario autoriza estas dos pruebas reales como excepción puntual a la política general de unitarias de AGENTS.md.
Se usa el mismo guion de diez mensajes, una identidad independiente por caso y el mismo contrato de 12 mensajes de contexto. Cada paso envía únicamente el contexto que enviaría el frontend.
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
| 1 | 200 / completed | 2591 | 0 | 2588 | 32 | 0 | 2623 | 0.000339800 | 0.335240 | 11512.14 |
| 2 | 200 / completed | 2651 | 0 | 2648 | 62 | 28 | 2713 | 0.000362300 | 0.357438 | 11019.66 |
| 3 | 200 / completed | 2706 | 2648 | 55 | 67 | 32 | 2773 | 0.000067155 | 0.066254 | 10849.36 |
| 4 | 200 / completed | 2769 | 0 | 2766 | 64 | 29 | 2833 | 0.000378050 | 0.372977 | 11127.74 |
| 5 | 200 / completed | 2822 | 0 | 2819 | 49 | 13 | 2871 | 0.000377175 | 0.372113 | 10300.05 |
| 6 | 200 / completed | 2872 | 2819 | 50 | 89 | 54 | 2961 | 0.000079240 | 0.078177 | 11388.07 |
| 7 | 200 / completed | 2884 | 0 | 2881 | 78 | 37 | 2962 | 0.000399425 | 0.394065 | 9565.0 |
| 8 | 200 / completed | 2904 | 0 | 2901 | 93 | 55 | 2997 | 0.000409425 | 0.403931 | 10312.78 |
| 9 | 200 / completed | 2921 | 0 | 2918 | 79 | 44 | 3000 | 0.000404550 | 0.399121 | 11197.26 |
| 10 | 200 / completed | 2904 | 0 | 2901 | 72 | 36 | 2976 | 0.000398925 | 0.393571 | 8629.1 |

## Total de la interacción

- Pasos ejecutados: 10/10; respuestas entregadas: 10.
- Tokens medidos: entrada **28024**, salida **685**, total **28709**.
- Subconjuntos incluidos en los totales: **328** tokens de razonamiento en salida; **5467** de lectura de caché y **22527** de escritura de caché en entrada. No se suman otra vez al total.
- Costo total calculado: **US$0.003216045 / CLP $3.172886**.
- Rondas con usage y costo determinables: 10/10. `N/D` significa no medido; no equivale a costo cero.

## Conversación registrada

### Paso 1

**Visitante:** Hola, quiero información sobre el curso Flores de Bach para la vida cotidiana.

**Asistente:** Puedes conocer la propuesta de Flores de Bach para la vida cotidiana en la pÃ¡gina de cursos. Si quieres inscribirte al curso actual, puedo mostrarte su enlace.

Decisión: `course` / `show_course`. Contadores: 1 respuestas, 1 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 2

**Visitante:** ¿Qué propuesta tiene ese curso? Busco información general para aprender.

**Asistente:** Puedes conocer la propuesta de Flores de Bach para la vida cotidiana en la pÃ¡gina de cursos. Si quieres inscribirte al curso actual, puedo mostrarte su enlace.

Decisión: `course` / `show_course`. Contadores: 2 respuestas, 2 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 3

**Visitante:** ¿La futura modalidad online ya está abierta?

**Asistente:** Puedes registrar tu interÃ©s para recibir informaciÃ³n cuando se abra una ediciÃ³n online. La web todavÃ­a no confirma su apertura.

Decisión: `online` / `show_online_interest`. Contadores: 3 respuestas, 3 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 4

**Visitante:** Prefiero volver al curso actual. ¿Dónde puedo revisar su precio y condiciones?

**Asistente:** Puedes revisar el precio y las condiciones vigentes del curso actual en su pÃ¡gina de inscripciÃ³n en Hotmart.

Decisión: `course` / `show_hotmart`. Contadores: 4 respuestas, 4 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 5

**Visitante:** ¿Puedes mostrarme el enlace para inscribirme al curso actual?

**Asistente:** AquÃ­ tienes el enlace para conocer el curso actual y continuar con la inscripciÃ³n en Hotmart.

Decisión: `course` / `show_hotmart`. Contadores: 5 respuestas, 5 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 6

**Visitante:** No quiero dejar mis datos por ahora, solo seguir leyendo información del curso.

**Asistente:** Puedes conocer la propuesta de Flores de Bach para la vida cotidiana en la pÃ¡gina de cursos. Si quieres inscribirte al curso actual, puedo mostrarte su enlace.

Decisión: `course` / `show_course`. Contadores: 6 respuestas, 6 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 7

**Visitante:** Gracias. ¿También puedo encontrar información sobre las terapias en la web?

**Asistente:** En la web encontrarÃ¡s acupuntura, moxibustiÃ³n, ventosaterapia, tuina, Flores de Bach, medicina bioenergÃ©tica, iridologÃ­a y meditaciÃ³n y mindfulness.

Decisión: `therapies` / `show_therapies`. Contadores: 7 respuestas, 7 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 8

**Visitante:** Me interesa una primera consulta individual. ¿Cómo comienza?

**Asistente:** La primera consulta incluye una conversaciÃ³n y una evaluaciÃ³n individual. Puedes revisar cÃ³mo comienza la atenciÃ³n en la pÃ¡gina de consulta.

Decisión: `consultation` / `show_consultation`. Contadores: 8 respuestas, 8 intentos.
Modelo devuelto: `gpt-6-luna`. Servicio: `default`.

### Paso 9

**Visitante:** ¿Puedes confirmar cuánto dura y qué disponibilidad hay para la consulta? Si no está publicado, no lo inventes.

**Asistente:** Ese dato no estÃ¡ confirmado en la informaciÃ³n disponible. Puedes revisarlo con el equipo antes de decidir.

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
- **Guardado de contacto ficticio autorizado**: APROBADO — Preferencia phone; lead_request_id=d0ab4eb4-45c3-4a3b-8f72-bfa2ab441c3f.
- **Reintento del contacto sin duplicar**: APROBADO — Se reutilizó el identificador de guardado; comprobar unicidad en Supabase.
- **Cuotas conservadas después de guardar**: APROBADO — Sin nuevas rondas ni intentos durante la captura.
- **Contraste independiente con Supabase**: APROBADO — 10 peticiones completadas, 28709 tokens coincidentes y exactamente un contacto con preferencia phone, sin novedades activadas.

## Evidencia y reproducibilidad

Script independiente: `scripts/test_1_luna_low.py`.
Registro JSON: `evidence/test-1-7f8bf533-d1ab-4722-a67e-b362070c580e/run.json`; configuración de despliegue en el mismo directorio. Fuentes en `evidence/sources.json`.
Las cookies y los archivos transitorios de transporte quedan fuera de los informes, en `.preview/chatbot-testing`. No se incluyen claves ni bypass de Vercel.
Una ejecución por esfuerzo no permite afirmar superioridad estadística, igualdad de inferencia ni cubrir los 30 escenarios por consumo exigidos para estudiar coreografías de carga.
