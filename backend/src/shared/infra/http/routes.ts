import { Router } from 'express'
import { authRoutes } from '../../../modules/auth/auth.controller'
import { pacientesRoutes } from '../../../modules/pacientes/pacientes.routes'
import { agendaRoutes } from '../../../modules/agenda/agenda.routes'


const routes = Router()

routes.use('/auth', authRoutes)
routes.use('/pacientes', pacientesRoutes)
routes.use('/agenda', agendaRoutes)

export { routes }