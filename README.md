# ATS Pro - Gerador de Currículos IA

Um gerador de currículos automatizado que utiliza Inteligência Artificial (Google Gemini) para reescrever o seu currículo de forma 100% alinhada a qualquer vaga de emprego, maximizando a sua taxa de aprovação em sistemas ATS (Applicant Tracking Systems).

## Como funciona?
1. Você faz o upload do seu currículo atual (PDF ou Word).
2. Você cola a descrição da vaga desejada (ou manda um print da tela).
3. A nossa IA processa os dois arquivos e **reescreve todo o seu currículo** extraindo verbos de ação e palavras-chave específicas da vaga, sem mentir ou inventar experiências, apenas destacando o que mais importa para aquela vaga.
4. Você salva em um PDF limpo, premium, com um layout validado ("Heritage" - Architectural Minimalism) feito para passar nos filtros dos recrutadores.

## Tecnologias Utilizadas
- **Frontend**: React.js, Vite, Framer Motion, TanStack Query.
- **Backend**: Bun, ElysiaJS.
- **Inteligência Artificial**: Google GenAI SDK (modelo `gemini-2.5-flash`).
- **Processamento de Arquivos**: `pdf-parse` (PDF) e `mammoth` (Word).

## Como rodar o projeto localmente?

Este projeto é um Monorepo. O Frontend roda na porta 5173 e o Backend na 3000.

### 1. Pré-requisitos
- Instalar o [Bun](https://bun.sh/) (O runtime mais rápido para JavaScript/TypeScript).

### 2. Configurar a Chave da API
Para o sistema funcionar, você precisa da sua própria chave de API do Google Gemini (é de graça).
1. Acesse o [Google AI Studio](https://aistudio.google.com/).
2. Crie uma nova API Key.
3. Dentro da pasta `backend/`, crie um arquivo chamado `.env`.
4. Cole a sua chave no arquivo da seguinte forma:
   ```env
   GEMINI_API_KEY=AIzaSy...sua_chave_aqui...
   ```

### 3. Instalando as Dependências
Abra o terminal na raiz do projeto e instale as dependências de todas as pastas com um único comando:
```bash
bun install
```

### 4. Iniciando o Servidor
Com tudo instalado e a chave configurada, rode o comando:
```bash
bun run dev
```

Isso iniciará:
- O servidor Backend rodando em `http://localhost:3000`
- O aplicativo Frontend rodando em `http://localhost:5173`

Acesse `http://localhost:5173` no seu navegador e comece a gerar seus currículos!

## Segurança
- O arquivo `.env` já está no `.gitignore`. NUNCA suba a sua chave de API para o GitHub!

---
Desenvolvido por Daniel Fonseca.
