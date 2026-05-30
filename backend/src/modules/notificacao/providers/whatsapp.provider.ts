import { AgendaParaNotificarDTO } from '../notificacao.dto'

export class WhatsappProvider {

    //Simula o envio de uma mensagem via API do WhatsApp
    async enviarLembrete( dados: AgendaParaNotificarDTO): Promise<boolean> {
        const dataFormatada = dados.dataHora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo'})
        const horaFormatada = dados.dataHora.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        })

        //Template de Mensagem Padronizada
        const mensagem = `Olá, *${dados.pacienteNome}*! Passando para lembrar da sua consulta com o(a) *${dados.profissionalNome}* amanhã, dia *${dataFormatada}* às *${horaFormatada}*. Caso precise cancelar ou remarcar responda esta mensagem.`

        //Simulação de disparo HTTP para o provedor de Wpp
        console.log(` |===============| |===============| `)
        console.log(`ENVIANDO WHATSAPP VIA API...`)
        console.log(`Para: ${dados.pacienteTelefone}`)
        console.log(`Conteúdo: ${mensagem}`)
        console.log(` |===============| |===============| `)

        await new Promise(resolve => setTimeout( resolve, 1000))
        return true
    }
}
