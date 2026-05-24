export interface GerarGradeMensalDTO {
    profissionalId: string
    mes: number
    ano: number 
    diasSemana: number[]
    horarioInicio: string
    horarioFim: string
}

export interface BloquearAgendaDTO {
    profissionalId: string
    data: string | Date
}

export interface AlertaChoqueResponseDTO {
    conflito: boolean
    pacientesAfetados: {
        agendamentoId: string
        pacienteNome: string
        horario: string
    }[]
}

export interface CriarAgendamentoDTO {
    pacienteId: string
    profissionalId: string
    data: string
    horario: string
}

export interface BuscarHorariosLivresDTO {
    profissionalId: string
    data: string
}

export interface AgendamentoResponseDTO {
    id: string
    pacienteId: string
    profissionalId: string
    dataHora: Date
    status: string
    notificadoWhatsapp: boolean
}