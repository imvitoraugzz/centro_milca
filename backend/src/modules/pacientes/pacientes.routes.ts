import { Router } from 'express'
import { PacientesController } from './pacientes.controller'
import { verificarAutenticacao } from '../../shared/infra/http/middlewares/verificarAutenticacao'

const pacientesRoutes = Router()
const pacientesController = new PacientesController()

pacientesRoutes.use(verificarAutenticacao)
pacientesRoutes.post('/', pacientesController.criarPaciente)
pacientesRoutes.put('/:id', pacientesController.atualizarPaciente)

export { pacientesRoutes }
