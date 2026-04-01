# Study Flow - Backend API ⚙️

Este é o back-end da aplicação **Study Flow**, responsável por gerenciar a persistência de dados, autenticação de usuários, lógica de negócio para sessões de foco (Pomodoro), métricas de progresso e integração com Inteligência Artificial (Google Gemini).

A API foi construída com foco em performance, tipagem estrita e validação rigorosa de dados.

## 🛠 Tecnologias Utilizadas

- **[Node.js](https://nodejs.org/)** (v22+)
- **[Fastify](https://fastify.dev/)** (Framework web de altíssima performance)
- **[Drizzle ORM](https://orm.drizzle.team/)** (ORM Type-Safe para interação com o banco de dados)
- **[SQLite](https://sqlite.org/)** via `better-sqlite3` (Banco de dados local rápido com suporte a WAL mode)
- **[Zod](https://zod.dev/)** (Validação de schemas de entrada e saída)
- **[Google Generative AI](https://ai.google.dev/)** (Integração com o modelo Gemini 1.5 Flash para o assistente FlowAI)
- **JWT** (Autenticação via JSON Web Tokens)
- **Scrypt** (Hashing seguro de senhas nativo do Node.js)

## 📁 Estrutura do Projeto

A arquitetura do projeto é dividida em módulos independentes (`src/modules`), facilitando a manutenção e escalabilidade:

- `auth/`: Registro, login e geração de tokens JWT.
- `flow/`: CRUD de sessões de estudo (foco/pomodoro).
- `home/`: Agregação de dados para o dashboard principal (prioridades do dia, metas).
- `planning/`: Gerenciamento do canvas de estudos (nós, posições X/Y e arestas).
- `progress/`: Cálculo de métricas, tempo total de foco e ofensivas (streaks).
- `ai/`: Integração com o Google Gemini configurado com o prompt do "Método de Feynman".
- `db/`: Configuração do banco SQLite e schemas do Drizzle ORM.
- `plugins/`: Plugins do Fastify (tratamento de erros, hook de autenticação).

## 🚀 Como Executar

### 1. Instalação

Dentro do diretório `server`, instale as dependências:

```bash
npm install
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na raiz da pasta `server` com as seguintes chaves:

```env
# Porta do servidor (padrão: 3333)
PORT=3333

# Chave secreta para assinatura dos tokens JWT (use uma string longa e aleatória)
JWT_SECRET=super_secret_jwt_key_study_flow

# Chave da API do Google Gemini para o FlowAI
GEMINI_API_KEY=sua_chave_aqui_gerada_no_google_ai_studio
```

### 3. Banco de Dados

O banco de dados SQLite será criado automaticamente na pasta `data/` (na raiz do projeto principal) assim que a aplicação for iniciada ou as migrações rodarem.

Para gerar e aplicar as migrações do Drizzle:

```bash
npm run db:generate
npm run db:push
```

Para visualizar o banco de dados em uma interface web:

```bash
npm run db:studio
```

### 4. Rodando o Servidor

Para iniciar o servidor em modo de desenvolvimento (com hot-reload via `tsx`):

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3333`.

Para build e execução em produção:

```bash
npm run build
npm start
```

## 🔒 Segurança e Middlewares

- **CORS:** Configurado para aceitar requisições do front-end web (`localhost:3000`) e desktop Tauri (`tauri://localhost` e `localhost:1420`).
- **Rate Limiting:** Previne abusos limitando a 100 requisições por minuto por IP.
- **Helmet:** Adiciona headers de segurança HTTP automaticamente.
- **ErrorHandler:** Plugin customizado para capturar e formatar erros do Zod e exceções internas, garantindo respostas JSON padronizadas.
