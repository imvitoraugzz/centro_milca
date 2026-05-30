import express from 'express'
import cors from 'cors'
import { routes } from './shared/infra/http/routes'
import { NotificacaoService } from './modules/notificacao/notificacao.service'

const app = express()

app.use(cors())
app.use(express.json())
app.use(routes)

// Motor de notificações automáticas -> worker
const notificacaoService = new NotificacaoService()

//Define a rotina em segundo plano para rodar a cada 1 hora (3600000 ms)
const UMA_HORA = 60 * 60 * 1000
setInterval(async () => {
    console.log('[WORKER] Iniciando varredura de notificações automáticas...')
    const relatorioEnvios = await notificacaoService.processarDisparosAutomaticos()
    console.log(`[WORKER] Varredura finalizada. Total de mensagens processadas ${relatorioEnvios.length}`)
}, UMA_HORA)

const PORT = 3000
app.listen(PORT, ()=> {
    console.log(`Servidor rodando na porta ${PORT}`)
    
})