import { Router } from 'express'
import { AuthController } from './auth.controller'
import { verificarAutenticacao } from '../../shared/infra/http/middlewares/verificarAutenticacao'

const authRoutes = Router()
const authController = new AuthController()

authRoutes.post('/registar', authController.registrar)
authRoutes.post('/login', authController.login)

authRoutes.use(verificarAutenticacao) // Middleware para proteger as rotas abaixo

authRoutes.delete('/deletar/:id', authController.deletar)

export { authRoutes }