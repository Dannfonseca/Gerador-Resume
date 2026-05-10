# 🚀 ATS Pro: Enterprise Resume Intelligence Platform

O **ATS Pro** é uma plataforma de elite para otimização de carreira, projetada para transformar currículos comuns em documentos de alta conversão. Utilizando o pipeline de 5 pilares de inteligência artificial, o sistema garante que seu perfil seja não apenas lido, mas priorizado por sistemas ATS (Applicant Tracking Systems) das maiores empresas do mundo.

![Status do Projeto](https://img.shields.io/badge/Status-Production--Ready-green)
![IA](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blueviolet)
![Design](https://img.shields.io/badge/Design-Heritage%20Architecture-orange)

## 💎 O Pipeline de 5 Pilares (Enterprise Flow)

Diferente de geradores simples, o ATS Pro utiliza um fluxo sequencial de otimização:

1.  **🔍 Diagnóstico (Raio-X ATS)**: Análise profunda do seu currículo original contra a vaga, gerando um **ATS Score** e um **Match Score** detalhado antes de qualquer alteração.
2.  **⚙️ Override de Agressividade**: Você define o nível de intervenção da IA:
    *   *Conservador*: Apenas ajustes gramaticais e de formatação.
    *   *Equilibrado*: Reescrita estratégica focada em palavras-chave.
    *   *Agressivo*: Transformação total narrativa para máxima conversão.
3.  **⚡ Keyword Boost**: O sistema sugere expressões e hard skills cruciais que estão faltando. Você escolhe quais ativar para que a IA as incorpore naturalmente.
4.  **📄 Geração de Alta Fidelidade**: Produção instantânea de dois modelos: **Professional** (Tradicional Robusto) e **Heritage** (Minimalismo Arquitetônico).
5.  **📈 Relatório Comparativo**: Visualização clara de "Antes vs Depois", mostrando o ganho real de pontuação e as palavras-chave conquistadas.

## ✨ Funcionalidades Premium

*   **Exportação LaTeX**: Gere código LaTeX e PDFs com estrutura perfeita para parsers de recrutamento.
*   **Cover Letter Module**: Geração de cartas de apresentação estratégicas alinhadas ao novo currículo.
*   **Wizard UI**: Interface intuitiva que guia o usuário por todas as etapas da otimização.
*   **Heritage Design System**: Estética baseada no brutalismo corporativo e minimalismo, garantindo legibilidade máxima.
*   **Multimodal**: Suporte para descrições de vaga via texto ou captura de tela (OCR via IA).

## 🛠️ Stack Tecnológica

*   **Runtime**: [Bun](https://bun.sh/) (Performance extrema)
*   **Backend**: ElysiaJS (Type-safe & Fast)
*   **Frontend**: React + Vite, Framer Motion (Animações), Lucide Icons
*   **IA**: Google Gemini 2.5 Flash (Structured Outputs)
*   **Documentos**: PDF-Parse, Mammoth, LaTeX Service

## 🚀 Como Iniciar

### 1. Requisitos
*   Possuir o **Bun** instalado.
*   Uma chave de API do **Google Gemini** (Obtenha em [aistudio.google.com](https://aistudio.google.com/)).

### 2. Configuração
Crie um arquivo `backend/.env`:
```env
GEMINI_API_KEY=sua_chave_aqui
```

### 3. Instalação e Execução
```bash
# Instala dependências (Monorepo)
bun install

# Inicia Frontend (5173) e Backend (3000) simultaneamente
bun run dev
```

## 📄 Licença
Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---
**ATS Pro** — *Sua carreira, otimizada por algoritmos de elite.*
Desenvolvido por [Dannfonseca](https://github.com/Dannfonseca).
