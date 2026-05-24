import { prisma } from '../../config/database'
import { GerarGradeMensalDTO, BloquearAgendaDTO, AlertaChoqueResponseDTO } from './agenda.dto'
import type AgendamentoResponseDTO = require('./agenda.dto')

export class AgendaService {
    async gerarGradeMensal (dados: GerarGradeMensalDTO { profissionalId, ano, mes, diasSemana, horarioInicio, horarioFim }): Promise<number> {
        //Verificar se o profissional existe
        const profissional = await prisma.profissional.findUnique({ where: { id: dados.profissionalId }})
        if(!profissional){
            throw new Error('Profissional não encontrado.')
        }

        //Calcular todos os dias do mês solicitado
        const dataInicio = new Date(ano, mes - 1, 1)
        const dataFim = new Date(ano, mes, 0)//Ultimo dia do mês
        const totalDias = dataFim.getDate()

        //Gerar os intervalos de 30 minutos baseado em strings
        const horarios: string[] = []
        let [horaAtual, minutoAtual] = horarioInicio.split(':').map(Number)
        const [horaFim, minutoFim] = horarioFim.split(':').map(Number)

        const limiteMinutos = horaFim * 60 + minutoFim
        let atualEmMinutos = horaAtual * 60 + minutoAtual

        while(atualEmMinutos < limiteMinutos){
            const hora = Math.floor(atualEmMinutos / 60).toString().padStart(2, '0')
            const minuto = (atualEmMinutos % 60).toString().padStart(2, '0')
            horarios.push(`${hora}:${minuto}`)
            atualEmMinutos += 30
        }

        let registrosCriados = 0

        //Percorrer dos dias do mês e filtrar pelos dias da semana escolhidos
        for(let dia = 1; dia <= totalDias; dia++){
            const dataAtual = new Date(ano, mes -1, dia)
            if(diasSemana.includes(dataAtual.getDay())){
                //Zera o componente de hora para armazenar no banco de dados puramente a data
                dataAtual.setHours(0, 0, 0, 0)

                for(const horario of horarios) {
                    try { 
                        //Insere ignorando duplicatas se rodar o comando duas vezes
                        await prisma.agendamento.create({
                            data: {
                                profissionalId,
                                data: dataAtual,
                                horarioInicio: horario,
                                status: 'DISPONIVEL'
                            }
                        })
                        registrosCriados++
                    } catch(erro) {

                    }
                }
            }
        }
        return registrosCriados
    }
    //Bloquear a agenda do profissional e alertar choques com pacientes
    async bloquearAgenda({ profissionalId, data}: BloquearAgendaDTO): Promise<AlertaChoqueResponseDTO> {
        const dataBloqueio = new Date(data)
        dataBloqueio.setHours(0, 0, 0, 0)

        //Verificar se existem agendamentos ativos marcados para este dia
        const agendamentosConflitantes = await prisma.agendamento.findMany({
            where: {
                profissionalId,
                status: 'AGENDADO',
                dataHora: {
                    gte: dataBloqueio,
                    lt: new Date(dataBloqueio.getTime() + 24 * 60 * 60 * 1000)
                }
            },  
            include: {
                paciente: true
            }
        })

        //Compila o alerta e não altera o banco, caso tenha conflitos
        if(agendamentosConflitantes.length > 0){
            const pacientesAfetados = agendamentosConflitantes.map(a => ({
                agendamentoId: a.id,
                pacienteNome: a.paciente.nome,
                horario: a.dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timezone: 'UTC'})
            }))
            return {
                conflito: true,
                pacientesAfetados
            }
        }

        await prisma.agendamento.updateMany({
            where: {
                profissionalId,
                data: dataBloqueio
            },
            data: {
                status: 'BLOQUEADO'
            }
        })
        
        return {
            conflito: false,
            pacientesAfetados: []
        }
    }

    //REQ 04 - Listar horários disponíveis de um profissional, a partir do dia seguinte
    async listarHorariosDisponiveis( profissionalId: string, data: string): BuscarHorariosLivresDTO {
        const dataConsulta = new Date(data)
        dataConsulta.setHours(0, 0, 0, 0)

        //Regra d Negócio: Consultas só podem ser agendadas a partir do dia seguinte
        const amanha = new Date()
        amanha.setDate(amanha.getDate() + 1)
        amanha.setHours(0, 0, 0, 0)

        if(dataConsulta.getTime() < amanha.getTime()) {
            throw new Error('Consultas só podem ser agendadas a partir do dia seguinte.')
        }

        //Busca na tabela de agendas o que está explicitamente como DISPONÍVEL
        const horariosDisponiveis = await prisma.agendamento.findMany({
            where: {
                profissionalId,
                data: dataConsulta,
                status: 'DISPONIVEL'
            },
            orderBy: {
                horarioInicio: 'asc'
            }
        })
        return horariosDisponiveis.map( h => h.horarioInicio)
    }

    //REQ 04 - Efetivar o agendamento da consulta vinculando paciente e médico
    async agendarConsulta({pacienteId, profissionalId, data, horario}: CriarAgendamentoDTO): Promise<AgendamentoResponseDTO> {
        //Validar existencia de paciente
        const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } })
        if(!paciente){
            throw new Error('Paciente não encontrado.')
        }

        //Combinar a data e horário em um único objeto Date
        const [horas, minutos] = horario.split(':').map(Number)
        const dataHoraConsulta = new Date(data)
        dataHoraConsulta.setHours(horas, minutos, 0, 0)

        //Validar se a data/hora é retroativa ou para o mesmo dia
        const amanha = new Date()
        amanha.setDate(amanha.getDate() + 1)
        amanha.setHours(0, 0, 0, 0)

        const dataAlvoPura = new Date(data)
        dataAlvoPura.setHours(0, 0, 0, 0)

        if(dataAlvoPura.getTime() < amanha.getTime()){
            throw new Error('Consultas só podem ser agendadas a partir do dia seguinte.')
        }

        //Verifica se a agenda está realmente disponível para agendamentos.
        const agenda = await prisma.agendaProfissional.findUnique({
            where: {
                profissionalId_data_horarioInicio: {
                    profissionalId,
                    data: dataAlvoPura,
                    horarioInicio: horario
                }
            }
        })

        if(!agenda || agenda.status !== 'DISPONIVEL'){
            throw new Error('Horário não disponível para agendamento.')
        }

        //Executa transação no banco: muda o slot para OCUPADO e cria o registro de agendamento
        const [agendamento] = await prisma.$transaction([
            prisma.agendamento.update({
                data: {
                    pacienteId,
                    profissionalId,
                    dataHora: dataHoraConsulta,
                    status: 'AGENDADO',
                    notificadoWhatsapp: false
                }
            }),
            prisma.agendaProfissional.update({
                where: {
                    id: agenda.id
                },
                data: {
                    status: 'OCUPADO'
                }
            })
        ])
        return agendamento
    }

}