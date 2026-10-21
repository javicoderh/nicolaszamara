export const siteSettings = {
  brand: 'Nicolás Zamara',
  descriptor: 'Consulta · Formación · Naturaleza',
  contact: {
    whatsappNumber: '',
    email: '',
    address: '',
    accessibility: '',
    hours: '',
    sessionDuration: '',
    sessionPrice: '',
  },
  socialLinks: [],
  courseUrl: 'https://nzamara-mtc.hotmart.host/flores-de-bach-vida-cotidiana',
}

export const pageMetadata = {
  '/': {
    title: 'Nicolás Zamara | Consulta, formación y naturaleza',
    description: 'Consulta terapéutica, cursos de Flores de Bach y una invitación a conectar con la naturaleza.',
  },
  '/consulta': {
    title: 'Consulta y terapias | Nicolás Zamara',
    description: 'Conoce cómo comienza la atención terapéutica y cómo consultar disponibilidad con Nicolás Zamara.',
  },
  '/cursos': {
    title: 'Cursos y formación | Nicolás Zamara',
    description: 'Flores de Bach para la vida cotidiana y registro de interés para una futura modalidad online.',
  },
  '/privacidad': {
    title: 'Privacidad | Nicolás Zamara',
    description: 'Información sobre el uso de datos en los formularios de interés de Nicolás Zamara.',
  },
}

export const homeContent = {
  hero: {
    eyebrow: 'Un espacio para escuchar, aprender y estar',
    title: 'Acompañar los procesos de la vida.',
    description: 'Soy Nicolás Zamara. Integro consulta terapéutica, formación y un vínculo profundo con la naturaleza.',
  },
  areas: [
    { number: '01', title: 'Consulta y terapias', description: 'Un espacio de atención personal, que comienza escuchando lo que hoy necesitas.', href: '/consulta', link: 'Conocer la consulta' },
    { number: '02', title: 'Cursos y formación', description: 'Aprendizajes para acercarte a las Flores de Bach con curiosidad y cuidado.', href: '/cursos', link: 'Explorar cursos' },
    { number: '03', title: 'Naturaleza y bienestar', description: 'Una invitación a detenerte, abrir los sentidos y encontrarte con el entorno.', href: '/#naturaleza', link: 'Acercarme a la naturaleza' },
  ],
  course: {
    title: 'Flores de Bach para la vida cotidiana',
    description: 'Un acercamiento a las esencias florales para ampliar tu comprensión y acompañar con respeto la autonomía de cada persona.',
  },
}

export const privacyCopy = {
  status: 'Versión de pruebas: utiliza datos ficticios. Completar y aprobar los datos del responsable y el canal de solicitudes antes de abrir los registros al público.',
  sections: [
    { title: 'Responsable del tratamiento', body: 'Nombre legal y datos de contacto pendientes de confirmación.' },
    { title: 'Finalidad de los registros', body: 'Los datos de cada formulario se usarán únicamente para responder al interés indicado y, si la persona lo autoriza por separado, enviar novedades relacionadas.' },
    { title: 'Conservación y solicitudes', body: 'Plazos de conservación, mecanismo para retirar el consentimiento y canal de solicitudes pendientes de definición.' },
    { title: 'Servicios utilizados', body: 'Los formularios se reciben mediante una API en Python alojada en Vercel y se guardan en el proyecto nicolaszamara de Supabase, en São Paulo. Los visitantes no pueden consultar ni modificar registros. Se conserva el interés seleccionado, los datos del formulario y las autorizaciones, con fecha de registro. No se solicita información clínica.' },
  ],
}
