
# Base integrada del chatbot de Nicolás Zamara

Versión de entrega: 17 de noviembre de 2026.

Este archivo reúne la información de referencia. El encargo completo, las reglas de conversación y los criterios de término están en `PROPUESTA_RESPUESTAS_CHATBOT_NICOLAS_ZAMARA.md`; ambos archivos forman una sola entrega.

Las decisiones editoriales incorporan las últimas correcciones de Nicolás. Los datos comerciales y estados de formularios se observaron el 3 de noviembre de 2026 y conservan esa fecha: esta actualización documental no constituye una nueva revisión del sitio. El desarrollador debe contrastarlos con las páginas y el proyecto vigentes antes de publicarlos. Los documentos técnicos originales son referencia histórica; se implementa sobre el proyecto actualizado.

## 1. Orientación actualizada por Nicolás

Priorizar la Medicina Tradicional China y la acupuntura en su atención, con orientación hacia salud mental, dolor y dolor crónico. La integración de gestación y salud de la mujer es una línea en desarrollo interno y de comunicación en redes; no se incorpora como oferta proactiva del chatbot. Ante preguntas específicas sobre esa área, facilitar consulta personal sin anunciar especialidades ni prestaciones no confirmadas. Los proyectos de terceros quedan fuera del contenido público del asistente.

El chatbot será un asistente de orientación y contacto: comprender la necesidad, responder de forma útil y facilitar una conversación breve y personalizada con Nicolás, terapeuta o profesor según el interés. El contacto podrá solicitarse por videollamada, teléfono o WhatsApp; es una preferencia a coordinar, no una cita confirmada. Funciona solo mediante texto.

Medicina China es el eje de la consulta. Las Flores de Bach pueden describirse como parte del enfoque de acompañamiento emocional de Nicolás cuando sea pertinente o se pregunte por ellas; no se introducirán sistemáticamente en conversaciones de atención ni se presentará su eficacia emocional como científicamente demostrada. La formación floral mantiene su protagonismo en el recorrido de cursos.

La especificación actual de comportamiento y los ejemplos están en `PROPUESTA_RESPUESTAS_CHATBOT_NICOLAS_ZAMARA.md`. Las correcciones directas de Nicolás prevalecen sobre los resúmenes anteriores.

## 2. Estilo de las respuestas escritas

Español natural de Chile, cercano, breve y profesional. Responder primero a lo preguntado; hacer como máximo una pregunta útil por turno. Evitar cuestionarios iniciales, repetir datos entregados, insistir en contacto después de una negativa o añadir ofertas que no vienen al caso.

Identificarse como asistente virtual. Propuesta editorial: usar «podemos orientarte» para acciones del asistente y «Nicolás evalúa» para acciones personales o profesionales. Así se conserva la redacción institucional en plural documentada sin sugerir que el chatbot realiza una evaluación clínica. Esta formulación es una propuesta de integración, no un acuerdo adicional atribuido a Nicolás.

Una acción principal por respuesta. Entregar información básica sin exigir teléfono o correo. Recoger datos mediante el mecanismo habilitado y con la autorización correspondiente.

## 3. Información y estado

