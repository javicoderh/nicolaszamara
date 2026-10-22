export const therapyServices = [
  { id: 'acupuntura', name: 'Acupuntura', photo: { src: '/therapies/services-top.jpeg', x: 95, y: 148 } },
  { id: 'moxibustion', name: 'Moxibustión', photo: { src: '/therapies/services-top.jpeg', x: 400, y: 148 } },
  { id: 'ventosaterapia', name: 'Ventosaterapia', photo: { src: '/therapies/services-top.jpeg', x: 705, y: 148 } },
  { id: 'tuina', name: 'Tuina', photo: { src: '/therapies/services-top.jpeg', x: 1010, y: 148 } },
  { id: 'flores-de-bach', name: 'Flores de Bach', photo: { src: '/therapies/services-bottom.jpeg', x: 95, y: 78 } },
  { id: 'medicina-bioenergetica', name: 'Medicina Bioenergética', photo: { src: '/therapies/services-bottom.jpeg', x: 400, y: 78 } },
  { id: 'iridologia', name: 'Iridología', photo: { src: '/therapies/services-bottom.jpeg', x: 705, y: 78 } },
  { id: 'meditacion-y-mindfulness', name: 'Meditación y Mindfulness', photo: { src: '/therapies/services-bottom.jpeg', x: 1010, y: 78 } },
]

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
  therapies: therapyServices,
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
  '/terapias': {
    title: 'Terapias y servicios | Nicolás Zamara',
    description: 'Acupuntura, Moxibustión, Ventosaterapia, Tuina, Flores de Bach, Medicina Bioenergética, Iridología y Meditación y Mindfulness.',
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
    title: 'Cuidar tu salud también es atender cómo te sientes.',
    description: 'Soy Nicolás Zamara, terapeuta en Medicina China Integrativa y profesor de Flores de Bach. En mi consulta integro acupuntura y otras herramientas naturales y complementarias, considerando lo que te ocurre, cómo lo estás viviendo y qué necesitas.',
    additional: 'También comparto este camino a través de la formación y el encuentro con la naturaleza.',
  },
  consultation: {
    title: 'Una atención que considera tu motivo de consulta y cómo lo estás viviendo.',
    description: 'En la primera consulta nos damos tiempo para conversar sobre lo que te trae, tus antecedentes y cómo te encuentras. A partir de esa evaluación, te explico qué herramientas podemos utilizar y cómo será la atención.',
    additional: 'La acupuntura y las técnicas complementarias se eligen según cada caso. El bienestar emocional y los hábitos cotidianos también tienen un lugar en este proceso.',
  },
  areas: [
    { number: '01', title: 'Consulta y terapias', description: 'Atención individual con acupuntura, Medicina China Integrativa y Flores de Bach. Un espacio para evaluar tu motivo de consulta y acompañarte con un tratamiento personalizado que integra herramientas naturales y complementarias.', href: '/consulta', link: 'Conocer la atención' },
    { number: '02', title: 'Cursos y formación', description: 'Aprende a comprender y recomendar Flores de Bach en situaciones cotidianas, con herramientas prácticas, criterio y respeto por la experiencia de cada persona.', href: '/cursos', link: 'Conocer el curso' },
    { number: '03', title: 'Naturaleza y bienestar', description: 'Una invitación a bajar el ritmo, encontrar calma, abrir los sentidos y dedicar tiempo a estar en la naturaleza.', href: '/#naturaleza', link: 'Más información' },
  ],
  course: {
    title: 'Flores de Bach para la vida cotidiana',
    description: 'Aprende a reconocer estados emocionales y a recomendar Flores de Bach de manera sencilla y natural, respetando el método original del Dr. Edward Bach.',
    additional: 'Un curso para quienes quieren comenzar o dar orden a lo que ya saben, con ejemplos cotidianos y práctica guiada. Podrás aplicar lo aprendido en tu vida personal y compartirlo con personas cercanas, ayudándolas a observar cómo se sienten y orientándolas para que participen en la elección de sus Flores de Bach.',
  },
}

export const privacyCopy = {
  status: 'Versión de pruebas: utiliza datos ficticios.',
  sections: [
    { title: 'Finalidad de los registros', body: 'Los datos de cada formulario se usarán únicamente para responder al interés indicado y, si la persona lo autoriza por separado, enviar novedades relacionadas.' },
    { title: 'Servicios utilizados', body: 'Los formularios se reciben mediante una API en Python alojada en Vercel y se guardan en el proyecto nicolaszamara de Supabase, en São Paulo. Los visitantes no pueden consultar ni modificar registros. Se conserva el interés seleccionado, los datos del formulario y las autorizaciones, con fecha de registro. No se solicita información clínica.' },
  ],
}
