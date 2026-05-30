import { prisma } from '../../config/database'
import { WhatsappProvider } from './providers/whatsapp.provider'
import { EnviouResultadoDTO } from './notificacao.dto'

export class NotificacaoService {
    private whatsappProvider : WhatsappProvider

    constructor() {
        this.whatsappProvider = new WhatsappProvider()
    }

    //Motor Principal: Busca consultas de amanhã e efetua os disparos em lote
    async processarDisparosAutomaticos(): Promise<EnviouResultadoDTO[]> {
        //Calcular a janela de tempo correspondente ao dia de amanhã inteiro
        const amanhaInicio = new Date()
        amanhaInicio.setDate(amanhaInicio.getDate() + 1)
        amanhaInicio.setHours(0, 0, 0, 0)

        const amanhaFim = new Date()
        amanhaFim.setDate(amanhaFim.getDate() + 1)
        amanhaFim.setHours(23, 59, 59, 999)

        //Buscar agendamentos elegíveis no banco de dados
        const agendamentosParaNotificar = await prisma.agendamento.findMany({
            where: {
                status: 'AGENDADO',
                notificadoWhatsApp: false,
                dataHora: {
                    gte: amanhaInicio,
                    lte: amanhaFim
                }
            },
            include: {
                paciente: true,
                profissional: true
            }
        })

        const resultados: EnviouResultadoDTO[] = []

        //Iterar sobre o lote de mensagens usando estrutura sequencial ponderada (evita ban no wpp :| )
        for( const agendamento of agendamentosParaNotificar ) {
            try { 
                const sucesso = await this.whatsappProvider.enviarLembrete({
                    agendamentoId: agendamento.id,
                    pacienteNome: agendamento.paciente.nome,
                    pacienteTelefone: agendamento.paciente.telefone,
                    profissionalNome: agendamento.profissional.nome,
                    dataHora: agendamento.dataHora
                })
                if(sucesso) {
                    //Marca no PostG que o paciente foi devidamente notificado
                    await prisma.agendamento.update({
                        where: { id: agendamento.id},
                        data: { notificadoWhatsApp: true}
                    })

                    resultados.push({
                        agendamentoId: agendamento.id,
                        enviado: true
                    })
                }
            } catch(erro: any) {
                resultados.push({
                    agendamentoId: agendamento.id,
                    enviado: false,
                    erro: erro.message || 'Falha no provedor de envio.'
                })
            }
        }
        return resultados
    } 
}


