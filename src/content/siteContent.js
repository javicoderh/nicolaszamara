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
    whatsappNumber: '+56953961219',
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
  '/blog': { title: 'Para profundizar | Blog de Nicolás Zamara', description: 'Lecturas sobre naturaleza, terapias, Flores de Bach y formación para continuar explorando.' },
  '/admin': {
    title: 'Administración | Nicolás Zamara',
    description: 'Acceso privado a la gestión de intereses.',
  },
  '/sobre-mi': {
    title: 'Sobre mí | Nicolás Zamara',
    description: 'Conoce a Nicolás Zamara, su trabajo como terapeuta y su vínculo con la naturaleza.',
  },
  '/naturaleza': {
    title: 'Naturaleza y bienestar | Nicolás Zamara',
    description: 'Conoce los baños de bosque y registra tu interés para recibir información sobre próximos encuentros.',
  },
  '/chatbot': {
    title: 'Conversemos | Nicolás Zamara',
    description: 'Encuentra orientación sobre consultas, terapias y cursos, y solicita contacto con el equipo.',
  },
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
    description: 'Flores de Bach para la vida cotidiana e información sobre el curso online.',
  },
  '/privacidad': {
    title: 'Privacidad | Nicolás Zamara',
    description: 'Información sobre el uso de datos en los formularios de interés de Nicolás Zamara.',
  },
}

export const homeContent = {
  hero: {
    title: 'Cuidar tu salud también es atender cómo te sientes.',
    description: 'Soy Nicolás Zamara, terapeuta en Medicina China Integrativa y profesor de Flores de Bach. En mi consulta integro acupuntura y otras herramientas complementarias, considerando tu motivo de consulta, cómo lo estás viviendo y qué necesitas.',
    additional: 'También comparto herramientas de aprendizaje y experiencias en la naturaleza para acompañar el autocuidado.',
  },
  consultation: {
    title: 'Una atención que considera tu motivo de consulta y cómo lo estás viviendo.',
    description: 'La primera atención comienza con una conversación y una evaluación. Revisamos lo que te trae a consulta, tus antecedentes y aspectos de tu vida cotidiana que puedan ser relevantes para tu atención.',
    additional: 'A partir de eso, te propongo un tratamiento adecuado a tus necesidades. No necesitas saber de antemano qué técnica elegir.',
  },
  areas: [
    { number: '01', title: 'Consulta y terapias', description: 'Un espacio para conversar sobre lo que te ocurre, evaluar tus necesidades y acordar una propuesta de atención que considere tu salud y tu vida cotidiana.', href: '/consulta', link: 'Conoce la atención' },
    { number: '02', title: 'Flores de Bach', description: 'Aprende a comprender y recomendar Flores de Bach en situaciones cotidianas, con herramientas prácticas, criterio y respeto por la experiencia de cada persona.', href: '/cursos', link: 'Conoce el curso' },
    { number: '03', title: 'Baños de bosque', description: 'Experiencias guiadas de inmersión en la naturaleza, inspiradas en el shinrin-yoku, para bajar el ritmo, abrir los sentidos y cultivar una relación más atenta con el entorno.', href: '/naturaleza', link: 'Conoce la experiencia' },
  ],
  course: {
    title: 'Flores de Bach para la vida cotidiana',
    description: 'Aprende a reconocer estados emocionales y a recomendar Flores de Bach de manera sencilla y natural, respetando el método original del Dr. Edward Bach.',
    additional: 'Un curso para quienes quieren comenzar o dar orden a lo que ya saben, con ejemplos cotidianos y práctica guiada. Podrás aplicar lo aprendido en tu vida personal y compartirlo con personas cercanas, ayudándolas a observar cómo se sienten y orientándolas para que participen en la elección de sus Flores de Bach.',
  },
}

