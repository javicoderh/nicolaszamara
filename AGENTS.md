# Carta magna de Nicolas Zamara front

Este repositorio es un espacio de cuidado: cada interfaz tiene un propósito, cada módulo su lugar y cada espera una forma visible. Esta carta guía a toda persona y agente que contribuya a la aplicación. Sus reglas alcanzan al código de producción, las pruebas, los prototipos y todos los ejemplos de código que compartamos para el proyecto.

## I. Cada componente, una habitación propia

Construimos con lógica modular. Cada componente habita una carpeta propia, junto a su archivo CSS, sus pruebas unitarias y su skeleton. Su nombre debe expresar su propósito; su tamaño, permitir comprenderlo sin recorrer toda la aplicación.

El estilo de cada componente pertenece a su archivo CSS. Los estilos globales se reservan para fundamentos compartidos, como el reset, la tipografía y las variables de diseño; no sustituyen el CSS particular de cada componente.

## II. SOLID, los cimientos bajo la calma

Los principios SOLID orientan cada decisión, adaptados a React y a la composición de funciones:

- **Responsabilidad única:** un componente, hook o servicio tiene un motivo claro para cambiar. La presentación, la coordinación de cargas y el acceso a datos mantienen responsabilidades separadas.
- **Abierto a extensión:** ampliamos comportamientos mediante composición y contratos explícitos, evitando modificar piezas estables por cada variante visual.
- **Sustitución:** las implementaciones intercambiables respetan las mismas props y garantías de comportamiento.
- **Segregación de interfaces:** cada consumidor recibe únicamente las props y capacidades que necesita.
- **Inversión de dependencias:** la interfaz depende de contratos; los detalles de servicios externos permanecen detrás de adaptadores o servicios sustituibles.

La arquitectura debe servir a la claridad. No añadimos abstracciones sin una responsabilidad concreta.

## III. Una fuente compartida, muchas ventanas

Preferimos contextos globales para el estado verdaderamente compartido que alimenta distintas interfaces. Los contenedores o hooks consumen esos contextos y entregan a los componentes de presentación datos y acciones mediante props explícitas.

El estado local permanece cerca de quien lo necesita. Dividimos los contextos por responsabilidad para evitar que un cambio pequeño despierte innecesariamente a toda la aplicación.

## IV. Toda pieza demuestra su oficio

Todos los componentes deben tener pruebas unitarias con **Vitest y React Testing Library**, incluidos sus skeletons. Vitest ejecuta y simula temporizadores; React Testing Library monta los componentes y comprueba el DOM y las interacciones observables. Las pruebas viven junto al componente y verifican comportamiento, props e interacciones pertinentes.

En este proyecto escribimos únicamente pruebas unitarias: no incorporamos pruebas de integración ni de extremo a extremo. Los servicios externos se sustituyen por mocks; los tiempos se controlan con temporizadores simulados. Ninguna prueba unitaria depende de una API real ni espera deliberadamente 0,8 segundos de reloj.

Verificamos especialmente que el skeleton aparezca durante la espera, que el contenido respete el delay y que los estados de éxito, error y recarga se comporten según su contrato.

## V. La espera también es interfaz

Cada componente tiene su propio skeleton, coherente con su estructura visual, para reservar espacio y acompañar la espera sin saltos innecesarios. Los skeletons son la excepción natural a la espera: aparecen de inmediato y no requieren otro skeleton ni un delay recursivo.

El delay base obligatorio es de **0,8 segundos (800 ms)** antes de mostrar el contenido del componente:

- **Sin APIs externas:** se muestra el skeleton durante 800 ms desde el inicio de la carga y después se presenta el contenido.
- **Con servicios externos:** la espera total es **el tiempo real de carga o recarga más 800 ms**. La petición puede comenzar inmediatamente; tras completarse, se cumple el delay base antes de revelar el resultado. No se interpreta esta regla como `máximo(800 ms, tiempo de petición)`.

Cada nuevo ciclo de carga o recarga respeta la misma regla. Los errores se presentan después de finalizar el intento y cumplir el delay base; nunca se ocultan bajo un skeleton indefinido.

Centralizamos la constante de 800 ms y reutilizamos la lógica temporal mediante hooks o utilidades con responsabilidad única. Limpiamos temporizadores y cancelamos o descartamos respuestas obsoletas al desmontar o iniciar una carga nueva.

Los componentes de presentación que forman parte de una misma unidad de carga reciben su estado mediante props: no encadenamos delays por cada nivel del árbol. Cada unidad independiente conserva su skeleton y su propio ciclo de espera.

## VI. Las cargas bailan con su propio compás

Cuando un componente consume varios servicios externos, procuramos una **coreografía de cargas independiente para cada consumo**. Cada región conserva sus datos, skeleton, error y tiempo de revelado; una respuesta lenta no debe impedir que otra región independiente termine su propio ciclo.

La coordinación de peticiones y tiempos vive fuera de la lógica de renderizado, en hooks o servicios dedicados. Los renders describen el estado; no disparan por sí mismos nuevas peticiones ni reinician los relojes. Los servicios independientes pueden cargarse en paralelo; las dependencias reales entre servicios se declaran y respetan.

Antes de ajustar una coreografía con tiempos aproximados, medimos **al menos 30 escenarios por consumo externo**. Documentamos las condiciones de cada escenario, incluyendo las variaciones pertinentes de red, caché, carga inicial y recarga. No presentamos estimaciones como mediciones.

Registramos por separado la duración real de la petición, sus resultados o errores y el tiempo total hasta revelar la región. Calculamos al menos tamaño de muestra, media, mediana, mínimo, máximo, desviación estándar y percentiles p90 y p95. Conservamos los registros y el método de medición en el repositorio para que las conclusiones puedan reproducirse.

Estas estadísticas orientan la coreografía y se revisan cuando cambian los servicios o sus condiciones. Nunca sustituyen la finalización real de una petición: una estimación no autoriza mostrar datos incompletos ni elimina los 800 ms adicionales obligatorios.

## VII. El pacto cotidiano

Toda contribución y todo ejemplo de código deben respetar esta carta: carpetas por componente, CSS propio, SOLID, contextos compartidos cuando correspondan, props explícitas, pruebas unitarias con Vitest y React Testing Library, skeletons y tiempos de espera definidos.

No declaramos una pieza terminada si faltan sus pruebas, su skeleton o la verificación de su ciclo de carga. Si todavía no existen servicios externos o mediciones reales, dejamos esa ausencia documentada; no inventamos datos para completar una promesa.

Que la forma sea serena y el comportamiento preciso. La belleza de esta aplicación también estará en que cada pieza cumpla lo que promete.
