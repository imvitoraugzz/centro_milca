import { Request, Response, NextFunction } from 'express'
import * as jwt from 'jsonwebtoken'

interface TokenPayLoad {
    id: string
    role: string
}

export function verificarAutenticacao(req: Request, res: Response, next: NextFunction){
    const authHeader = req.headers.authorization

    if(!authHeader){
        return res.status(401).json({ error: 'Token de autenticação não fornecido.'})
    }

    const parts = authHeader.split(' ')
    if(parts.length !== 2 || parts[0] !== 'Bearer'){
        return res.status(401).json({ error: 'Erro o formato de token enviado.'})
    }

    const token = parts[1]
    const jwtSecret =  process.env.JWT_SECRET || 'naoadvinheotoken'

    try {
        const decoded = jwt.verify(token, jwtSecret)
        const { id, role } = decoded as TokenPayLoad

        req.usuario = { id, role }
        return next()
    } catch(erro){
        return res.status(401).json({ error: 'Token inválido ou expirado.'})
    }
}