import { Router } from 'express'
import { authRoutes } from '../../../modules/auth/auth.controller'

const routes = Router()

routes.use('/auth', authRoutes)

export { routes }