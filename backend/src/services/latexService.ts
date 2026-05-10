/**
 * LaTeX Export Service
 * Generates ATS-optimized LaTeX code from structured resume JSON data.
 * Adapted from apresentando.me's formatResumeToLatex with improvements
 * to work with our dual-schema (professional/heritage) data model.
 */

interface ResumeContact {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface ResumeExperience {
  role: string;
  company: string;
  date: string;
  location: string;
  responsibilities: string[];
}

interface ResumeEducation {
  degree: string;
  institution: string;
  date: string;
  location: string;
}

interface ResumeSkillsGroup {
  category: string;
  items: string[];
}

interface ResumeLink {
  url: string;
  label: string;
}

interface ResumeProject {
  name: string;
  description: string;
  technologies: string;
  url: string;
}

interface ResumeData {
  language: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skillsGroup: ResumeSkillsGroup[];
  links?: ResumeLink[];
  projects?: ResumeProject[];
}

function escapeLatex(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}'); // Convert **bold** markdown to LaTeX \textbf
}

export function formatResumeToLatex(data: ResumeData): string {
  const isPt = data.language === 'pt-BR' || data.language === 'pt';

  let latex = `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[${isPt ? 'brazil' : 'english'}]{babel}
\\usepackage[left=2cm,right=2cm,top=2cm,bottom=2cm]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{xcolor}

% Colors
\\definecolor{primary}{RGB}{26, 28, 30}

% Formatting
\\titleformat{\\section}{\\Large\\bfseries\\color{primary}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{8pt}

\\newcommand{\\resumetitle}[1]{{\\fontsize{24}{28}\\selectfont\\textbf{\\color{primary}#1}}\\\\[6pt]}
\\newcommand{\\resumeheader}[1]{{\\small #1}\\\\[12pt]}

\\begin{document}
\\pagestyle{empty}

% Header
\\begin{center}
    \\resumetitle{${escapeLatex(data.name)}}
    \\resumeheader{
        ${[
          data.email,
          data.phone,
          data.address,
        ].filter(Boolean).map(escapeLatex).join(' $\\cdot$ ')}
    }
\\end{center}

`;

  // Summary
  if (data.summary) {
    latex += `\\section*{${isPt ? 'Resumo Profissional' : 'Professional Summary'}}
${escapeLatex(data.summary)}

`;
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    latex += `\\section*{${isPt ? 'Experiência Profissional' : 'Work Experience'}}
\\begin{itemize}[leftmargin=*,label={}]
`;
    data.experience.forEach(exp => {
      latex += `    \\item \\textbf{${escapeLatex(exp.role)}} $|$ ${escapeLatex(exp.company)} \\hfill {\\small ${escapeLatex(exp.date)}}
    \\begin{itemize}[leftmargin=1.5em,label=\\textbullet]
`;
      exp.responsibilities.forEach(bullet => {
        latex += `        \\item ${escapeLatex(bullet)}
`;
      });
      latex += `    \\end{itemize}
    \\vspace{4pt}
`;
    });
    latex += `\\end{itemize}

`;
  }

  // Skills
  if (data.skillsGroup && data.skillsGroup.length > 0) {
    latex += `\\section*{${isPt ? 'Competências' : 'Skills'}}
`;
    data.skillsGroup.forEach(group => {
      latex += `\\textbf{${escapeLatex(group.category)}:} ${group.items.map(escapeLatex).join(', ')}\\\\[4pt]
`;
    });
    latex += `
`;
  }

  // Education
  if (data.education && data.education.length > 0) {
    latex += `\\section*{${isPt ? 'Formação Acadêmica' : 'Education'}}
\\begin{itemize}[leftmargin=*,label={}]
`;
    data.education.forEach(edu => {
      latex += `    \\item \\textbf{${escapeLatex(edu.degree)}} $|$ ${escapeLatex(edu.institution)} \\hfill {\\small ${escapeLatex(edu.date)}}
`;
    });
    latex += `\\end{itemize}

`;
  }

  // Projects (Heritage only)
  if (data.projects && data.projects.length > 0) {
    latex += `\\section*{${isPt ? 'Projetos' : 'Projects'}}
\\begin{itemize}[leftmargin=*,label={}]
`;
    data.projects.forEach(proj => {
      latex += `    \\item \\textbf{${escapeLatex(proj.name)}} $|$ {\\small ${escapeLatex(proj.technologies)}}
    \\begin{itemize}[leftmargin=1.5em,label=\\textbullet]
        \\item ${escapeLatex(proj.description)}
    \\end{itemize}
`;
      if (proj.url) {
        latex += `    {\\small \\url{${proj.url}}}
`;
      }
      latex += `    \\vspace{4pt}
`;
    });
    latex += `\\end{itemize}

`;
  }

  latex += `\\end{document}`;
  return latex;
}

export function formatCoverLetterToLatex(content: string, isPt: boolean = true): string {
  const paragraphs = content.split('\n\n').map(p => p.trim()).filter(Boolean);

  let latex = `\\documentclass[a4paper,11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[${isPt ? 'brazil' : 'english'}]{babel}
\\usepackage[left=2.5cm,right=2.5cm,top=3cm,bottom=3cm]{geometry}
\\usepackage{mathptmx}
\\usepackage{setspace}
\\onehalfspacing

\\begin{document}
\\pagestyle{empty}
\\begin{flushright}
  \\today
\\end{flushright}
\\vspace{1cm}

`;

  for (const p of paragraphs) {
    latex += `${escapeLatex(p)}\n\n`;
  }

  latex += `\\end{document}`;
  return latex;
}
