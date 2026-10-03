// Тексти листів трьома мовами. Мова береться з профілю користувача (User.locale),
// без неї лист іде англійською.
export type EmailLocale = 'en' | 'es' | 'uk'
export const EMAIL_LOCALES: readonly EmailLocale[] = ['en', 'es', 'uk']

export type EmailKind =
  | 'signingKey'
  | 'subscriptionStarted'
  | 'subscriptionCanceled'
  | 'subscriptionDeleted'
  | 'paymentFailed'

export interface EmailData {
  userName?: string
  productName: string
  signingKey?: string
}

type Tone = 'info' | 'warn' | 'danger' | 'neutral'

interface Copy {
  subject: (d: EmailData) => string
  title: string
  heading: string
  // Абзаци дозволяють <strong>; значення з даних екрануються перед підстановкою.
  paragraphs: (d: { product: string }) => string[]
  callout?: { tone: Tone; html: (d: { product: string }) => string }
  footerNote?: string
  text: (d: EmailData) => string
}

interface Common {
  hello: (name: string) => string
  fallbackName: string
  sentBy: string
  signingKeyLabel: string
  signature: string
}

export const COMMON: Record<EmailLocale, Common> = {
  en: { hello: (n) => `Hi ${n},`, fallbackName: 'there', sentBy: 'This email was sent by XIK.', signingKeyLabel: 'Signing key', signature: '— XIK' },
  es: { hello: (n) => `Hola, ${n}:`, fallbackName: 'cliente', sentBy: 'Este correo lo ha enviado XIK.', signingKeyLabel: 'Clave de firma', signature: '— XIK' },
  uk: { hello: (n) => `Вітаємо, ${n}!`, fallbackName: 'друже', sentBy: 'Цей лист надіслано від XIK.', signingKeyLabel: 'Ключ підпису', signature: '— XIK' },
}

const p = (s: string) => `<strong style="color: #171717;">${s}</strong>`

