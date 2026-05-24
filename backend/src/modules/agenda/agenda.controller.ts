import { Request, Response } from 'express'
import { AgendaService } from './agenda.service'

export class AgendaController {
    private agendaService: AgendaService

    constructor(){
        this.agendaService = new AgendaService()
    }

    public criarAgendamento = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { profissionalId, ano, mes, diasSemana, horarioInicio, horarioFim } = req.body

            if(!profissionalId || !ano || !mes || !diasSemana || !horarioInicio || !horarioFim ){
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.'})
            }

            const totalHorarios = await this.agendaService.gerarGradeMensal({ profissionalId, ano, mes, diasSemana, horarioInicio, horarioFim })
            return res.status(201).json({ message: `Grade gerada com sucesso. ${totalHorarios} foram disponibilizados.`})
        } catch(erro: any){
            return res.status(400).json({ error: erro.message || 'Erro ao gerar grade mensal.'})
        }
    }

    public bloquearData = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { profissionalId, data } = req.body

            if(!profissionalId || !data) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.'})
            }
            
            const resultado = await this.agendaService.bloquearAgenda({ profissionalId, data })

            if(resultado.conflito){
                return res.status(409).json({ error: 'Conflito de agendamento. Existem pacientes agendados para esta data. ', pacientesAfetados: resultado.pacientesAfetados })
            }
            return res.status(200).json({ message: 'Agenda bloqueada com sucesso. Nenhum paciente foi afetado.'})
        }catch(erro: any){
            return res.status(400).json({ error: erro.message || 'Erro ao bloquear agenda.'})
        }
    }

    public listarHorarios = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { profissionalId, data } = req.query

            if(!profissionalId || !data) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.'})
            }
            const horarios = await this.agendaService.listarHorariosDisponiveis({
                profissionalId: String(profissionalId),
                data: String(data)
            })

            return res.status(200).json(horarios)
        } catch(erro: any) {
            return res.status(400).json({ error: erro.message || 'Erro ao listar horários disponíveis.'})
        }
    }

    public criarAgendamento = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { pacienteId, profissionalId, data, horario } = req.body

            if(!pacienteId || !profissionalId || !data || !horario) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.'})
            }

            const agendamento = await this.agendaService.agendarConsulta({ 
                pacienteId,
                profissionalId: profissionalId,
                data,
                horario })
                return res.status(201).json(agendamento)
        } catch(erro){
            return res.status(400).json({ error: erro.message || 'Erro ao criar agendamento.'})
        }
    }
}