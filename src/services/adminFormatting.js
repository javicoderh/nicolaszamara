export const interestLabels = { consultation: 'Consulta', course: 'Curso actual', online: 'Curso online', nature: 'Naturaleza' }
export const preferenceLabels = { video_call: 'Videollamada', phone: 'Teléfono', whatsapp: 'WhatsApp', email: 'Correo (histórico)' }
export const managementLabels = { new: 'Nuevo', contacted: 'Contactado', closed: 'Cerrado' }
export function adminDate(value) {
  return value ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' }).format(new Date(value)) : 'Sin registro'
}
export const sourceLabel = (value) => value === 'chatbot' ? 'Asistente' : value === 'form' ? 'Formulario' : 'Sin registro'