export const privacyCopy = {
  sections: [
    { title: 'Preferencias de medición opcional', body: 'Puedes aceptar o rechazar por separado la analítica de navegación y los mapas de interacción desde Preferencias de privacidad, al pie de la página. Estas herramientas solo se activan cuando están habilitadas y das tu permiso. La configuración se conserva en tu navegador durante un máximo de 180 días. Google Analytics permite analizar navegación y conversiones; Microsoft Clarity permite revisar interacciones con contenido protegido. No enviamos los datos escritos en formularios ni el contenido de conversaciones a estas herramientas. Puedes cambiar tu elección en cualquier momento, sin afectar las solicitudes de contacto ni las autorizaciones para novedades.' },
    { title: 'Asistente conversacional', body: 'Si usas el asistente, tu mensaje y el historial reciente se envían a OpenAI para generar una respuesta usando la información disponible de los servicios. No almacenamos automáticamente tus mensajes ni el historial completo en nuestra base de datos. Una cookie anónima permite recuperar el estado y sus límites; guardamos contadores, intentos y respuestas del asistente. Evita incluir información clínica o datos personales sensibles.' },
    { title: 'Solicitud de contacto desde el asistente', body: 'Versión de esta autorización: 23 de octubre de 2026, contacto v3. Con tu autorización explícita guardamos el servicio de interés, tu nombre, teléfono, correo y preferencia de contacto: videollamada, teléfono o WhatsApp. El teléfono y el correo son obligatorios en las tres opciones. Usamos estos datos para contactarte por ese interés. La autorización para novedades es independiente y opcional. Estos campos no se envían al modelo de OpenAI. El registro no confirma una reserva ni una inscripción.' },
    { title: 'Finalidad de los registros', body: 'Los datos de cada formulario se usarán únicamente para responder al interés indicado, según tu preferencia de contacto, y, si lo autorizas por separado, enviar novedades relacionadas. Elegir videollamada expresa una preferencia; no confirma una cita.' },
    { title: 'Datos que se guardan', body: 'En los formularios de interés se guardan tu nombre, correo, teléfono, preferencia de contacto, interés y autorizaciones, junto con la fecha de registro. Según el formulario, también tu ciudad o país y, opcionalmente, tu experiencia previa. En los nuevos registros, el teléfono, el correo y la elección de videollamada, teléfono o WhatsApp son obligatorios. No se solicita información clínica.' },
    { title: 'Almacenamiento', body: 'Los registros se almacenan en Supabase, en São Paulo, y se reciben a través de Vercel. Los visitantes del sitio no pueden consultar ni modificar los registros guardados.' },
    { title: 'Origen de las solicitudes y clics en el curso', body: 'Guardamos si una solicitud llegó desde el formulario del asistente o desde un formulario de la web y la ruta donde se envió, sin parámetros de consulta ni fragmentos. Para contar clics al enlace del curso usamos un identificador anónimo de navegador mediante una cookie firmada, con una vigencia de hasta ocho días. Distinguimos los clics del asistente, la página de cursos y el inicio; registramos su fecha y ruta. No enviamos nombres, correos, teléfonos ni mensajes en esos eventos. El conteo corresponde a ese navegador y no confirma una compra o inscripción.' },
  ],
}

export const aboutContent = {
  "title": "Soy Nicolás Zamara.",
  "paragraphs": [
    "Mi trabajo reúne la atención en Medicina China Integrativa, la enseñanza de Flores de Bach y las experiencias en la naturaleza.",
    "En consulta, me interesa conocer a la persona que tengo al frente: qué le ocurre, cómo vive ese proceso y qué necesita para cuidar su salud. Desde ahí construimos una propuesta de atención.",
    "La naturaleza también forma parte de mi recorrido. Mi experiencia con los ríos, los bosques y la montaña nutre las jornadas de baños de bosque que comparto.",
    "En cada uno de estos espacios busco ofrecer una experiencia cercana, atenta y conectada con la vida cotidiana."
  ]
}

export const natureContent = {
  "title": "Baños de bosque: un espacio para bajar el ritmo y conectar con la naturaleza.",
  "paragraphs": [
    "Desde niño pasaba tiempo en parques nacionales como Conguillío, Huerquehue y muchos otros lugares. Después vinieron la alta montaña, la escalada en roca y el aprendizaje de navegar por ríos tranquilos y de aguas bravas. Todo eso me llevó a permanecer semanas inmerso en entornos naturales. Además de mi trabajo como terapeuta, soy guía de rafting y kayakista, y ese vínculo sigue siendo parte importante de mi vida.",
    "Guío experiencias de inmersión en la naturaleza inspiradas en el shinrin-yoku. A través de un recorrido pausado, momentos de silencio y propuestas de atención a los sentidos, exploramos una forma más consciente de habitar el entorno.",
    "Mi experiencia como terapeuta y mi vínculo con los ríos, los bosques y la montaña se encuentran en estas jornadas."
  ]
}
