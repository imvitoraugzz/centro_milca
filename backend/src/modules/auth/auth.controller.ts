import { Request, Response } from 'express'
import { AuthService } from './auth.service'

export class AuthController {
    private authService: AuthService

    constructor(){
        this.authService = new AuthService()
    }

    public registrar = async (req: Request, res: Response) : Promise<Response> => {
        try {
            const { nome, email, senha } = req.body

            if(!nome || !email || !senha){
                return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' })
            }

            if(!email.includes('@')){
                return res.status(400).json({ error: 'O formato de email informado é inválido.'})
            }

            if(senha.length < 6){
                return res.status(400).json({ error: 'A senha deve ter, no mínimo, 6 caracteres.' })
            }

            const novoUsuario = await this.authService.registrar({ nome, email, senha })
            return res.status(201).json(novoUsuario)
        } catch(erro: any){
            return res.status(400).json({ error: erro.message || 'Erro interno ao registar usuário.' })
        }

    }
    
    public login =  async (req: Request, res: Response) : Promise<Response> => {
        try {
            const { email, senha } = req.body

            if(!email || !senha){
                return res.status(400).json({ error: 'Email e senha são obrigatórios.'})
            }

            const dadosSessao =  await this.authService.login({ email, senha })
            return res.status(200).json({ dadosSessao })
        } catch( erro: any){
            return res.status(400).json({ error: erro.message || 'Erro na autenticação.' })
        }
    }

    public deletar =  async (req: Request, res: Response) :  Promise<Response> => {
        try {
            const { id } = req.params

            if(req.usuario.role !== 'ADMIN'){
                return res.status(403).json({ error: 'Acesso negado! Apenas administradores podem deletar usuários.' })
            }

            await this.authService.deletarUsuario(id)
            return res.status(204).send()
        } catch(erro: any){
                return res.status(400).json({ error: erro.message || 'Erro interno ao deletar usuário.' })
        }
    }
}