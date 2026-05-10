# ATS Pro: Enterprise Resume Intelligence Platform

O ATS Pro é uma plataforma avançada para otimização de carreira, desenvolvida para transformar currículos em documentos de alta conversão. Utilizando um pipeline estruturado em cinco pilares de inteligência artificial, o sistema garante que seu perfil seja não apenas lido, mas priorizado por sistemas ATS (Applicant Tracking Systems) das maiores empresas do mercado.

## O Pipeline de 5 Pilares (Enterprise Flow)

Diferente de geradores de currículos convencionais, o ATS Pro utiliza um fluxo sequencial de otimização para garantir resultados precisos:

1.  **Diagnóstico (Raio-X ATS)**: Realiza uma análise profunda do currículo original em comparação com a vaga desejada, gerando métricas detalhadas de ATS Score e Match Score antes de qualquer alteração.
2.  **Controle de Agressividade (Override)**: O usuário define o nível de interferência da inteligência artificial:
    *   *Conservador*: Foca em ajustes precisos de gramática e formatação.
    *   *Equilibrado*: Realiza reescritas estratégicas e alinhamento de palavras-chave.
    *   *Agressivo*: Promove uma transformação narrativa total para máxima conversão.
3.  **Boost de Palavras-Chave**: O sistema identifica termos técnicos e competências cruciais ausentes no documento. O usuário seleciona quais deseja ativar para que sejam incorporadas de forma natural ao texto.
4.  **Geração de Alta Fidelidade**: Produção simultânea de dois modelos otimizados: Professional (focado em robustez tradicional) e Heritage (focado em minimalismo arquitetônico).
5.  **Relatório de Impacto**: Apresenta uma visualização comparativa de "Antes vs Depois", demonstrando o ganho real de pontuação e os termos estratégicos incorporados.

## Funcionalidades Principais

*   **Exportação em LaTeX**: Geração de código LaTeX e documentos PDF com estrutura otimizada para parsers de recrutamento.
*   **Módulo de Carta de Apresentação**: Criação de cartas de apresentação estratégicas e personalizadas para a vaga.
*   **Interface Wizard**: Experiência de usuário guiada que orienta por todas as etapas da otimização.
*   **Design System Heritage**: Estética profissional baseada em legibilidade e clareza visual.
*   **Análise Multimodal**: Suporte para descrições de vaga enviadas por texto ou capturas de tela.

## Stack Tecnológica

*   **Ambiente**: Bun
*   **Backend**: ElysiaJS
*   **Frontend**: React, Vite, Framer Motion
*   **Inteligência Artificial**: Google Gemini 2.5 Flash
*   **Processamento**: LaTeX Service, PDF-Parse, Mammoth

## Como Iniciar o Projeto

### 1. Requisitos
*   Possuir o runtime Bun instalado em seu sistema.
*   Uma chave de API válida do Google Gemini.

### 2. Configuração
Crie um arquivo nomeado `.env` dentro do diretório `backend/` com o seguinte conteúdo:
```env
GEMINI_API_KEY=sua_chave_aqui
```

### 3. Instalação e Execução
Na raiz do projeto, execute os comandos abaixo:
```bash
# Instalação de dependências do monorepo
bun install

# Inicialização do frontend e backend
bun run dev
```

## Licença
Este projeto é distribuído sob a licença MIT. Consulte o arquivo de licença para mais detalhes.

---
**ATS Pro** — Inteligência aplicada à evolução de carreira.
Desenvolvido por [Dannfonseca](https://github.com/Dannfonseca).
