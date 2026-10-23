# Comparación de las dos pruebas — 2026-10-23

Dos conversaciones reales de diez pasos mediante el pipeline HTTP desplegado. No son pruebas de interfaz de navegador. Mismo modelo, guion, política, límite de contexto, margen de 25.000 tokens de salida y plazo de proveedor; cambia el esfuerzo low/high. Los ajustes se limitaron a dos Previews, sin cambiar el modelo público.

| Caso | Esfuerzo | Tokens | USD calculados | CLP calculados | Resultado |
| --- | --- | ---: | ---: | ---: | --- |
| [1](flujo%20de%20conversación%20test%201%202026-10-23.md) | low | 28515 | 0.000888210 | 0.876290 | APROBADO |
| [2](flujo%20de%20conversación%20test%202%202026-10-23.md) | high | 31902 | 0.001182050 | 1.166187 | COMPLETADO CON INCIDENCIA DE PERSISTENCIA Y RECUPERACION EXPLICITA |

Total: **60417 tokens; US$0.002070260; CLP $2.042477**.
En estas dos ejecuciones, high costó US$0.000293840 más (33.08%). Esa diferencia incluye el intento incierto de persistencia y cambios de caché: no es una comparación pura del esfuerzo ni una conclusión estadística sobre el modelo.

Las conversaciones principales contabilizan 21 llamadas al proveedor. Hay veinte respuestas completadas contrastadas con Supabase y, en high, un intento incierto adicional con usage capturado. El envío posterior al cierre, el replay del mensaje y las operaciones de captura no añadieron llamadas al modelo. Se comprobó un solo contacto ficticio guardado por caso, con novedades desactivadas.

Lectura/escritura de caché y razonamiento se contabilizan con sus categorías reales: caché está incluida en entrada y razonamiento en salida. Se utilizaron tarifas Standard explícitas; ambos proveedores devolvieron `service_tier=default`. La ejecución low precedió a high y no se intentó borrar la caché del proveedor; por eso el costo no debe atribuirse solo al esfuerzo sin considerar la caché observada.

Las reservas de seguridad fueron US$0.192590000 para low y US$0.211849000 para high (US$0.404439000 entre ambos), dentro del límite diario global de US$3. Esas reservas **no son el costo facturado de las conversaciones**.

El estimador interno `estimated_micro_usd` no se utiliza como precio de estos informes: no diferencia las tarifas de lectura/escritura de caché. Los importes se recalcularon con `usage` completo, incluyen el recargo observado de escritura y se preservan como decimales. Antes de adoptar Luna de forma permanente conviene ajustar ese estimador y su tarifa de reserva para distinguir esas categorías.

Conversión: 1 USD = 986.58 CLP, dólar observado del 2026-10-23. [Banco Central](https://si3.bcentral.cl/indicadoressiete/secure/indicadoresdiarios.aspx). [Tarifas de GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).

No incluye impuestos, comisión/tipo de cambio de tarjeta, Vercel o Supabase; es un cálculo verificable sobre tokens consumidos, no una factura liquidada. La prueba no cubre los 30 escenarios por consumo para estudiar latencia ni demuestra equivalencia o superioridad de inferencia.

Los dos registros ficticios se identifican como `Chatbot Testing Test 1/2`; permanecen en intereses para revisión y no se envió ningún contacto automático. Los Previews son protegidos por autenticación de Vercel. Se puede regenerar este resumen y ambos informes ejecutando `scripts/refresh_reports.py` sin ningún consumo nuevo.

## Balance total de la tarea, incluidas las corridas preliminares

Se descartaron de la comparación principal dos corridas por decodificación incorrecta de acentos en Windows. No hubo fallo del modelo ni consumo ficticio: sus datos se conservan y sus costos se incluyen aquí.

- Preliminares: 57889 tokens; US$0.006667590; CLP $6.578111.
- Todas las corridas: 118306 tokens; **US$0.008737850 / CLP $8.620588**.
- Permanecen cuatro contactos ficticios en total: dos de las preliminares y dos de las corridas principales. Se identifican por los `lead_request_id` de cada evidencia; cada intento idempotente insertó una sola fila.
