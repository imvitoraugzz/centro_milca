export interface AgendaParaNotificarDTO {
    agendamentoId: string
    pacienteNome: string
    pacienteTelefone: string
    profissionalNome: string
    dataHora: Date
}

export interface EnviouResultadoDTO {
    agendamentoId: string
    enviado: boolean
    erro?: string
}