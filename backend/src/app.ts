import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import appRoutes from './app.routes.js'
import { errorHandler } from './shared/middlewares/errorHandler.js'
import { billingMiddlewares } from './modules/billing/billing.middlewares.js'
import { billingController } from './modules/billing/billing.controller.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

app.post('/billing/webhook', express.raw({ type: 'application/json' }), billingMiddlewares.validateWebhookSignature, billingController.stripeWebhook)

app.use(express.json())

app.use(cookieParser())

app.use('/api', appRoutes)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use(errorHandler)

const PORT = process.env.PORT || 5001

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})