export const COPY: Record<EmailKind, Record<EmailLocale, Copy>> = {
  signingKey: {
    en: {
      subject: () => 'XIK — Your signing key',
      title: 'Your XIK signing key',
      heading: 'Your signing key',
      paragraphs: ({ product }) => [`Here is your signing key for ${p(product)}.`],
      callout: { tone: 'warn', html: () => '<strong>Keep this key private.</strong> Do not share it with anyone.' },
      footerNote: 'If you did not request this signing key, you can safely ignore this email.',
      text: (d) => `Here is your signing key for ${d.productName}:\n\n${d.signingKey}\n\nKeep this key private. Do not share it with anyone.\n\nIf you did not request this signing key, you can safely ignore this email.`,
    },
    es: {
      subject: () => 'XIK — Su clave de firma',
      title: 'Su clave de firma de XIK',
      heading: 'Su clave de firma',
      paragraphs: ({ product }) => [`Esta es su clave de firma para ${p(product)}.`],
      callout: { tone: 'warn', html: () => '<strong>Mantenga esta clave en privado.</strong> No la comparta con nadie.' },
      footerNote: 'Si no solicitó esta clave de firma, puede ignorar este correo.',
      text: (d) => `Esta es su clave de firma para ${d.productName}:\n\n${d.signingKey}\n\nMantenga esta clave en privado. No la comparta con nadie.\n\nSi no solicitó esta clave de firma, puede ignorar este correo.`,
    },
    uk: {
      subject: () => 'XIK — Ваш ключ підпису',
      title: 'Ваш ключ підпису XIK',
      heading: 'Ваш ключ підпису',
      paragraphs: ({ product }) => [`Ось ваш ключ підпису для ${p(product)}.`],
      callout: { tone: 'warn', html: () => '<strong>Зберігайте цей ключ у таємниці.</strong> Нікому його не передавайте.' },
      footerNote: 'Якщо ви не запитували цей ключ підпису, просто проігноруйте лист.',
      text: (d) => `Ось ваш ключ підпису для ${d.productName}:\n\n${d.signingKey}\n\nЗберігайте цей ключ у таємниці. Нікому його не передавайте.\n\nЯкщо ви не запитували цей ключ підпису, просто проігноруйте лист.`,
    },
  },
  subscriptionStarted: {
    en: {
      subject: (d) => `XIK — Welcome! Your ${d.productName} subscription is active 🎉`,
      title: 'Welcome to your subscription!',
      heading: 'Subscription activated! 🎉',
      paragraphs: ({ product }) => [
        `Thank you for subscribing to ${p(product)}! Your payment was successful, and your subscription is now officially active.`,
        'You can manage your subscription settings and billing details directly in your account at any time. If you ever have questions, we are here to help!',
      ],
      callout: { tone: 'info', html: ({ product }) => `<strong>Full access unlocked:</strong><br />You now have unrestricted access to all features and updates of ${product}.` },
      text: (d) => `Thank you for subscribing to ${d.productName}! Your payment was successful, and your subscription is now active.\n\nYou have full access to all features and updates. You can manage your subscription in your account.\n\nEnjoy using ${d.productName}!`,
    },
    es: {
      subject: (d) => `XIK — ¡Bienvenido! Su suscripción a ${d.productName} está activa 🎉`,
      title: '¡Bienvenido a su suscripción!',
      heading: '¡Suscripción activada! 🎉',
      paragraphs: ({ product }) => [
        `¡Gracias por suscribirse a ${p(product)}! El pago se ha realizado correctamente y su suscripción ya está activa.`,
        'Puede gestionar su suscripción y los datos de facturación en su cuenta cuando quiera. Si tiene alguna pregunta, estamos para ayudarle.',
      ],
      callout: { tone: 'info', html: ({ product }) => `<strong>Acceso completo desbloqueado:</strong><br />Ya tiene acceso a todas las funciones y actualizaciones de ${product}.` },
      text: (d) => `¡Gracias por suscribirse a ${d.productName}! El pago se ha realizado correctamente y su suscripción ya está activa.\n\nTiene acceso completo a todas las funciones y actualizaciones. Puede gestionar su suscripción en su cuenta.\n\n¡Que disfrute de ${d.productName}!`,
    },
    uk: {
      subject: (d) => `XIK — Вітаємо! Підписка на ${d.productName} активна 🎉`,
      title: 'Ласкаво просимо до вашої підписки!',
      heading: 'Підписку активовано! 🎉',
      paragraphs: ({ product }) => [
        `Дякуємо, що підписалися на ${p(product)}! Оплата пройшла успішно, і підписка вже активна.`,
        'Керувати підпискою та платіжними даними можна будь-коли у своєму кабінеті. Якщо виникнуть запитання, ми поруч.',
      ],
      callout: { tone: 'info', html: ({ product }) => `<strong>Повний доступ відкрито:</strong><br />Тепер вам доступні всі функції й оновлення ${product}.` },
      text: (d) => `Дякуємо, що підписалися на ${d.productName}! Оплата пройшла успішно, і підписка вже активна.\n\nВам доступні всі функції й оновлення. Керувати підпискою можна у своєму кабінеті.\n\nГарного користування ${d.productName}!`,
    },
  },
  subscriptionCanceled: {
    en: {
      subject: () => 'XIK — Your subscription was canceled',
      title: 'Your subscription was canceled',
      heading: 'Your subscription was canceled',
      paragraphs: ({ product }) => [`Your subscription for ${p(product)} has been canceled.`],
      callout: { tone: 'neutral', html: () => '<strong>You will no longer be charged.</strong> Your access may remain available until the end of your current billing period.' },
      text: (d) => `Your subscription for ${d.productName} has been canceled.\n\nYou will no longer be charged for this subscription. Your access may remain available until the end of your current billing period.\n\nIf you canceled by mistake, you can subscribe again at any time.`,
    },
    es: {
      subject: () => 'XIK — Su suscripción se ha cancelado',
      title: 'Su suscripción se ha cancelado',
      heading: 'Su suscripción se ha cancelado',
      paragraphs: ({ product }) => [`Su suscripción a ${p(product)} se ha cancelado.`],
      callout: { tone: 'neutral', html: () => '<strong>No se le volverá a cobrar.</strong> Es posible que conserve el acceso hasta el final del período de facturación actual.' },
      text: (d) => `Su suscripción a ${d.productName} se ha cancelado.\n\nNo se le volverá a cobrar por esta suscripción. Es posible que conserve el acceso hasta el final del período de facturación actual.\n\nSi la canceló por error, puede suscribirse de nuevo en cualquier momento.`,
    },
    uk: {
      subject: () => 'XIK — Вашу підписку скасовано',
      title: 'Вашу підписку скасовано',
      heading: 'Вашу підписку скасовано',
      paragraphs: ({ product }) => [`Вашу підписку на ${p(product)} скасовано.`],
      callout: { tone: 'neutral', html: () => '<strong>Кошти більше не списуватимуться.</strong> Доступ може зберегтися до кінця поточного платіжного періоду.' },
      text: (d) => `Вашу підписку на ${d.productName} скасовано.\n\nКошти за цю підписку більше не списуватимуться. Доступ може зберегтися до кінця поточного платіжного періоду.\n\nЯкщо ви скасували підписку помилково, оформити її знову можна будь-коли.`,
    },
  },
  subscriptionDeleted: {
    en: {
      subject: () => 'XIK — Your subscription was deleted',
      title: 'Your subscription has been deleted',
      heading: 'Subscription deleted',
      paragraphs: ({ product }) => [`Your subscription for ${p(product)} has been deleted.`],
      callout: { tone: 'danger', html: ({ product }) => `<strong>Your access has been revoked.</strong> If you wish to use ${product} again, you can resubscribe at any time.` },
      text: (d) => `Your subscription for ${d.productName} has been deleted.\n\nYour access has been revoked. If you wish to use ${d.productName} again, you can resubscribe at any time.\n\nIf you believe this is a mistake or need help, please contact our support team.`,
    },
    es: {
      subject: () => 'XIK — Su suscripción se ha eliminado',
      title: 'Su suscripción se ha eliminado',
      heading: 'Suscripción eliminada',
      paragraphs: ({ product }) => [`Su suscripción a ${p(product)} se ha eliminado.`],
      callout: { tone: 'danger', html: ({ product }) => `<strong>Su acceso ha sido revocado.</strong> Si desea volver a usar ${product}, puede suscribirse de nuevo en cualquier momento.` },
      text: (d) => `Su suscripción a ${d.productName} se ha eliminado.\n\nSu acceso ha sido revocado. Si desea volver a usar ${d.productName}, puede suscribirse de nuevo en cualquier momento.\n\nSi cree que es un error o necesita ayuda, póngase en contacto con nuestro equipo de soporte.`,
    },
    uk: {
      subject: () => 'XIK — Вашу підписку видалено',
      title: 'Вашу підписку видалено',
      heading: 'Підписку видалено',
      paragraphs: ({ product }) => [`Вашу підписку на ${p(product)} видалено.`],
      callout: { tone: 'danger', html: ({ product }) => `<strong>Доступ скасовано.</strong> Якщо захочете знову користуватися ${product}, оформіть підписку ще раз.` },
      text: (d) => `Вашу підписку на ${d.productName} видалено.\n\nДоступ скасовано. Якщо захочете знову користуватися ${d.productName}, оформіть підписку ще раз.\n\nЯкщо вважаєте, що це помилка, або потрібна допомога, зверніться до нашої підтримки.`,
    },
  },
  paymentFailed: {
    en: {
      subject: () => 'XIK — Payment attempt unsuccessful',
      title: 'Payment unsuccessful — action required',
      heading: 'Payment attempt unsuccessful',
      paragraphs: ({ product }) => [
        `We attempted to charge your card for ${p(product)}, but the transaction could not be completed.`,
        'To prevent any interruption of your service, please verify or update your payment information.',
      ],
      callout: { tone: 'warn', html: () => '<strong>Please check your payment details:</strong><br />Ensure that your card has sufficient funds, has not expired, and that online transactions are enabled. We will automatically retry the charge soon.' },
      text: (d) => `We attempted to charge your card for ${d.productName}, but the transaction could not be completed.\n\nPlease check your payment details: ensure your card has sufficient funds, has not expired, and that online transactions are enabled. We will automatically retry the charge soon.\n\nTo prevent any interruption of your service, please verify or update your payment information.`,
    },
    es: {
      subject: () => 'XIK — No se pudo realizar el pago',
      title: 'No se pudo realizar el pago: se requiere acción',
      heading: 'No se pudo realizar el pago',
      paragraphs: ({ product }) => [
        `Intentamos cobrar a su tarjeta ${p(product)}, pero la transacción no pudo completarse.`,
        'Para evitar cualquier interrupción del servicio, verifique o actualice sus datos de pago.',
      ],
      callout: { tone: 'warn', html: () => '<strong>Revise sus datos de pago:</strong><br />Compruebe que la tarjeta tiene fondos suficientes, no ha caducado y admite pagos en línea. Volveremos a intentar el cobro automáticamente en breve.' },
      text: (d) => `Intentamos cobrar a su tarjeta ${d.productName}, pero la transacción no pudo completarse.\n\nRevise sus datos de pago: compruebe que la tarjeta tiene fondos suficientes, no ha caducado y admite pagos en línea. Volveremos a intentar el cobro automáticamente en breve.\n\nPara evitar cualquier interrupción del servicio, verifique o actualice sus datos de pago.`,
    },
    uk: {
      subject: () => 'XIK — Не вдалося провести платіж',
      title: 'Платіж не пройшов — потрібна дія',
      heading: 'Не вдалося провести платіж',
      paragraphs: ({ product }) => [
        `Ми спробували списати кошти з вашої картки за ${p(product)}, але транзакцію не вдалося завершити.`,
        'Щоб сервіс працював без перерв, перевірте або оновіть платіжні дані.',
      ],
      callout: { tone: 'warn', html: () => '<strong>Перевірте платіжні дані:</strong><br />Переконайтеся, що на картці достатньо коштів, вона не прострочена й дозволяє онлайн-платежі. Незабаром ми автоматично повторимо спробу.' },
      text: (d) => `Ми спробували списати кошти з вашої картки за ${d.productName}, але транзакцію не вдалося завершити.\n\nПеревірте платіжні дані: переконайтеся, що на картці достатньо коштів, вона не прострочена й дозволяє онлайн-платежі. Незабаром ми автоматично повторимо спробу.\n\nЩоб сервіс працював без перерв, перевірте або оновіть платіжні дані.`,
    },
  },
}
