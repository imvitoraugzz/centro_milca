export interface CreateUsuarioDTO {
    nome: string
    email: string
    senha: string
    role?: string
}

export interface AuthResponseDTO {
    id: string
    nome: string
    email: string
    role: string
    createdAt: Date
}

export interface LoginDTO {
    email: string
    senha: string
}

export interface LoginResponseDTO {
    usuario: AuthResponseDTO
    token: string
}
