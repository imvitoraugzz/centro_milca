import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { prisma } from '../../config/database'
import { CreateUsuarioDTO, AuthResponseDTO, LoginDTO, LoginResponseDTO } from './auth.dto'

export class AuthService {
    // REQ 01 - Cadastro de recepcionista
    private jwtSecret = process.env.JWT_SECRET

    async registrar({ nome, email, senha, role } : CreateUsuarioDTO ) : Promise<AuthResponseDTO>{
        const usuarioExistente = await prisma.usuario.findUnique({ where : { email } })

        if(usuarioExistente){ throw new Error('Este Email já cadastrado') }

        const saltRounds = 10
        const senhaHash = await bcrypt.hash( senha, saltRounds)

        const novoUsuario = await prisma.usuario.create({
            data : { nome, email, senha: senhaHash, role: role || 'RECEPCIONISTA' }
        })
        return {
            id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email, role: novoUsuario.role, createdAt: novoUsuario.createdAt
        }
    }

    async login({ email, senha} : LoginDTO) : Promise<LoginResponseDTO> {
        if(!this.jwtSecret){
            throw new Error(' Chave de segurança não configurada.')
        }
        const usuario = await prisma.usuario.findUnique({ where: { email } })
        if(!usuario){
            throw new Error('Email ou senha inválidos.')
        }
        
        const senhaValida = await bcrypt.compare(senha, usuario.senha)
        if(!senhaValida){
            throw new Error('Email ou senha inválidos.')
            
        }

        const token = jwt.sign(
            { id: usuario.id, role: usuario.role },
            this.jwtSecret,
            { expiresIn: '1h'}
        )

        return {
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role,
                createdAt: usuario.createdAt
            },
            token
        }
    }

    async deletarUsuario(id: string) : Promise<void> {
        const usuario = await prisma.usuario.findUnique({ where: { id} })
        if(!usuario) {
            throw new Error('Usuário não encontrado para exclusão')
        }
        await prisma.usuario.delete({ where: { id }})
    }
}