import { Request, Response } from 'express'
import { AgendaService } from './agenda.service'

export class AgendaController {
    private agendaService: AgendaService

    constructor(){
        this.agendaService = new AgendaService()
    }

    public gerarGrade = async (req: Request, res: Response): Promise<Response> => {
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
        } catch(erro: any){
            return res.status(400).json({ error: erro.message || 'Erro ao criar agendamento.'})
        }
    }

    public remarcarConsulta = async( req: Request, res: Response): Promise<Response> => {
        try {
            const { id } = req.params //id do agendamento que vem na URL
            const { novaData, novoHorario } = req.body

            if(!novaData || !novoHorario) {
                return res.status(400).json({ error: 'Nova data e horário são obrigatórios.'})
            }

            const agendamentoRemarcado = await this.agendaService.remarcarConsulta({
                agendamentoId: id,
                novaData,
                novoHorario
            })
            return res.status(200).json(agendamentoRemarcado)
        } catch(erro: any){
            return res.status(400).json({ error: erro.message || 'Erro ao remarcar consulta.'})
        }
    } 

    public obterRelatorio = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { periodo, dataReferencia } = req.query

            if(!periodo || !dataReferencia) {
                return res.status(400).json({ error: 'Período e dataReferencia são obrigatórios.'})
            }

            const relatorio = await this.agendaService.gerarRelatorioQuantitativo({
                periodo: periodo as 'dia' | 'semana' | 'mes',
                dataReferencia: String(dataReferencia)
            })

            return res.status(200).json(relatorio)
        } catch(erro: any){
            return res.status(400).json({ error: erro.message || 'Erro ao gerar relatório.'})
        }
    }

    public obterFaltasPaciente = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { pacienteId } = req.params

            const historico = await this.agendaService.contabilizarFaltasPaciente(pacienteId)
            return res.status(200).json(historico)
        } catch(erro: any){
            return res.json(400).json({ error : erro.message || 'Erro ao contabilizar faltas do paciente.'})
        }
    }
}