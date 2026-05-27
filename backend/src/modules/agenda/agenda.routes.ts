import { Router } from 'express'
import { AgendaController } from './agenda.controller'
import { verificarAutenticacao } from '../../shared/infra/http/middlewares/verificarAutenticacao'

const agendaRoutes = Router()
const agendaController = new AgendaController()

agendaRoutes.use(verificarAutenticacao)

//Rotas Administrativas de configuração da agenda
agendaRoutes.post('/grade', agendaController.gerarGrade)
agendaRoutes.post('/bloquear', agendaController.bloquearData)

//Rotas de Operação de consultas por pacientes
agendaRoutes.get('/horarios', agendaController.listarHorarios)
agendaRoutes.post('/agendar', agendaController.criarAgendamento)
agendaRoutes.patch('/agendar/:id/remarcar', agendaController.remarcarConsulta)
agendaRoutes.get('/relatorio', agendaController.obterRelatorio)
agendaRoutes.get('/pacientes/:pacienteId/faltas', agendaController.obterFaltasPaciente)

export { agendaRoutes }