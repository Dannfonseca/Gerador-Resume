// ═══════════════════════════════════════════════════════════════
// Career Combos — Industry-specific ATS keyword context system
// ═══════════════════════════════════════════════════════════════

export interface CareerCombo {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  industryContext: string;
  keywordHints: string[];
  toolsHints: string[];
  certificationHints: string[];
  toneGuidance: string;
}

export const CAREER_COMBOS: CareerCombo[] = [
  {
    id: 'tech',
    label: 'Tecnologia & T.I.',
    icon: 'Code',
    color: '#2563eb',
    description: 'Desenvolvimento, infraestrutura, dados e DevOps',
    industryContext: `O candidato busca vagas no setor de Tecnologia da Informação. 
Priorize keywords técnicas: linguagens de programação, frameworks, cloud, 
metodologias ágeis (Scrum, Kanban), ferramentas de CI/CD, e arquiteturas 
de sistemas (microservices, serverless). Métricas de performance são valorizadas.`,
    keywordHints: ['JavaScript', 'Python', 'TypeScript', 'React', 'Node.js', 'AWS', 
                   'Docker', 'Kubernetes', 'CI/CD', 'Microservices', 'REST API', 
                   'Agile', 'Scrum', 'TDD', 'Git', 'System Design', 'Scalability',
                   'Event-Driven Architecture', 'Serverless', 'Infrastructure as Code'],
    toolsHints: ['VS Code', 'GitHub', 'GitLab', 'Jira', 'AWS', 'Azure', 'GCP',
                 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Datadog',
                 'New Relic', 'Grafana', 'PostgreSQL', 'MongoDB', 'Redis'],
    certificationHints: ['AWS Certified Solutions Architect', 'AWS Certified Developer',
                         'Azure Fundamentals', 'GCP Professional', 'Kubernetes CKA',
                         'Certified Scrum Master (CSM)', 'PMP', 'ITIL'],
    toneGuidance: 'Tom técnico e orientado a resultados. Use métricas quantificáveis (ex: "reduziu latência em 40%", "escalou sistema para 10M req/dia"). Destaque stack tecnológico e impacto mensurável.'
  },
  {
    id: 'architecture',
    label: 'Arquitetura & Urbanismo',
    icon: 'Building2',
    color: '#78716c',
    description: 'Projeto arquitetônico, BIM, sustentabilidade e gestão de obras',
    industryContext: `O candidato busca vagas no setor de Arquitetura e Urbanismo. 
Priorize keywords de projeto técnico: BIM (Building Information Modeling), 
softwares de design (Revit, AutoCAD, SketchUp), compliance com códigos 
de construção, sustentabilidade (LEED), gestão de projetos de construção, 
e documentação técnica (CDs, schematic design). 
NÃO sugira keywords de T.I. como Agile, Scrum, Docker a menos que a vaga explicitamente peça.`,
    keywordHints: ['BIM', 'Building Information Modeling', 'Revit', 'AutoCAD', 'SketchUp',
                   'LEED', 'Sustainable Design', 'Construction Documentation',
                   'Schematic Design', 'Design Development', 'Building Code Compliance',
                   'Zoning Analysis', 'ADA Compliance', '3D Rendering', 'Clash Detection',
                   'Integrated Project Delivery', 'Construction Administration',
                   'Space Planning', 'Site Analysis', 'Master Planning'],
    toolsHints: ['Autodesk Revit', 'AutoCAD', 'SketchUp Pro', 'Rhino 3D', 'Grasshopper',
                 'Lumion', 'V-Ray', 'Enscape', 'Twinmotion', 'Adobe Creative Suite',
                 'Adobe InDesign', 'Adobe Photoshop', 'Navisworks', 'BIM 360'],
    certificationHints: ['LEED AP BD+C', 'LEED Green Associate', 'WELL AP',
                         'Autodesk Certified Professional', 'CAU/BR', 
                         'AQUA-HQE', 'Passive House Certified'],
    toneGuidance: 'Tom técnico-criativo. Destaque portfólio de projetos, premiações, escala dos projetos (m², orçamento em R$/US$), e impacto urbano/sustentável. Inclua tipos de projeto (residencial, comercial, institucional).'
  },
  {
    id: 'marketing',
    label: 'Marketing & Comunicação',
    icon: 'Megaphone',
    color: '#ec4899',
    description: 'Marketing digital, SEO/SEM, branding e growth',
    industryContext: `O candidato busca vagas em Marketing Digital e Comunicação. 
Priorize keywords de performance: SEO, SEM, PPC, Google Analytics (GA4), 
CRO, A/B Testing, funil de vendas, automação de marketing. 
Métricas de ROI e ROAS são essenciais. Inclua plataformas de ads e CRM.
O mercado valoriza profissionais data-driven que provam resultados com números.`,
    keywordHints: ['SEO', 'SEM', 'PPC', 'Google Analytics', 'GA4', 'CRO',
                   'A/B Testing', 'ROAS', 'CAC', 'LTV', 'CLV', 'Marketing Automation',
                   'Content Strategy', 'Content Marketing', 'Social Media Marketing',
                   'Email Marketing', 'Inbound Marketing', 'Lead Generation',
                   'Funnel Optimization', 'Attribution Modeling', 'Omnichannel',
                   'Brand Strategy', 'Copywriting', 'Growth Hacking'],
    toolsHints: ['Google Ads', 'Meta Ads Manager', 'HubSpot', 'Salesforce',
                 'SEMRush', 'Ahrefs', 'Mailchimp', 'RD Station', 'ActiveCampaign',
                 'Google Tag Manager', 'Hotjar', 'Figma', 'Canva',
                 'Hootsuite', 'Buffer', 'Amplitude'],
    certificationHints: ['Google Ads Certified', 'Google Analytics Certified',
                         'HubSpot Inbound Marketing', 'Meta Blueprint',
                         'RD Station Partner', 'Salesforce Certified'],
    toneGuidance: 'Tom orientado a dados e resultados. Destaque métricas de conversão, crescimento percentual, ROI de campanhas e volume de budget gerenciado. Mostre impacto em receita.'
  },
  {
    id: 'engineering',
    label: 'Engenharia',
    icon: 'Wrench',
    color: '#f59e0b',
    description: 'Civil, mecânica, elétrica, produção e correlatas',
    industryContext: `O candidato busca vagas em Engenharia (civil, mecânica, elétrica, produção ou correlatas). 
Priorize keywords técnicas: cálculo estrutural, normas técnicas (ABNT, AASHTO, ASTM), 
softwares de engenharia, gestão de projetos de construção/produção, controle de qualidade, 
segurança do trabalho (NRs). Métricas de redução de custo e eficiência operacional.`,
    keywordHints: ['Cálculo Estrutural', 'Gestão de Projetos', 'AutoCAD', 'MS Project',
                   'Lean Manufacturing', 'Six Sigma', 'PCP', 'Controle de Qualidade',
                   'Segurança do Trabalho', 'NR', 'ABNT', 'ISO 9001', 'ISO 14001',
                   'Manutenção Preventiva', 'Manutenção Preditiva', 'PDCA',
                   'Gestão de Obras', 'Orçamento', 'Cronograma Físico-Financeiro',
                   'FEA', 'CFD', 'Eficiência Energética'],
    toolsHints: ['AutoCAD', 'AutoCAD Civil 3D', 'STAAD Pro', 'SAP2000', 'ANSYS',
                 'SolidWorks', 'CATIA', 'Inventor', 'Primavera P6', 'MS Project',
                 'MATLAB', 'Simulink', 'Arena', 'ERP SAP', 'Power BI'],
    certificationHints: ['CREA', 'PMP', 'Six Sigma Green Belt', 'Six Sigma Black Belt',
                         'NR-10', 'NR-12', 'NR-35', 'ISO 9001 Lead Auditor',
                         'ISO 14001 Auditor', 'Lean Practitioner'],
    toneGuidance: 'Tom técnico-gerencial. Destaque escala de projetos (orçamento, equipe), redução de custos, ganhos de eficiência e conformidade com normas. Métricas como "reduziu custos em X%" ou "gerenciou equipe de X pessoas".'
  },
  {
    id: 'healthcare',
    label: 'Saúde',
    icon: 'HeartPulse',
    color: '#ef4444',
    description: 'Medicina, enfermagem, farmácia, biomedicina e odontologia',
    industryContext: `O candidato busca vagas na área de Saúde (medicina, enfermagem, farmácia, biomedicina, fisioterapia, etc.). 
Priorize keywords clínicas: avaliação de pacientes, prontuário eletrônico (EMR/PEP), 
protocolos de atendimento, suporte básico/avançado de vida (BLS/ACLS), controle de infecção, 
farmacovigilância, ANVISA, e acreditação hospitalar (ONA, JCI).
NÃO sugira keywords genéricas de gestão ou T.I. a menos que a vaga peça.`,
    keywordHints: ['BLS', 'ACLS', 'PALS', 'EMR', 'Prontuário Eletrônico',
                   'Avaliação de Pacientes', 'Plano de Cuidados', 'Controle de Infecção',
                   'Farmacovigilância', 'Prescrição Médica', 'Classificação de Risco',
                   'Protocolo de Manchester', 'ANVISA', 'Vigilância Sanitária',
                   'Pesquisa Clínica', 'GCP', 'Biossegurança', 'Humanização',
                   'Segurança do Paciente', 'SAE (Sistematização da Assistência)'],
    toolsHints: ['Tasy (Philips)', 'MV Soul', 'Philips PACS', 'SAP Healthcare',
                 'IG Health', 'Doctoralia', 'SPSS', 'REDCap', 'Epic Systems'],
    certificationHints: ['COREN', 'CRM', 'CRF', 'CRO', 'CREFITO',
                         'BLS/ACLS Provider', 'Acreditação ONA', 'JCI',
                         'Residência Médica/Multiprofissional', 'Especialização Lato Sensu'],
    toneGuidance: 'Tom clínico, empático e baseado em evidências. Destaque volume de atendimento, protocolos seguidos, certificações clínicas e resultados em indicadores de saúde. Inclua especializações e residências.'
  },
  {
    id: 'legal',
    label: 'Direito & Compliance',
    icon: 'Scale',
    color: '#6366f1',
    description: 'Advocacia, compliance, LGPD, contratos e regulatório',
    industryContext: `O candidato busca vagas na área Jurídica ou de Compliance. 
Priorize keywords legais: due diligence, compliance, LGPD/GDPR, contencioso, 
contratos, M&A, governança corporativa, legal research, direito trabalhista/tributário/societário.
Linguagem formal e precisa é essencial neste setor.`,
    keywordHints: ['Due Diligence', 'Compliance', 'LGPD', 'GDPR', 'M&A',
                   'Contencioso Cível', 'Contencioso Trabalhista', 'Contratos',
                   'Governança Corporativa', 'Legal Research', 'Regulatory Affairs',
                   'Risk Assessment', 'Auditoria Jurídica', 'Pareceres',
                   'Direito Societário', 'Direito Tributário', 'Arbitragem',
                   'Mediação', 'Direito Digital', 'Propriedade Intelectual'],
    toolsHints: ['Thomson Reuters', 'LexisNexis', 'Projuris', 'Astrea',
                 'Legal One (SAP)', 'DocuSign', 'Themis', 'eSAJ', 'PJe',
                 'ADVBOX', 'Jusbrasil'],
    certificationHints: ['OAB', 'CCEP (Certified Compliance & Ethics Professional)',
                         'CIPM (Certified Information Privacy Manager)',
                         'DPO Certified (LGPD/GDPR)', 'Pós-Graduação em Direito Digital'],
    toneGuidance: 'Tom formal, preciso e assertivo. Destaque volume e valor de processos, contratos negociados, resultados judiciais favoráveis e áreas de atuação. Inclua tribunal e instância quando relevante.'
  },
  {
    id: 'finance',
    label: 'Finanças & Contabilidade',
    icon: 'DollarSign',
    color: '#059669',
    description: 'Controladoria, auditoria, FP&A, mercado financeiro',
    industryContext: `O candidato busca vagas em Finanças ou Contabilidade. 
Priorize keywords financeiras: FP&A, IFRS, CPC, GAAP, auditoria, controladoria, 
demonstrações financeiras (balanço, DRE, DFC), modelagem financeira, valuation, 
M&A, planejamento tributário. Precisão numérica e compliance são essenciais.`,
    keywordHints: ['FP&A', 'IFRS', 'CPC', 'GAAP', 'Auditoria Interna', 'Auditoria Externa',
                   'Controladoria', 'Balanço Patrimonial', 'DRE', 'Fluxo de Caixa',
                   'Modelagem Financeira', 'Valuation', 'M&A', 'Budget', 'Forecast',
                   'Planejamento Tributário', 'Transfer Pricing', 'SOX Compliance',
                   'Conciliação Contábil', 'Fechamento Contábil', 'Business Intelligence'],
    toolsHints: ['SAP FI/CO', 'SAP S/4HANA', 'Oracle EBS', 'Bloomberg Terminal',
                 'Power BI', 'Tableau', 'Excel Avançado (VBA, Power Query)',
                 'HFM (Hyperion)', 'Alteryx', 'Python (Pandas)'],
    certificationHints: ['CRC', 'CPA', 'CFA', 'FRM', 'CIA (Certified Internal Auditor)',
                         'ACCA', 'CGA', 'Certificação ANBIMA (CPA-10, CPA-20, CEA)'],
    toneGuidance: 'Tom analítico, preciso e orientado a compliance. Destaque volumes financeiros gerenciados (faturamento, budget), resultados de auditoria, redução de custos e conformidade regulatória.'
  },
  {
    id: 'education',
    label: 'Educação & Docência',
    icon: 'GraduationCap',
    color: '#8b5cf6',
    description: 'Ensino, pedagogia, EAD, coordenação acadêmica',
    industryContext: `O candidato busca vagas em Educação (docência, coordenação pedagógica, gestão escolar, EAD). 
Priorize keywords pedagógicas: planejamento curricular, metodologias ativas, 
avaliação formativa, EAD/ensino híbrido, BNCC, gestão de sala de aula, 
tecnologias educacionais, e inclusão. Publicações, pesquisas e experiência em sala são valorizadas.`,
    keywordHints: ['Planejamento Curricular', 'Metodologias Ativas', 'BNCC',
                   'Avaliação Formativa', 'Avaliação Somativa', 'EAD', 'Ensino Híbrido',
                   'Gestão de Sala de Aula', 'Inclusão', 'Design Instrucional',
                   'Educação Socioemocional', 'Aprendizagem Baseada em Projetos',
                   'Competências e Habilidades', 'Formação Continuada',
                   'Pesquisa Acadêmica', 'Extensão Universitária', 'Tutoria'],
    toolsHints: ['Moodle', 'Google Classroom', 'Canvas', 'Blackboard',
                 'Kahoot', 'Mentimeter', 'Microsoft Teams Education',
                 'Zoom', 'Genially', 'Padlet', 'Plataforma Lattes'],
    certificationHints: ['MEC', 'CAPES', 'CNPq', 'Lattes', 'Licenciatura',
                         'Mestrado/Doutorado', 'Pós-Doc', 'Cambridge CELTA/DELTA'],
    toneGuidance: 'Tom acadêmico-prático e humanizado. Destaque impacto pedagógico, publicações (Qualis), número de alunos/turmas, projetos de pesquisa e inovações metodológicas implementadas.'
  }
];

