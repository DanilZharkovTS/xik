import type { Locale } from '@/src/shared/i18n/i18n-store'

// Переклади статичних послуг. Англійський текст лежить у catalog-items.ts; технічні назви
// (stack, protocols) не перекладаються. Поле, якого тут немає, показується англійською.
export interface ServiceTranslation {
  typeLabel: string
  title: string
  subtitle: string
  category: string
  statusLabel: string
  tagline: string
  description: string
  highlights: string[]
  capabilities: { title: string; description: string }[]
  runtime: string
  deployment: string
  latency: string
}

type Translations = Record<string, Partial<Record<Exclude<Locale, 'en'>, ServiceTranslation>>>

export const SERVICE_TRANSLATIONS: Translations = {
  'ai-development': {
    es: {
      typeLabel: 'Servicio de ingeniería',
      title: 'Desarrollo de IA',
      subtitle: 'Agentes autónomos, motores RAG/KAG y arquitecturas LLM de nivel productivo.',
      category: 'IA y sistemas multiagente',
      statusLabel: 'Disponible para proyectos',
      tagline: 'Del prompt experimental a sistemas de IA robustos, auditados y en producción.',
      description:
        'Ingeniería de ciclo completo de agentes autónomos a medida, canalizaciones híbridas de clasificación con reglas y LLM, búsqueda vectorial (PGVector / Qdrant) y enrutamiento de modelos con coste acotado. Construimos flujos de IA deterministas con un ROI de negocio medible.',
      highlights: ['Reglas + LLM híbridos', 'Presupuesto de coste y tokens', 'Enrutamiento multimodelo'],
      capabilities: [
        { title: 'Flujos multiagente', description: 'Enjambres de agentes autónomos orquestados, con colas de revisión humana y presupuestos de ejecución.' },
        { title: 'RAG y KAG empresariales', description: 'Recuperación híbrida con búsqueda vectorial, fragmentación precisa y citas estrictas de las fuentes.' },
        { title: 'Enrutamiento multimodelo y BYOK', description: 'Enrutamiento inteligente entre Claude 3.7, Gemini 2.0, DeepSeek y OpenAI para equilibrar coste y latencia.' },
        { title: 'Canalizaciones de salida estructurada', description: 'Salidas JSON deterministas con validación en tiempo de ejecución y reintentos automáticos de respaldo.' },
      ],
      runtime: 'Flota de contenedores aislados / GPU sin servidor',
      deployment: 'VPC del cliente / nube dedicada',
      latency: '<100 ms hasta el primer token',
    },
    uk: {
      typeLabel: 'Інженерна послуга',
      title: 'Розробка AI',
      subtitle: 'Автономні агенти, RAG/KAG-рушії та LLM-архітектури промислового рівня.',
      category: 'AI та мультиагентні системи',
      statusLabel: 'Доступно для проєктів',
      tagline: 'Від експериментального промпта до надійних, перевірених AI-систем у продакшні.',
      description:
        'Повний цикл інженерії індивідуальних автономних агентів, гібридних конвеєрів класифікації на правилах і LLM, векторного пошуку (PGVector / Qdrant) та маршрутизації моделей з обмеженою вартістю. Ми будуємо детерміновані AI-процеси з вимірюваною бізнес-віддачею.',
      highlights: ['Гібрид правил і LLM', 'Бюджет вартості та токенів', 'Маршрутизація моделей'],
      capabilities: [
        { title: 'Мультиагентні процеси', description: 'Оркестровані рої автономних агентів із чергами перевірки людиною та бюджетами виконання.' },
        { title: 'Корпоративні RAG і KAG', description: 'Гібридний пошук із векторним індексом, точним розбиттям тексту та суворими посиланнями на джерела.' },
        { title: 'Маршрутизація моделей і BYOK', description: 'Розумна маршрутизація між Claude 3.7, Gemini 2.0, DeepSeek і OpenAI для балансу вартості й затримки.' },
        { title: 'Конвеєри структурованого виводу', description: 'Детерміновані JSON-відповіді з перевіркою під час виконання та автоматичними повторами.' },
      ],
      runtime: 'Флот ізольованих контейнерів / serverless GPU',
      deployment: 'VPC клієнта / виділена хмара',
      latency: '<100 мс до першого токена',
    },
  },

  'ai-security-audit': {
    es: {
      typeLabel: 'Servicio de seguridad',
      title: 'Seguridad y auditoría de IA',
      subtitle: 'Evaluación adversarial de agentes, defensa frente a inyección de prompts y aislamiento de herramientas.',
      category: 'Seguridad y protección de IA',
      statusLabel: 'Disponible para auditorías',
      tagline: 'Blindamos los agentes de IA autónomos frente a acciones no autorizadas y fugas de datos.',
      description:
        'Pruebas de penetración integrales y barreras de protección en tiempo de ejecución para agentes de IA y aplicaciones LLM. Evaluamos los sistemas frente a inyecciones de prompts, ejecución no autorizada de herramientas, fugas de datos entre inquilinos y efectos secundarios inseguros antes del despliegue.',
      highlights: ['Defensa contra inyección de prompts', 'Aislamiento del mal uso de herramientas', 'Informes SARIF y JUnit'],
      capabilities: [
        { title: 'Pentesting adversarial de prompts', description: 'Análisis automatizados de inyección, intentos de jailbreak y diagnóstico de extracción del prompt de sistema.' },
        { title: 'Aislamiento de herramientas y MCP', description: 'Comprobaciones estrictas de autorización, límites de permisos y puertas de cancelación de ejecución para las herramientas del agente.' },
        { title: 'Auditorías de efectos secundarios con telemetría', description: 'Detecta escrituras inseguras en bases de datos o llamadas a API externas aunque la respuesta parezca segura.' },
        { title: 'Entregables de cumplimiento y auditoría', description: 'Evidencia de seguridad legible por máquinas con informes SARIF, matrices de riesgo y hojas de ruta de corrección.' },
      ],
      runtime: 'Contenedores efímeros aislados',
      deployment: 'Red privada del cliente / ejecutor seguro',
      latency: 'Análisis automatizados en CI/CD',
    },
    uk: {
      typeLabel: 'Послуга безпеки',
      title: 'Безпека та аудит AI',
      subtitle: 'Змагальна оцінка агентів, захист від ін’єкцій у промптах та ізоляція інструментів.',
      category: 'Безпека та захист AI',
      statusLabel: 'Доступно для аудитів',
      tagline: 'Захищаємо автономних AI-агентів від несанкціонованих дій і витоку даних.',
      description:
        'Комплексне тестування на проникнення та захисні бар’єри часу виконання для AI-агентів і LLM-застосунків. Перевіряємо системи на ін’єкції в промптах, несанкціоноване виконання інструментів, витік даних між орендарями та небезпечні побічні ефекти ще до розгортання.',
      highlights: ['Захист від ін’єкцій у промптах', 'Ізоляція зловживання інструментами', 'Звіти SARIF і JUnit'],
      capabilities: [
        { title: 'Змагальний пентест промптів', description: 'Автоматичне сканування ін’єкцій, спроби jailbreak і діагностика витягування системного промпта.' },
        { title: 'Ізоляція інструментів і MCP', description: 'Суворі перевірки авторизації, межі дозволів і шлюзи скасування виконання для інструментів агента.' },
        { title: 'Аудит побічних ефектів за телеметрією', description: 'Виявляє небезпечні записи в базу даних і виклики зовнішніх API, навіть якщо текстова відповідь виглядає безпечно.' },
        { title: 'Матеріали для відповідності й аудиту', description: 'Машиночитні докази безпеки зі звітами SARIF, матрицями ризиків і планами усунення.' },
      ],
      runtime: 'Ізольовані ефемерні контейнери',
      deployment: 'Приватна мережа клієнта / захищений виконавець',
      latency: 'Автоматичні сканування в CI/CD',
    },
  },

  'fintech-escrow': {
    es: {
      typeLabel: 'Servicio FinTech',
      title: 'FinTech y sistemas de escrow',
      subtitle: 'Motores de escrow, libros contables internos de partida doble, retenciones en monederos y reglas antifraude.',
      category: 'FinTech y pagos',
      statusLabel: 'Disponible para proyectos',
      tagline: 'Infraestructura financiera crítica con integridad matemática del libro contable.',
      description:
        'Arquitectura y entrega de plataformas FinTech en producción, motores de escrow, monederos digitales multiinquilino y libros contables internos de partida doble. Con registros de auditoría inmutables, verificación KYC/AML por niveles, detección de fraude basada en reglas y resolución automatizada de disputas.',
      highlights: ['Libros de partida doble', 'Controles KYC/AML por niveles', 'Motor de escrow sin pérdidas'],
      capabilities: [
        { title: 'Escrow y retenciones de transacciones', description: 'Retención condicional de fondos, liberaciones por hitos, pagos a varias partes y reparto de comisiones.' },
        { title: 'Libros internos de partida doble', description: 'Asientos inmutables y estrictos que garantizan que los saldos de los monederos siempre cuadren entre cuentas.' },
        { title: 'KYC/AML por niveles y control del fraude', description: 'Puntuación automática del riesgo, límites de transacción por reglas, alertas de actividad sospechosa y verificación de identidad.' },
        { title: 'Gobernanza de disputas y notaría', description: 'Módulos de resolución de disputas para administradores, simulaciones de lógica contractual y registros de auditoría inmutables.' },
      ],
      runtime: 'Clúster aislado de alta disponibilidad',
      deployment: 'Infraestructura conforme con PCI-DSS / AWS',
      latency: '<15 ms por confirmación de transacción',
    },
    uk: {
      typeLabel: 'FinTech-послуга',
      title: 'FinTech та ескроу-системи',
      subtitle: 'Ескроу-рушії, внутрішні книги подвійного запису, утримання коштів на гаманцях і антифрод-правила.',
      category: 'FinTech та платежі',
      statusLabel: 'Доступно для проєктів',
      tagline: 'Критична фінансова інфраструктура з математичною цілісністю книги обліку.',
      description:
        'Архітектура й доставка продакшн FinTech-платформ, ескроу-рушіїв, мультитенантних цифрових гаманців та внутрішніх книг подвійного запису. З незмінними журналами аудиту, багаторівневою перевіркою KYC/AML, антифродом на правилах та автоматизованим вирішенням спорів.',
      highlights: ['Книги подвійного запису', 'Багаторівневі перевірки KYC/AML', 'Ескроу-рушій без втрат'],
      capabilities: [
        { title: 'Ескроу та утримання транзакцій', description: 'Умовне утримання коштів, виплати за етапами, виплати кільком сторонам і розподіл комісій.' },
        { title: 'Внутрішні книги подвійного запису', description: 'Суворі незмінні проводки, що гарантують баланс гаманців між рахунками.' },
        { title: 'Багаторівневі KYC/AML та антифрод', description: 'Автоматична оцінка ризику, ліміти транзакцій за правилами, позначки підозрілої активності та верифікація особи.' },
        { title: 'Керування спорами та нотаріат', description: 'Модулі вирішення спорів для адмінів, симуляції логіки контрактів і незмінні журнали аудиту.' },
      ],
      runtime: 'Ізольований кластер високої доступності',
      deployment: 'Інфраструктура, сумісна з PCI-DSS / AWS',
      latency: '<15 мс на фіксацію транзакції',
    },
  },

  'backend-engineering': {
    es: {
      typeLabel: 'Servicio de ingeniería',
      title: 'Ingeniería backend',
      subtitle: 'Sistemas distribuidos, flotas de workers en Go de alta concurrencia y colas de eventos resilientes.',
      category: 'Sistemas distribuidos',
      statusLabel: 'Disponible para proyectos',
      tagline: 'Sistemas resilientes y de alto rendimiento, diseñados para escalar sin dramas.',
      description:
        'Ingeniería backend de nivel industrial con Go, Laravel, PostgreSQL y RabbitMQ. Diseñamos arquitecturas con transactional outbox, colas de eventos con deduplicación y flotas de workers de alta concurrencia capaces de procesar millones de tareas al día.',
      highlights: ['Transactional outbox', 'Workers en Go de alta concurrencia', 'Ejecución por debajo de 5 ms'],
      capabilities: [
        { title: 'Transactional outbox y colas de eventos', description: 'Entrega de mensajes «al menos una vez» garantizada con RabbitMQ, con deduplicación y reintentos acotados.' },
        { title: 'Demonios en Go de alta concurrencia', description: 'Microservicios con respuestas por debajo de 5 ms, consumo mínimo de memoria y paralelismo multinúcleo.' },
        { title: 'Esquema de base de datos y ajuste de consultas', description: 'Particionado en PostgreSQL, estrategias de índices y pools de conexiones para el máximo rendimiento de lectura y escritura.' },
        { title: 'Diseño guiado por el dominio (DDD)', description: 'Contextos delimitados claros, límites de monolito modular y modelos de dominio empresariales mantenibles.' },
      ],
      runtime: 'Docker / Kubernetes',
      deployment: 'Cualquier nube o servidores propios',
      latency: 'Normalmente por debajo de 5 ms',
    },
    uk: {
      typeLabel: 'Інженерна послуга',
      title: 'Бекенд-інженерія',
      subtitle: 'Розподілені системи, високонавантажені флоти воркерів на Go та стійкі черги подій.',
      category: 'Розподілені системи',
      statusLabel: 'Доступно для проєктів',
      tagline: 'Стійкі, високопродуктивні системи, що масштабуються без драми.',
      description:
        'Бекенд-інженерія промислового рівня на Go, Laravel, PostgreSQL і RabbitMQ. Проєктуємо архітектури з transactional outbox, черги подій із дедуплікацією та високонавантажені флоти воркерів, здатні обробляти мільйони завдань на добу.',
      highlights: ['Transactional outbox', 'Воркери на Go з високою паралельністю', 'Виконання за кілька мс'],
      capabilities: [
        { title: 'Transactional outbox і черги подій', description: 'Гарантована доставка повідомлень «принаймні раз» через RabbitMQ із дедуплікацією та обмеженими повторами.' },
        { title: 'Високонавантажені демони на Go', description: 'Мікросервіси з відповіддю менше 5 мс, мінімальним споживанням памʼяті та багатоядерним паралелізмом.' },
        { title: 'Схема БД і тюнінг запитів', description: 'Партиціювання PostgreSQL, стратегії індексів і пули зʼєднань для максимальної швидкості читання й запису.' },
        { title: 'Доменно-орієнтоване проєктування (DDD)', description: 'Чіткі обмежені контексти, межі модульного моноліту й підтримувані корпоративні доменні моделі.' },
      ],
      runtime: 'Docker / Kubernetes',
      deployment: 'Будь-яка хмара або власні сервери',
      latency: 'Зазвичай менше 5 мс',
    },
  },

  'identity-integrations': {
    es: {
      typeLabel: 'Servicio de seguridad',
      title: 'Identidad y SSO con Keycloak',
      subtitle: 'Migraciones empresariales de SSO a Keycloak, SAML 2.0, OIDC y aprovisionamiento de usuarios entre sistemas.',
      category: 'IAM empresarial',
      statusLabel: 'Disponible para proyectos',
      tagline: 'Autenticación centralizada y sin fricciones en todos los sistemas corporativos y SaaS.',
      description:
        'Despliegue en producción y migración sin tiempo de inactividad a Keycloak Single Sign-On (SSO). Conectamos aplicaciones distribuidas (Laravel, Drupal, Node.js, apps móviles) mediante OpenID Connect (OIDC) y SAML 2.0, implementamos control de acceso basado en roles (RBAC) y validamos tokens con JWT/JWKS.',
      highlights: ['Keycloak OIDC y SAML 2.0', 'Migración sin interrupciones', 'Validación de tokens JWT / JWKS'],
      capabilities: [
        { title: 'Despliegue y migración de SSO con Keycloak', description: 'Scripts de migración de usuarios, resolución de conflictos, temas personalizados de Keycloak y SPI de autenticadores.' },
        { title: 'Sincronización de identidad multiplataforma', description: 'Sincroniza en tiempo real identidades, perfiles y permisos entre aplicaciones dispares.' },
        { title: 'Federación SAML 2.0 y OpenID Connect', description: 'Inicio de sesión federado con Google, Microsoft Entra ID, Okta y directorios corporativos.' },
        { title: 'RBAC granular y verificación de tokens', description: 'Permisos por inquilino, políticas por recurso y verificación criptográfica de firmas JWT/JWKS.' },
      ],
      runtime: 'Clúster de identidad en contenedores',
      deployment: 'VPC privada / on-premise',
      latency: '<10 ms para emitir un token',
    },
    uk: {
      typeLabel: 'Послуга безпеки',
      title: 'Ідентифікація та Keycloak SSO',
      subtitle: 'Корпоративні міграції на Keycloak SSO, SAML 2.0, OIDC і надання доступу користувачам у кількох системах.',
      category: 'Корпоративний IAM',
      statusLabel: 'Доступно для проєктів',
      tagline: 'Зручна централізована автентифікація в усіх корпоративних і SaaS-системах.',
      description:
        'Розгортання в продакшні та міграція на Keycloak Single Sign-On (SSO) без простою. Повʼязуємо розподілені застосунки (Laravel, Drupal, Node.js, мобільні) через OpenID Connect (OIDC) і SAML 2.0, впроваджуємо рольовий контроль доступу (RBAC) та перевіряємо токени через JWT/JWKS.',
      highlights: ['Keycloak OIDC і SAML 2.0', 'Міграція без простою', 'Перевірка токенів JWT / JWKS'],
      capabilities: [
        { title: 'Розгортання та міграція Keycloak SSO', description: 'Скрипти міграції користувачів, розвʼязання конфліктів, власні теми Keycloak і SPI автентифікаторів.' },
        { title: 'Синхронізація ідентифікації між платформами', description: 'Синхронізує ідентифікатори, профілі й дозволи між різнорідними застосунками в реальному часі.' },
        { title: 'Федерація SAML 2.0 та OpenID Connect', description: 'Федеративний вхід через Google, Microsoft Entra ID, Okta та корпоративні каталоги.' },
        { title: 'Детальний RBAC і перевірка токенів', description: 'Дозволи в межах орендаря, політики ресурсів і криптографічна перевірка підпису JWT/JWKS.' },
      ],
      runtime: 'Кластер ідентифікації в контейнерах',
      deployment: 'Приватна VPC / on-premise',
      latency: '<10 мс на видачу токена',
    },
  },

  'observability-operations': {
    es: {
      typeLabel: 'Servicio de operaciones',
      title: 'Observabilidad y OpenTelemetry',
      subtitle: 'Stack LGTM autoalojado (Loki, Grafana, Tempo, Prometheus, Alloy) para sustituir a Datadog.',
      category: 'DevOps y SRE',
      statusLabel: 'Disponible para proyectos',
      tagline: 'Visibilidad total de la infraestructura sin facturas prohibitivas de monitorización SaaS.',
      description:
        'Sustituimos servicios de monitorización costosos (Datadog, NewRelic) por un stack moderno y autoalojado de OpenTelemetry (OTLP): Grafana, Prometheus, Loki, Tempo y Grafana Alloy. Métricas unificadas, logs estructurados, trazas distribuidas y alertas proactivas sin gastos de licencias.',
      highlights: ['Telemetría OTLP completa', 'Sin sobrecoste SaaS', 'Ingesta de trazas en menos de un segundo'],
      capabilities: [
        { title: 'Migración de Datadog a OTLP', description: 'Sustitución sin sobresaltos del APM SaaS por Grafana, Loki, Tempo y Prometheus.' },
        { title: 'Instrumentación OpenTelemetry (OTLP)', description: 'Trazado distribuido de extremo a extremo entre microservicios, bases de datos y colas de workers.' },
        { title: 'Grafana Alloy y flujo de logs', description: 'Colector ligero unificado que transmite logs de contenedores, estadísticas del host y métricas propias de la aplicación.' },
        { title: 'Reglas inteligentes de Alertmanager', description: 'Alertas de incidentes sin ruido, enviadas a Telegram, Slack o PagerDuty con enlaces a la causa raíz.' },
      ],
      runtime: 'Docker Swarm ligero / independiente / K8s',
      deployment: 'Autoalojado / nube híbrida',
      latency: 'Ingesta de logs en menos de un segundo',
    },
    uk: {
      typeLabel: 'Операційна послуга',
      title: 'Observability та OpenTelemetry',
      subtitle: 'Власний стек LGTM (Loki, Grafana, Tempo, Prometheus, Alloy) замість Datadog.',
      category: 'DevOps і SRE',
      statusLabel: 'Доступно для проєктів',
      tagline: 'Повна видимість інфраструктури без захмарних рахунків за SaaS-моніторинг.',
      description:
        'Замінюємо дорогі сервіси моніторингу (Datadog, NewRelic) на сучасний власний стек OpenTelemetry (OTLP): Grafana, Prometheus, Loki, Tempo і Grafana Alloy. Єдині метрики, структуровані логи, розподілені трейси й проактивні сповіщення без витрат на ліцензії.',
      highlights: ['Повна телеметрія OTLP', 'Без зростання SaaS-витрат', 'Приймання трейсів за частки секунди'],
      capabilities: [
        { title: 'Міграція з Datadog на OTLP', description: 'Плавна заміна дорогого SaaS-APM на Grafana, Loki, Tempo і Prometheus.' },
        { title: 'Інструментація OpenTelemetry (OTLP)', description: 'Наскрізне розподілене трасування мікросервісів, баз даних і черг воркерів.' },
        { title: 'Grafana Alloy і потік логів', description: 'Єдиний легкий збирач, що передає логи контейнерів, статистику хостів і власні метрики застосунків.' },
        { title: 'Розумні правила Alertmanager', description: 'Сповіщення про інциденти без шуму в Telegram, Slack або PagerDuty з посиланнями на першопричину.' },
      ],
      runtime: 'Легкий Docker Swarm / окремий сервер / K8s',
      deployment: 'Власний хостинг / гібридна хмара',
      latency: 'Приймання логів за частки секунди',
    },
  },

  'legacy-modernization': {
    es: {
      typeLabel: 'Servicio de modernización',
      title: 'Modernización de sistemas heredados',
      subtitle: 'Refactorización de código PHP/Laravel heredado, reduciendo el coste de servidores un 50 % sin interrupciones.',
      category: 'Refactorización y optimización en la nube',
      statusLabel: 'Disponible para proyectos',
      tagline: 'Convertimos código heredado frágil en sistemas modernos, mantenibles y de alto impacto.',
      description:
        'Modernización segura e incremental de bases de código heredadas (CodeIgniter, Laravel/PHP antiguos, arquitecturas monolíticas). Refactorizamos con principios SOLID y DRY, separamos las rutas críticas en workers de Go, eliminamos la deuda técnica y reducimos hasta un 50 % el coste de la infraestructura en la nube.',
      highlights: ['Hasta un 50 % menos de coste en la nube', 'Refactorización sin interrupciones', '+20 % de velocidad en BD'],
      capabilities: [
        { title: 'De monolito a servicios modulares', description: 'Extraemos los cuellos de botella de alta carga a servicios independientes en Go/PHP sin detener el desarrollo del negocio.' },
        { title: 'Actualización de frameworks y PHP', description: 'Actualizaciones probadas desde versiones antiguas de PHP/Laravel/CodeIgniter con compatibilidad total de la API.' },
        { title: 'Infraestructura y reducción de costes', description: 'Dimensionamiento correcto de instancias en la nube, contenerización de cargas y reducción del gasto en servidores de hasta un 50 %.' },
        { title: 'Operaciones y flujos automatizados', description: 'Automatización de cuellos de botella operativos manuales (con un historial probado de 250 000 $ al año ahorrados en soporte).' },
      ],
      runtime: 'Contenedores Docker optimizados',
      deployment: 'Blue/Green sin interrupciones',
      latency: '20-60 % menos de latencia',
    },
    uk: {
      typeLabel: 'Послуга модернізації',
      title: 'Модернізація застарілих систем',
      subtitle: 'Рефакторинг застарілого коду PHP/Laravel зі скороченням витрат на сервери на 50% без простою.',
      category: 'Рефакторинг і оптимізація хмари',
      statusLabel: 'Доступно для проєктів',
      tagline: 'Перетворюємо крихкий застарілий код на сучасні системи, які легко підтримувати.',
      description:
        'Безпечна поступова модернізація застарілих кодових баз (CodeIgniter, старі Laravel/PHP, монолітні архітектури). Рефакторимо за принципами SOLID і DRY, виносимо критичні шляхи у воркери на Go, усуваємо технічний борг і знижуємо витрати на хмарну інфраструктуру до 50%.',
      highlights: ['До 50% економії на хмарі', 'Рефакторинг без простою', '+20% швидкості БД'],
      capabilities: [
        { title: 'Від моноліту до модульних сервісів', description: 'Виносимо навантажені вузькі місця в незалежні сервіси на Go/PHP, не зупиняючи розвиток бізнесу.' },
        { title: 'Оновлення фреймворків і PHP', description: 'Перевірені оновлення зі старих версій PHP/Laravel/CodeIgniter зі 100% зворотною сумісністю API.' },
        { title: 'Інфраструктура та скорочення витрат', description: 'Правильний підбір розмірів хмарних інстансів, контейнеризація навантажень і скорочення витрат на сервери до 50%.' },
        { title: 'Автоматизація операцій і процесів', description: 'Автоматизація ручних операційних вузьких місць (підтверджені заощадження $250 тис. на рік на підтримці).' },
      ],
      runtime: 'Оптимізовані Docker-контейнери',
      deployment: 'Blue/Green без простою',
      latency: 'Зниження затримки на 20-60%',
    },
  },

  'architecture-consulting': {
    es: {
      typeLabel: 'Servicio de consultoría',
      title: 'Arquitectura y consultoría',
      subtitle: 'Diseño de sistemas, planes de escalabilidad, registros de decisiones (ADR) y estándares de ingeniería.',
      category: 'Estrategia técnica',
      statusLabel: 'Disponible para consultoría',
      tagline: 'Decisiones de ingeniería estratégicas para construir software duradero y escalable.',
      description:
        'Auditorías de arquitectura en profundidad y asesoramiento de alto impacto para responsables de ingeniería. Identificamos bloqueos de base de datos, fugas de memoria y cuellos de botella de escalado, elaboramos registros de decisiones de arquitectura (ADR) y establecemos estándares de ingeniería de primer nivel.',
      highlights: ['Eliminación de cuellos de botella', 'Registros de decisiones de arquitectura', 'Hojas de ruta de escalabilidad'],
      capabilities: [
        { title: 'Auditorías de rendimiento y escalabilidad', description: 'Detectamos bloqueos en consultas, fugas de memoria, límites de concurrencia y picos de latencia en todo el código.' },
        { title: 'Registros de decisiones de arquitectura (ADR)', description: 'Documentación formal que recoge la justificación de la tecnología elegida, los compromisos y las hojas de ruta de escalado.' },
        { title: 'Selección de tecnología de IA', description: 'Evaluación honesta de si RAG, fine-tuning, enjambres de agentes o algoritmos tradicionales resuelven mejor tu problema.' },
        { title: 'Estándares de ingeniería del equipo', description: 'Estándares de revisión de código, convenciones de esquema, bases de pruebas E2E con Playwright y listas de verificación de lanzamiento.' },
      ],
      runtime: 'Consultoría y revisiones de ingeniería',
      deployment: 'Asesoramiento técnico directo',
      latency: 'Ingeniería de alto impacto',
    },
    uk: {
      typeLabel: 'Консультаційна послуга',
      title: 'Архітектура та консалтинг',
      subtitle: 'Проєктування систем, плани масштабування, записи рішень (ADR) та інженерні стандарти.',
      category: 'Технічна стратегія',
      statusLabel: 'Доступно для консультацій',
      tagline: 'Стратегічні інженерні рішення для створення довговічного, масштабованого софту.',
      description:
        'Глибокі архітектурні аудити та цінні поради для технічних керівників. Знаходимо блокування в базах даних, витоки памʼяті й вузькі місця масштабування, готуємо записи архітектурних рішень (ADR) та впроваджуємо інженерні стандарти світового рівня.',
      highlights: ['Усунення вузьких місць', 'Записи архітектурних рішень', 'Дорожні карти масштабування'],
      capabilities: [
        { title: 'Аудити продуктивності та масштабованості', description: 'Знаходимо блокування запитів до БД, витоки памʼяті, ліміти паралельності та сплески затримки в коді.' },
        { title: 'Записи архітектурних рішень (ADR)', description: 'Формальна документація з обґрунтуванням вибору технологій, компромісами та планами масштабування.' },
        { title: 'Вибір AI-технологій', description: 'Чесна оцінка того, що краще розвʼязує вашу задачу: RAG, тонке налаштування, рої агентів чи традиційні алгоритми.' },
        { title: 'Інженерні стандарти команди', description: 'Стандарти код-рев’ю, угоди щодо схем, базові E2E-тести на Playwright і чек-листи релізів.' },
      ],
      runtime: 'Консалтинг та інженерні рев’ю',
      deployment: 'Пряма технічна консультація',
      latency: 'Інженерія з високим ефектом',
    },
  },
}
