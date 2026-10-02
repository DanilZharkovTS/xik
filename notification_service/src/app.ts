import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import appRoutes from './app.routes'
import { errorHandler } from './shared/middlewares/errorHandler'
import { serviceAuthMiddleware } from './shared/middlewares/service-auth.middleware'

dotenv.config()

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use('/api', serviceAuthMiddleware, appRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3002

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})
