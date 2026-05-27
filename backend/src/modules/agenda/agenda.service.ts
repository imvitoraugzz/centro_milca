import { prisma } from '../../config/database'
import { GerarGradeMensalDTO, BloquearAgendaDTO, AlertaChoqueResponseDTO, CriarAgendamentoDTO, BuscarHorariosLivresDTO, AgendamentoResponseDTO, RemarcarConsultaDTO } from './agenda.dto'


export class AgendaService {
    async gerarGradeMensal (dados: GerarGradeMensalDTO): Promise<number> {
        const { profissionalId, ano, mes, diasSemana, horarioInicio, horarioFim } = dados
        
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

            //Bloqueio preventivo: se por erro do front enviarem domingo (0) ou sábado (6)
            if(dataAtual.getDay() === 0 || dataAtual.getDay() === 6){
                continue
            }

            if(diasSemana.includes(dataAtual.getDay())){
                //Zera o componente de hora para armazenar no banco de dados puramente a data
                dataAtual.setHours(0, 0, 0, 0)

                for(const horario of horarios) {
                    try { 
                        //Insere ignorando duplicatas se rodar o comando duas vezes
                        await prisma.agendaProfissional.create({
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
                horario: a.dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC'})
            }))
            return {
                conflito: true,
                pacientesAfetados
            }
        }

        await prisma.agendaProfissional.updateMany({
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
    async listarHorariosDisponiveis( {profissionalId, data }: BuscarHorariosLivresDTO): Promise<string[]> {
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
        const horariosDisponiveis = await prisma.agendaProfissional.findMany({
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

        //Regra de negócio: impedir agendamento direto em fins de semana.
        if(dataAlvoPura.getDay() === 0 || dataAlvoPura.getDay() === 6){
            throw new Error('Consultas só podem ser agendadas em dias úteis')
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
        const [agendamentoAtualizado] = await prisma.$transaction([
            prisma.agendamento.create({
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
        return agendamentoAtualizado
    }

    //REQ 05 - Editar e remarcar consulta liberando data/hora antiga e ocupando nova data/hora
    async remarcarConsulta({ agendamentoId, novaData, novoHorario }: RemarcarConsultaDTO): Promise<AgendamentoResponseDTO> {
        //Buscar agendamento atual com dados do profissional
        const agendamentoAtual = await prisma.agendamento.findUnique({
            where: { id: agendamentoId }
        })

        if(!agendamentoAtual){
            throw new Error('Agendamento não encontrado.')
        }

        if(agendamentoAtual.status !== 'AGENDADO'){
            throw new Error('Apenas consultas com status AGENDADO podem ser remarcadas.')
        }

        //Combinar nova data e horário e aplicar a regra de ouro: apenas a partir do dia seguinte
        const [horas, minutos] = novoHorario.split(':').map(Number)
        const novaDataHora = new Date(novaData)
        novaDataHora.setHours(horas, minutos, 0, 0)

        const amanha = new Date()
        amanha.setDate(amanha.getDate() + 1)
        amanha.setHours(0, 0, 0, 0)

        const novaDataPura = new Date(novaData)
        novaDataPura.setHours(0, 0, 0, 0)

        if(novaDataPura.getTime() < amanha.getTime()){
            throw new Error('Consultas só podem ser reagendadas a patir do dia seguinte.')
        }

        //Verificar se a nova data/hora está disponível
        const novoAgendamento = await prisma.agendaProfissional.findUnique({
            where: {
                profissionalId_data_horarioInicio: {
                    profissionalId: agendamentoAtual.profissionalId,
                    data: novaDataPura,
                    horarioInicio: novoHorario
                }
            }
        })

        if(!novoAgendamento || novoAgendamento.status !== 'DISPONIVEL'){
            throw new Error('Nova data/hora não disponível para agendamento.')
        }

        //Descobrir o ID do slot antigo para liberar e do novo para ocupar
        const dataAntigaPura = new Date(agendamentoAtual.dataHora)
        dataAntigaPura.setHours(0, 0, 0, 0)
        const horarioAntigo = agendamentoAtual.dataHora.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC' 
        })

        const slotAntigo = await prisma.agendaProfissional.findUnique({
            where: {
                profissionalId_data_horarioInicio: {
                    profissionalId: agendamentoAtual.profissionalId,
                    data: dataAntigaPura,
                    horarioInicio: horarioAntigo
                }
            }
        })

        //Transação Atômica: executa todas as alterações juntas ou falha tudo
        const [agendamentoAtualizado] = await prisma.$transaction([
            //Atualiza o agendamento com nova data/hora
            prisma.agendamento.update({
                where: { id: agendamentoId},
                data: {
                    dataHora: novaDataHora,
                    notificadoWhatsapp: false //O motor de disparo precisará avisá-lo do novo horário
                }
            }),

            //Ocupa novo slot de tempo
            prisma.agendaProfissional.update({
                where: { id: novoAgendamento.id},
                data: { status: 'OCUPADO'}
            }),

            //Libera slot antigo, caso esteja de acordo com a regra
            ...(slotAntigo && slotAntigo.status === 'OCUPADO' ? [ prisma.agendaProfissional.update({
                where: { id: slotAntigo.id},
                data: { status: 'DISPONIVEL'} 
            })] : [])
        ])
        return agendamentoAtualizado
    }

    //REQ 08 - Gerar relatórios quantitativos de consultas por dia, semana, mês
    async gerarRelatorioQuantitativo({ periodo, dataReferencia }: RelatorioQuantitativoDTO): Promise<RelatorioQuantitativoResponseDTO> {
        const dataInicio = new Date(dataReferencia)
        dataInicio.setHours(0, 0, 0, 0)

        const dataFim = new Date(dataReferencia)
        dataFim.setHours(23, 59, 59, 999)

        if(periodo === 'semana') {
            //Ajusta o início para a segunda da semana da data informada e o fim para sexta.
            const diaSemana = dataInicio.getDay()
            const distanciaSegunda = diaSemana === 0 ? 6 : 1 - diaSemana 
            dataInicio.setDate(dataInicio.getDate() + distanciaSegunda)

            dataFim.setTime(dataInicio.getTime())
            dataFim.setDate(dataFim.getDate() + 4) //+4 dias pra sexta
            dataFim.setHours(23, 59, 59, 999)
        } else if(periodo === 'mes') {
            //Ajusta para o primeiro e último dia do mês corrido
            dataInicio.setDate(1)
            dataFim.setMonth(dataFim.getMonth() + 1)
            dataFim.setDate(0)
        }

        //Agrupa e conta direto do banco usando a agregação do Prisma
        const agregados = await prisma.agendamento.groupBy({
            by: ['status'],
            where: {
                dataHora: {
                    gte: dataInicio,
                    lte: dataFim
                }
            },
            _count: {
                id: true
            }
        })

        //Inicializa com zero para todos os status
        const contagem = {
            AGENDADO : 0,
            CONFIRMADO : 0,
            CONCLUIDO : 0,
            FALTA: 0,
            CANCELADO : 0
        }
        
        agregados.forEach( item => {
            if( item.status in contagem){
                contagem[item.status as keyof typeof contagem] = item._count.id
            }
        })

        const totalGeral = Object.values(contagem).reduce(( acc, curr ) => acc + curr, 0)
        return {
            periodo,
            totalAgendamentos: contagem.AGENDADO,
            totalConfirmados: contagem.CONFIRMADO,
            totalConcluidos: contagem.CONCLUIDO,
            totalCancelados: contagem.CANCELADO,
            totalFaltas: contagem.FALTA,
            totalGeral
        }
    }

    //REQ 09 - Contabilizar
    async contabilizarFaltasPaciente( pacienteId: string): Promise<HistoricoFaltasResponseDTO> {
        const paciente = await prisma.paciente.findUnique({
            where: { id: pacienteId },
        })

        if(!paciente) {
            throw new Error('Paciente não encontrado.')
        }

        const totalFaltas = await prisma.agendamento.count({
            where: {
                pacienteId,
                status: 'FALTA'
            }
        })

        return {
            pacienteId,
            pacienteNome: paciente.nome,
            totalFaltas
        }
    }
}