| Tema | Información aportada | Uso propuesto |
|---|---|---|
| Identidad y contacto | Marketing confirma www.nicolaszamara.com, @nico.zamara y +56 9 5396 1219 | Adoptar estos datos en la base; comprobar los destinos al implementar. |
| Consulta | Atención desde Medicina China Integrativa, adaptada a necesidades y estilo de vida | Explicar el proceso y facilitar consulta de disponibilidad. |
| Orientación de consulta | Medicina China, salud mental, dolor y dolor crónico | Priorizar estos motivos sin prometer resultados ni atribuir especialidades no declaradas. |
| Curso | **Flores de Bach para la vida cotidiana**; oferta preparada y centrada en aprender a recomendar Flores de Bach | Usar este nombre oficial; no garantizar edición abierta, precio o certificado sin confirmación vigente. |
| Hotmart | https://nzamara-mtc.hotmart.host/flores-de-bach-vida-cotidiana | Enlace documentado al programa y oferta; revisar funcionamiento y ediciones al implementar. |
| Santiago, 21–22 noviembre 2026 | Edición presencial publicada en Hotmart con botón de inscripción, verificada el 03/11/2026 | Comunicar como edición anunciada; no garantizar cupos en tiempo real. Retirar o actualizar tras la fecha. |
| Quellón, 23–24 enero 2027 | Edición presencial observada el 03/11/2026 con inscripción, sujeta a cupo mínimo | Comprobar vigencia y comunicar la condición de cupo mínimo; no afirmar realización garantizada. |
| Online | El 03/11/2026 Hotmart anunciaba fecha y detalles próximamente y dirigía a WhatsApp; la web ofrecía interés futuro | Confirmar el estado actual antes de responder sobre apertura. Orientar a WhatsApp mientras los formularios conserven el aviso de pruebas. |
| Naturaleza | Línea de marca y experiencia personal documentadas | Explicar enfoque; no anunciar salida, cupos o reserva sin condiciones confirmadas. |
| Mentoría y BIEP | Mentoría sin enlace; programa anterior fuera de oferta activa | No ofrecer como productos disponibles ni trasladar certificaciones al curso actual. |

## 4. Recorridos

- Consulta: explicar lo necesario → `/consulta` o contacto pertinente → coordinación humana → confirmación por el canal responsable.
- Terapias: orientar con información general → `/terapias`; no forzar elección anticipada de técnica.
- Curso: resolver duda → programa y próximas ediciones en Hotmart. Ofrecer WhatsApp cuando la persona quiera conversar antes de inscribirse; no exigir contacto para acceder a la oferta.
- Online: mientras no se confirme apertura, explicar el estado y dirigir al interés online si el formulario está operativo.
- Naturaleza: explicar experiencia → `/naturaleza` → interés o contacto habilitado. Una solicitud no equivale a reserva.
- Derivación profesional: facilitar contacto con Nicolás; no afirmar convenios o protocolos establecidos.

Los enlaces de respuesta deben implementarse mediante los botones y acciones permitidos. La respuesta generada actual no admite URLs.

## 5. Diferencias que la integración resuelve o deja pendientes

1. **Contacto:** marketing aporta confirmación del WhatsApp y del Instagram que faltaba en el documento web. El dominio aportado por ambas referencias es nicolaszamara.com.
2. **Captación:** marketing deja pendiente el mecanismo, pero la documentación técnica describe formulario separado, persistencia y consentimiento. Existe una implementación documentada; su operación pública requiere prueba.
3. **Formularios:** el 3 de noviembre se confirmó que Consulta, Naturaleza y Online siguen mostrando el aviso de pruebas. Su guardado y notificaciones requieren prueba técnica antes de dirigir contactos reales.
4. **Online:** en la revisión del 3 de noviembre la landing y la web coincidían en que faltaban fechas. La regla de interés futuro era coherente con ese estado. Comprobar la situación actual y actualizar también la implementación cuando se abra una edición.
5. **Redacción:** las frases en primera persona presentes en los resúmenes deben adaptarse para que el asistente no parezca ser Nicolás ni realizar consultas clínicas. El alcance actual es exclusivamente textual.
6. **Evidencia:** el deseo de comunicar con mayor rigor requiere una base revisada. Los materiales aportados no acreditan indicaciones clínicas nuevas.

## 6. Ejemplos de conversación

Usar los ejemplos de `PROPUESTA_RESPUESTAS_CHATBOT_NICOLAS_ZAMARA.md`, que concentra la redacción para evitar versiones diferentes. Los datos de esta base se consultan según su vigencia; no deben copiarse como respuestas permanentes si dependen de fechas, disponibilidad o promociones.

## 7. Trabajo técnico necesario después de revisar esta base

