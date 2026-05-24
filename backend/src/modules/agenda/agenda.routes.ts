import { Router } from 'express'
import { AgendaController } from './agenda.controller'
import { verificarAutenticacao } from '../../shared/infra/http/middlewares/verificarAutenticacao'

const agendaRoutes = Router()
const agendaController = new AgendaController()

agendaRoutes.use(verificarAutenticacao)

agendaRoutes.post('/criar', agendaController.criarAgendamento)
agendaRoutes.post('/bloquear', agendaController.bloquearData)

agendaRoutes.get('/horarios', agendaController.listarHorarios)
agendaRoutes.post('/agendar', agendaController.criarAgendamento)

export { agendaRoutes }