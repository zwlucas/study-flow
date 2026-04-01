# Study Flow 🧠

Study Flow é uma aplicação focada em produtividade, hiperfoco e neurociência da aprendizagem. Ela ajuda estudantes a organizarem seus estudos, manterem o foco com sessões de "Flow" (estilo Pomodoro), visualizarem seu progresso e tirarem dúvidas com um assistente de Inteligência Artificial integrado (FlowAI).

Este repositório contém o **Front-end** (Web e Desktop via Tauri) e o **Back-end** (Node.js + Fastify) da aplicação.

## 🛠 Tecnologias Utilizadas

**Front-end & Desktop:**
- [Next.js](https://nextjs.org/) (React)
- [Tauri](https://tauri.app/) (Para a versão Desktop em Rust)
- [Tailwind CSS](https://tailwindcss.com/) (Estilização)
- [Framer Motion](https://www.framer.com/motion/) (Animações fluidas e UI interativa)
- [Axios](https://axios-http.com/) (Comunicação com a API)

**Back-end (Pasta `/server`):**
- [Fastify](https://fastify.dev/) (Framework web rápido)
- [Drizzle ORM](https://orm.drizzle.team/) + SQLite (Banco de dados leve e de alta performance)
- [Google Gemini API](https://ai.google.dev/) (Motor por trás do FlowAI)

## ✨ Principais Funcionalidades

- **Home / Dashboard:** Resumo diário de prioridades e metas semanais.
- **Planning (Canvas de Estudos):** Roadmap interativo (drag-and-drop) com nós e conexões para mapear o caminho do aprendizado.
- **Flow (Foco):** Cronômetro para sessões de hiperfoco (Pomodoro) com registro de tempo e tags.
- **Progress (Analytics):** Gráficos e estatísticas de tempo estudado, ofensivas (streaks) e progresso geral.
- **FlowAI (Chat Inteligente):** Assistente flutuante focado no Método de Feynman, ajudando a quebrar bloqueios mentais e simplificar conceitos complexos.

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v22 recomendado)
- (Opcional) Ambiente [Nix](https://nixos.org/) (o projeto contém um `flake.nix` configurado com todas as dependências, incluindo Rust para o Tauri).

### 1. Configurando o Back-end
1. Entre na pasta do servidor:
   ```bash
   cd server
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na pasta `server` com as variáveis necessárias (ex: `GEMINI_API_KEY`, `JWT_SECRET`).
4. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

### 2. Configurando o Front-end
1. Na raiz do projeto, instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env.local` na raiz do projeto com a URL da API:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3333/api
   ```
3. Inicie o Front-end:
   - **Para Web:**
     ```bash
     npm run dev
     ```
   - **Para Desktop (Tauri):**
     ```bash
     npm run tauri dev
     ```

## 🔒 Autenticação
A comunicação com o back-end é protegida por JWT. O token é armazenado no `localStorage` após o login e injetado automaticamente nas requisições pelo interceptor do Axios.