- Trabajar sobre el repositorio actualizado y contrastarlo con la instantánea exportada.
- Revisar conjuntamente `config/chatbot/prompts/selector.system.md`, `selector.developer.md`, `knowledge.es.json`, respuestas protegidas y contenido público. El conocimiento del chatbot no se sincroniza automáticamente con el texto de la web.
- Mantener el contrato de salida: tema, clave de respuesta, acción, señal de contacto y respuesta de hasta 700 caracteres sin URLs. No sustituir ese contrato por un prompt editorial aislado.
- Revisar la regla que sustituye respuestas online por interés futuro cuando la oferta realmente se habilite.
- Conservar confirmación de registro solo después de guardado exitoso. No equiparar guardado con correo entregado, cita, pago o inscripción.
- Probar enlaces, formularios, errores, rechazo de contacto y conversaciones representativas en un entorno de ensayo.
- Mantener explicaciones educativas diferenciadas de indicaciones personales y conservar las respuestas protegidas pertinentes.

## 8. Datos que faltan para cerrar la versión publicable

La revisión pública resuelve las ediciones anunciadas, sus precios publicados, el programa, los requisitos y el canal de contacto. Para consultas, la web indica expresamente que duración, valores, ubicación y horarios se consultan al coordinar; el chatbot puede seguir ese mismo criterio sin exigir nuevos datos a Nicolás para avanzar.

Trabajo incluido en el encargo: habilitar y comprobar guardado, notificación y acceso a solicitudes reales. Revisar el estado actual de naturaleza y online antes de incorporarlo. Para contenidos futuros: certificado si se ofrece, condiciones de cambios y cancelaciones, base clínica revisada y plazos de respuesta humana, si se quieren anunciar.

## 9. Información pública incorporada el 3 de noviembre de 2026

Fuente del curso: https://nzamara-mtc.hotmart.host/flores-de-bach-vida-cotidiana

- Formación de 16 horas más aula virtual, sin conocimientos previos, para público general y profesionales dentro de sus competencias.
- Contenidos: fundamentos de Edward Bach, 38 flores y siete grupos, reconocimiento de estados emocionales, diferencias entre flores similares, selección floral, preparación y uso, práctica personal y uso responsable. Que el curso enseñe estos contenidos no autoriza al chatbot a prescribir preparados o dosis individuales.
- Incluye manual de Nicolás, aula virtual Hotmart con videos y descargables, sesión individual online de 45 minutos aproximadamente tres semanas después y workshop posterior sobre cómo enfrentar una primera consulta.
- Los insumos para preparado personal y Rescue Remedy se confirman en la FAQ para el curso presencial; no trasladar esa condición a una futura edición online sin comprobar logística.
- Valor general publicado para las ediciones presenciales: $139.000 CLP. Primer cupo de cada edición: $109.000 CLP, limitado a la primera inscripción. No prometer que ese cupo promocional continúa disponible.
- Santiago: 21 y 22 de noviembre de 2026. Quellón: 23 y 24 de enero de 2027, sujeto a cupo mínimo. Hay botones de inscripción por edición; la revisión no acredita pagos ni disponibilidad en tiempo real.
- Online: fecha y detalles próximamente; información por WhatsApp +56 9 5396 1219.
- La trayectoria publicada como exdocente BIEP no acredita certificación BIEP del curso actual.

Fuentes de atención y naturaleza: https://www.nicolaszamara.com/consulta y https://www.nicolaszamara.com/naturaleza

- Consulta: disponibilidad por WhatsApp; duración y valor se consultan al coordinar. Un mensaje no confirma una hora.
- Naturaleza: invitación a expresar interés para un próximo encuentro todavía sin fecha publicada.
- Formularios de consulta, naturaleza y online: aviso visible de versión de pruebas y uso de datos ficticios. Se mantiene WhatsApp como orientación propuesta hasta habilitación y comprobación del mecanismo real.

Estos datos son una referencia fechada para la implementación. Las condiciones publicadas vigentes deben confirmarse antes de usarlas en producción. La entrega documental no acredita cambios ejecutados en la web.
