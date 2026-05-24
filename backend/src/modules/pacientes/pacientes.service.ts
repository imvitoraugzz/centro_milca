import { prisma } from '../../config/database'
import { CreatePacienteDTO, UpdatePacienteDTO, PacienteResponseDTO } from './pacientes.dto'

export class PacientesService {
    //REQ 02 - Cadastro de pacientes com validações

    async criarPaciente (dados: CreatePacienteDTO) : Promise<PacienteResponseDTO> {
        const telefoneFormatado = data.telefone.replace(/\D/g, '') //mantém apenas números

        if(!telefoneFormatado.startsWith('55') || telefoneFormatado.length < 12 || telefoneFormatado.length > 13){
            throw new Error('O número de telefone deve estar no formato internacional válido (ex.: 5599999999999')
        }
        
        const pacienteExistente = await prisma.paciente.findUnique({ where: { cartaoSus:  dados.cartaoSus }})
        if(pacienteExistente){
            throw new Error('Já existe um paciente cadastrado com este cartão SUS.')
        }

        const novoPaciente = await prisma.paciente.create({
            data: {
                nome: dados.nome,
                cartaoSus: dados.cartaoSus,
                dataNascimento: new Date(dados.dataNascimento),
                telefone: dados.telefone,
                endereco: dados.endereco,
                nomeMae: dados.nomeMae
            }
        })
        return novoPaciente
    }

    async atualizar( id: string, dados: UpdatePacienteDTO) : Promise<PacienteResponseDTO> {
        const paciente = await prisma.paciente.findUnique({ where: { id } })
        if(!paciente){
            throw new Error('Paciente não encontrado.')
        }

        const dadosAtualizacao: any = {...dados}

        if(dados.telefone){
            const telefoneFormatado = dados.telefone.replace(/\D/g, '')
            if(!telefoneFormatado.startsWith('55') || telefoneFormatado.length < 12 || telefoneFormatado.length > 13 ){
                throw new Error('O número de telefone deve estar no formato internacional válido (ex.: 5599999999999).')
            }
            dadosAtualizacao.telefone = telefoneFormatado
        }

        if(dados.cartaoSus && dados.cartaoSus !== paciente.cartaoSus){
            const susDuplicado = await prisma.paciente.findUnique({ where: { cartaoSus: dados.cartaoSus }})
            if(susDuplicado){
                throw new Error('Já existe um paciente cadastrado com este cartão SUS.')
            }
        }

        if(dados.dataNascimento){
            dadosAtualizacao.dataNascimento = new Date(dados.dataNascimento)
        }

        const pacienteAtualizado = await prisma.paciente.update({
            where: { id },
            data: dadosAtualizacao
        })

        return pacienteAtualizado
    }
}