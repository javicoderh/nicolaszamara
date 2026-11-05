export class AdminError extends Error {
  constructor(status) { super(status); this.status = status }
}

export async function adminRequest(payload, signal) {
  const response = await fetch('/api/admin', {
    method: 'POST', credentials: 'same-origin', cache: 'no-store', signal,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Request': '1' },
    body: JSON.stringify(payload),
  })
  const result = await response.json()
  if (!response.ok) throw new AdminError(result.status || 'unavailable')
  return result
}

export const getAdminSession = (signal) => adminRequest({ operation: 'session' }, signal)
export const getAdminInterests = (signal, key) => adminRequest({ operation: 'interests', ...JSON.parse(key) }, signal)
export const getAdminInterest = (signal, id) => adminRequest({ operation: 'detail', id }, signal)
export const markAdminInterestRead = (id, signal) => adminRequest({ operation: 'mark_read', id }, signal)

export const adminErrorMessage = (error) => ({
  generation_not_configured: 'La generación con Sol necesita completar su configuración en el servidor. Puedes crear y editar artículos manualmente.',
  conflict: 'Esta versión cambió en otra sesión. Conservamos tus campos; revisa la versión guardada antes de sobrescribirla.',
  category_in_use:'Esta categoría está en uso. Reasigna sus artículos antes de eliminarla.',
  retry_limit:'Este encargo alcanzó el límite de tres intentos. Revisa su historial antes de crear una nueva generación.',
  invalid_credentials: 'Usuario o contraseña incorrectos.',
  rate_limited: 'Se alcanzó el límite de intentos. Espera 15 minutos para volver a intentar.',
  wrong_password: 'La contraseña actual no es correcta.',
  unauthorized: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  not_found: 'Este interés ya no está disponible.',
  invalid: 'Revisa los datos ingresados.',
}[error?.status] || 'No pudimos completar la solicitud. Inténtalo nuevamente.')
