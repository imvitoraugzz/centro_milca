-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cartao_sus" TEXT NOT NULL,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "endereco" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "nome_mae" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissionais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "area_atuacao" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendas_profissionais" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horario_inicio" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISPONIVEL',

    CONSTRAINT "agendas_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADO',
    "notificado_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_cartao_sus_key" ON "pacientes"("cartao_sus");

-- CreateIndex
CREATE UNIQUE INDEX "agendas_profissionais_profissional_id_data_horario_inicio_key" ON "agendas_profissionais"("profissional_id", "data", "horario_inicio");

-- AddForeignKey
ALTER TABLE "agendas_profissionais" ADD CONSTRAINT "agendas_profissionais_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
