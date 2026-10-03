import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import appRoutes from './app.routes.js'
import { errorHandler } from './shared/middlewares/errorHandler.js'
import { billingMiddlewares } from './modules/billing/billing.middlewares.js'
import { mediaDir } from './modules/media/storage.js'
import { billingController } from './modules/billing/billing.controller.js'

dotenv.config()

export const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

app.post('/billing/webhook', express.raw({ type: 'application/json' }), billingMiddlewares.validateWebhookSignature, billingController.stripeWebhook)

// Зображення статей лежать на сервері; назви файлів незмінні (містять випадковий id), тож кеш довгий.
app.use(
  '/media',
  express.static(mediaDir(), {
    index: false,
    dotfiles: 'deny',
    immutable: true,
    maxAge: '1y',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    },
  })
)

app.use(express.json())

app.use(cookieParser())

app.use('/api', appRoutes)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use(errorHandler)

const PORT = process.env.PORT || 5001

// У тестах сервер не слухає порт: supertest сам піднімає app.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`)
  })
}