/**
 * Gera o contexto de indústria para injeção nos prompts da IA.
 * Se comboId for null/undefined, retorna string vazia (modo genérico).
 */
export function getComboContext(comboId: string | null | undefined): string {
  if (!comboId) return '';
  
  const combo = CAREER_COMBOS.find(c => c.id === comboId);
  if (!combo) return '';

  return `
## CONTEXTO DE INDÚSTRIA (OBRIGATÓRIO — PRIORIDADE MÁXIMA)
O candidato selecionou o setor: **${combo.label}**

${combo.industryContext}

### Keywords Prioritárias deste Setor (use como referência):
${combo.keywordHints.join(', ')}

### Ferramentas Valorizadas no Setor:
${combo.toolsHints.join(', ')}

### Certificações Relevantes:
${combo.certificationHints.join(', ')}

### Diretriz de Tom e Estilo:
${combo.toneGuidance}

⚠️ REGRA OBRIGATÓRIA: Priorize keywords e vocabulário ESPECÍFICOS deste setor.
NÃO sugira keywords genéricas de T.I. (como Agile, Scrum, Docker, React) a menos que a VAGA EXPLICITAMENTE as mencione.
As keywords genéricas (soft skills como "comunicação", "trabalho em equipe") devem representar NO MÁXIMO 15-20% das sugestões.
`;
}

/**
 * Retorna a lista de combos sem dados internos de prompt (para o frontend).
 */
export function getPublicCombos() {
  return CAREER_COMBOS.map(c => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    color: c.color,
    description: c.description,
    // Enviar os hints para exibição no frontend (tooltip, etc.)
    sampleKeywords: c.keywordHints.slice(0, 6),
    sampleTools: c.toolsHints.slice(0, 4)
  }));
}
