export const DEFAULT_AI_MODEL = 'gemini-2.5-flash';

export const PROVIDERS = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    models: [
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro Preview',
        tag: 'TOPO',
        desc: 'Maior precisão e raciocínio para análises complexas.',
        recommended: true,
      },
      {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash Preview',
        tag: 'RÁPIDO',
        desc: 'Frontier com boa latência para uso diário.',
      },
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash-Lite',
        tag: 'LEVE',
        desc: 'Opção estável e econômica para alto volume.',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        tag: 'PRO',
        desc: 'Modelo avançado para tarefas com raciocínio profundo.',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        tag: 'PADRÃO',
        desc: 'Equilíbrio entre custo, velocidade e qualidade.',
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash-Lite',
        tag: 'ECONÔMICO',
        desc: 'Baixa latência para checagens e refinamentos.',
      },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    models: [
      {
        id: 'gpt-5.5',
        name: 'GPT-5.5',
        tag: 'TOPO',
        desc: 'Modelo frontier para trabalho profissional complexo.',
        recommended: true,
      },
      {
        id: 'gpt-5.4',
        name: 'GPT-5.4',
        tag: 'PRO',
        desc: 'Alta qualidade com custo menor que o topo.',
      },
      {
        id: 'gpt-5.4-mini',
        name: 'GPT-5.4 mini',
        tag: 'ÁGIL',
        desc: 'Melhor custo-benefício para fluxos frequentes.',
      },
      {
        id: 'gpt-5.4-nano',
        name: 'GPT-5.4 nano',
        tag: 'LEVE',
        desc: 'Rápido e econômico para tarefas simples.',
      },
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        tag: 'CLÁSSICO',
        desc: 'Modelo não-raciocinador forte para JSON e escrita.',
      },
    ],
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    models: [
      {
        id: 'claude-opus-4-7',
        name: 'Claude Opus 4.7',
        tag: 'TOPO',
        desc: 'Mais capaz para raciocínio e redação profissional.',
        recommended: true,
      },
      {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        tag: 'RECOMENDADO',
        desc: 'Melhor equilíbrio entre velocidade e inteligência.',
      },
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        tag: 'RÁPIDO',
        desc: 'Modelo mais veloz para ajustes e respostas curtas.',
      },
    ],
  },
];

export function getProviderForModel(modelId) {
  for (const provider of PROVIDERS) {
    if (provider.models.some((model) => model.id === modelId)) {
      return provider.id;
    }
  }

  if (modelId?.startsWith('gemini-')) return 'gemini';
  if (modelId?.startsWith('gpt-')) return 'openai';
  if (modelId?.startsWith('claude-')) return 'anthropic';
  return null;
}
