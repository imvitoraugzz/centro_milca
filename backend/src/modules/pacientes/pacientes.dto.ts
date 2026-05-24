export interface CreatePacienteDTO {
    nome: string
    cartaoSus: string
    dataNascimento: Date
    endereco: string
    telefone: string
    nomeMae: string 
}

export interface UpdatePacienteDTO {
    nome?: string
    cartaoSus?: string
    dataNascimento?: Date
    endereco?: string
    telefone?: string
    nomeMae?: string
}

export interface PacienteResponseDTO {
    id: string
    nome: string
    cartaoSus: string
    dataNascimento: Date
    endereco: string
    telefone: string
    nomeMae: string
    createdAt: Date
}