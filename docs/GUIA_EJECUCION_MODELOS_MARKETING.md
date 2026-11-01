# Ejecutar el plan con Sol 6.1 low y Luna

Fecha: 29 de octubre de 2026. Esta guía organiza una implementación posterior; no cambia el modelo de esta sesión ni el modelo del chatbot del sitio.

Plan: [SEO, analytics y conversión](PLAN_SEO_ANALYTICS_CONVERSION.md). Contratos: [eventos y resultados](CONTRATOS_MEDICION_MARKETING.md).

## 1. Recomendación práctica

**Base solicitada: GPT-6.1 Sol low**, un lote pequeño por turno y contratos explícitos. Puede seguir este plan sin tener que decidir desde cero la arquitectura de medición.

**Alternativa para ahorrar costo: Luna high** en tareas delimitadas, conservando revisión de Sol para las fronteras de datos, permisos, consentimiento, dinero y renderizado. **Luna medium** se reserva para cambios repetitivos, documentación, IDs de sensores y fixtures con comportamiento ya definido.

La documentación oficial describe Luna como apropiado para tareas enfocadas y repetibles y aconseja High como punto de partida. No hay una garantía de que Luna high iguale a Sol low en este repositorio; la división de trabajo siguiente es una recomendación de ingeniería que debe verificarse con tareas reales. [Modelos y esfuerzo](https://learn.chatgpt.com/docs/models).

Sol 6.1 admite low; su valor por defecto documentado es medium. Usar low aquí es una elección para lotes acotados, no afirmar que sea siempre suficiente. [Ficha de GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

## 2. Menos costo y menos tokens no son lo mismo

Tarifas publicadas para créditos a velocidad Standard, por millón de tokens, consultadas al redactar:

| Modelo | Entrada | Entrada en caché | Salida |
|---|---:|---:|---:|
| GPT-6.1 Sol | 50 créditos | 2,5 créditos | 250 créditos |
| GPT-6 Luna | 2,5 créditos | 0,25 créditos | 12,5 créditos |

Para igual volumen, la tarifa de entrada sin caché y salida de Luna es 20 veces menor; la diferencia de entrada en caché es de 10 veces. Esto no significa que vaya a usar 20 veces menos tokens ni que toda una tarea cueste 20 veces menos. Razonamiento adicional, contexto, reintentos y revisión cambian el total. Estas tarifas no equivalen a las cuotas incluidas de cada suscripción ni al precio de API; revisar el panel de uso del usuario. [Precios oficiales de Work/Codex](https://learn.chatgpt.com/docs/pricing).

Objetivo de ahorro: **costo total de un lote aceptado**, incluyendo correcciones y revisión, sin omitir verificaciones. Registrar consumo cuando la herramienta lo muestre; si no lo muestra, dejar N/D, no estimar tokens como si fueran medidos.

## 3. Qué asignar a cada modelo

| Trabajo | Recomendación | Condición |
|---|---|---|
| Inventario, enlaces de documentación, matriz editorial | Luna medium | Fuentes suministradas, sin inventar hechos |
| Agregar IDs/eventos a controles siguiendo catálogo | Luna medium | El emisor y la deduplicación ya están implementados |
| Tests de contratos y fixtures | Luna medium o high | Revisar que prueben comportamiento, no que copien código |
| Adaptadores GA4/Clarity, hooks y estados de formulario | Luna high o Sol low | Un módulo por lote, mocks y casos límite explícitos |
| Configurar gráficos y documentar tablero | Luna high | Fórmulas y fuentes cerradas; validación de cifras |
| Consentimiento, SPA/StrictMode, idempotencia | Sol low + revisión | Aumentar a medium si aparecen interacciones no resueltas |
| SQL/permisos, webhook, dinero y atribución | Sol low + revisión puntual | No rebajar criterios para ahorrar uso |
| Prerenderizado/hidratación con 800 ms | Sol; medium si el lote lo requiere | Resolver la arquitectura antes de copiarla al resto de rutas |

No usar Luna medium como responsable único de todos los lotes en una petición enorme. Cambiar de modelo no añade permisos, cuentas ni herramientas que el entorno no tenga. La disponibilidad de capacidades se comprueba en el cliente utilizado.

## 4. Protocolo por lote

- [ ] Leer `AGENTS.md`, la sección Mxx, las secciones del contrato necesarias y `docs/marketing/ESTADO.md` si ya existe.
- [ ] Revisar `git status --short` y los archivos indicados; conservar cambios previos.
- [ ] Confirmar que las dependencias del lote estén terminadas. Si falta una dependencia externa, continuar trabajo local independiente y marcar el paso pendiente.
- [ ] Anotar qué comportamiento observable debe cambiar y qué prueba demostrará el resultado.
- [ ] Implementar una unidad de responsabilidad por vez. No agregar paquetes, infraestructura o eventos fuera del alcance para resolver un caso sencillo.
- [ ] Ejecutar pruebas dirigidas a los archivos modificados. Si fallan, corregir la causa; no eliminar assertions válidas para obtener verde.
- [ ] Revisar diff, secretos, datos personales, duplicados y compatibilidad con los 800 ms cuando aplique.
- [ ] Actualizar solo las casillas demostradas. Registrar comando/resultado o revisión manual real.
- [ ] Dejar un relevo breve: archivos, decisión, comprobaciones, pendientes y siguiente subpaso.

No releer todo el repositorio en cada turno. Tampoco omitir dependencias necesarias para reducir contexto. No ejecutar todas las pruebas después de cada cambio de copy; ejecutar la suite completa en los cierres indicados por el plan o cuando el riesgo de regresión lo justifique.

## 5. Cuándo subir el esfuerzo o volver a Sol

Estas son reglas prácticas del proyecto, no límites del proveedor:

- Dos intentos fallidos por la misma causa sin diagnóstico nuevo: detener el ciclo y revisar con Sol.
- Cambio de permisos, esquema o dinero que no figura en el contrato: diseñarlo y revisarlo antes de aplicar.
- Duplicados por navegación, consentimiento o reintentos: revisar el flujo completo del evento, no agregar flags locales arbitrarios.
- Necesidad de un nuevo proveedor, endpoint o dependencia: comprobar si resuelve un requisito real y registrar la decisión.
- Imposibilidad de mantener hidratación, accesibilidad y 800 ms: usar el punto de revisión M09, sin saltarse AGENTS.md.
- Acceso externo ausente: un modelo más potente no lo reemplaza; dejar la dependencia pendiente y avanzar en lo independiente.

## 6. Piloto para elegir sin perder funcionalidad

Antes de asignar todo el plan a Luna, usar un lote pequeño real; no repetir implementaciones destructivas ni gastar tokens en una competencia amplia.

- [ ] Elegir M05 sobre un solo componente después de que M03/M04 estén aprobados: por ejemplo, IDs distintos en los dos enlaces de AreaGrid.
- [ ] Darle a Luna high el contrato, archivos y prueba esperada del lote. No ejecutar el resto del plan.
- [ ] Revisar con Sol el diff y los casos límite, sin reimplementar lo que ya funciona.
- [ ] Registrar si pasó a la primera, errores encontrados, correcciones, tiempo y consumo real disponible.
- [ ] Si cumple, asignar a Luna los trabajos similares; probar medium solo en los más mecánicos.
- [ ] Si requiere cambios de arquitectura o correcciones repetidas, conservar Sol para esa familia de tareas.

Criterios comunes a ambos modelos: herramientas usadas correctamente, persistencia hasta terminar, pruebas pertinentes, cambios acotados, sin duplicación, sin exposición de datos y sin marcar pasos no verificados. No prometer igualdad de calidad solo por elegir un esfuerzo más alto.

## 7. Prompt de inicio para Sol 6.1 low

Seleccionar el modelo/esfuerzo en el cliente; este texto no lo cambia automáticamente.

> Implementa únicamente el lote Mxx del documento `docs/PLAN_SEO_ANALYTICS_CONVERSION.md`, respetando `AGENTS.md` y `docs/CONTRATOS_MEDICION_MARKETING.md`. Lee primero el estado del lote y sus dependencias. Conserva los cambios locales previos. Usa contratos y archivos indicados; no amplíes el alcance. Añade o ajusta las pruebas unitarias necesarias con servicios simulados y temporizadores falsos. Completa los subpasos locales autorizados; no actives servicios o despliegues sin autorización existente. Marca las casillas solo con evidencia. Termina indicando archivos modificados, verificaciones, bloqueos externos y siguiente paso. Si hay una contradicción técnica, explícalo y resuélvelo antes de continuar; no inventes datos ni omitas controles.

## 8. Prompt acotado para Luna

> Ejecuta solo los subpasos Mxx.a–Mxx.b que te indico, usando el contrato ya definido. Lee `AGENTS.md`, esos subpasos y los archivos que afectan. No cambies arquitectura, permisos ni nombres del catálogo. Mantén skeletons y el delay de 800 ms donde corresponda. Implementa, ejecuta las pruebas unitarias pertinentes y revisa tu diff. Si una decisión falta en el contrato o aparecen dos fallos de la misma causa, deja un diagnóstico concreto y no improvises una solución más amplia. Registra resultados reales y casillas completadas.

## 9. Prompt de revisión

> Revisa el lote Mxx y su diff contra el plan y los contratos. Busca errores observables: duplicación de eventos, datos personales enviados, errores de consentimiento, cambios de ruta, unidades monetarias, idempotencia, permisos y pruebas insuficientes. Revisa solo lo pertinente al lote. Prioriza defectos con archivo, condición que los provoca y corrección mínima. No rehagas código correcto por preferencia de estilo. Distingue evidencia ejecutada de comprobaciones aún pendientes.

## 10. Formato de relevo entre lotes

Guardar en `docs/marketing/ESTADO.md` al empezar la implementación:

- Lote y subpasos terminados.
- Archivos afectados y contrato que cumplen.
- Pruebas/comandos ejecutados y resultado.
- Configuración externa pendiente, sin secretos.
- Decisiones nuevas y su motivo.
- Próximo subpaso y archivos mínimos a leer.
- Modelo/esfuerzo y consumo real si está disponible.

No adjuntar logs completos, contenido de contactos, credenciales ni todo el historial de conversación. El objetivo es que otro modelo continúe desde un estado comprobable con poco contexto.
