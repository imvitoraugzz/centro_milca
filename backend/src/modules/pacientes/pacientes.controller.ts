import { Request, Response } from 'express'
import { PacientesService } from './pacientes.service'

export class PacientesController {
    private pacientesService:  PacientesService

    constructor(){
        this.pacientesService = new PacientesService()
    }
    
    public criarPaciente = async (req: Request, res: Response ) : Promise<Response> => {
        try {
            const { nome, cartaoSus, dataNascimento, telefone, endereco, nomeMae } = req.body
            
            if(!nome || !cartaoSus || !dataNascimento || !telefone || !endereco || !nomeMae){
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.' })
            }

            const paciente = await this.pacientesService.criarPaciente({ nome, cartaoSus, dataNascimento, telefone, endereco, nomeMae })
            return res.status(201).json(paciente)
        } catch(erro: any) {
            return res.status(400).json({ error: erro.message || 'Erro ao cadastrar paciente.'})
        }
    }

    public atualizarPaciente = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params
            const dadosAlterados = req.body

            const paciente = await this.pacientesService.atualizar(id, dadosAlterados)
            return res.status(200).json(paciente)
        } catch(erro: any){
            return res.status(400).json({ error: erro.message || 'Erro ao atualizar paciente.'})
        }
    }
}