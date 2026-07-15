// Camada de Configuração da Biblioteca de FAQ
// (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §1) — dado puro, sem
// nenhuma lógica de motor. Extraído de faq-book-section.tsx (Playbook,
// Etapa 0/PR1) sem nenhuma mudança de texto ou comportamento. Mesmos 6
// pares Dúvida/Solução do mecanismo anterior (DuvidasStackSection).
export type DuvidaCard = {
  duvidaTitle: [string, string];
  duvidaText: string;
  solucaoTitle: [string, string];
  solucaoText: string;
};

export const CARDS: DuvidaCard[] = [
  {
    duvidaTitle: ["Não sei", "por onde começar"],
    duvidaText:
      "Você tem uma situação de saúde, mas não sabe como organizar os próximos passos.",
    solucaoTitle: ["Curadoria", "organizada"],
    solucaoText:
      "Uma pessoa da nossa equipe entende sua história e organiza um caminho claro para você.",
  },
  {
    duvidaTitle: ["Tenho medo de", "ficar sem suporte"],
    duvidaText:
      "A conversa migra para o WhatsApp e você teme ficar sozinho depois disso.",
    solucaoTitle: ["Acompanhamento", "em tempo real"],
    solucaoText:
      "A equipe Aliviar segue com você no WhatsApp, do mesmo jeito que aqui no site.",
  },
  {
    duvidaTitle: ["Não sei qual", "caminho escolher"],
    duvidaText:
      "Você não sabe se precisa decidir algo antes de começar, ou se existe um jeito certo de dar o primeiro passo.",
    solucaoTitle: ["Um caminho", "único e guiado"],
    solucaoText:
      "Você conta sua história uma vez e a nossa equipe organiza os próximos passos com você — não existe forma errada de começar.",
  },
  {
    duvidaTitle: ["Preocupado com", "meus dados"],
    duvidaText:
      "Contar sua história com uma empresa exige confiança sobre o que acontece com essa informação.",
    solucaoTitle: ["Uso restrito", "e consentido"],
    solucaoText:
      "Suas informações organizam seu atendimento e nunca são compartilhadas sem sua autorização.",
  },
  {
    duvidaTitle: ["Quanto tempo", "vou esperar"],
    duvidaText:
      "A incerteza sobre prazos é uma das partes mais difíceis de buscar cuidado.",
    solucaoTitle: ["Clareza sobre", "o próximo passo"],
    solucaoText:
      "O tempo varia conforme sua situação, mas você nunca fica sem saber o que vem a seguir.",
  },
  {
    duvidaTitle: ["A Aliviar", "substitui um médico?"],
    duvidaText:
      "É natural se perguntar se a curadoria troca o acompanhamento profissional de saúde.",
    solucaoTitle: ["Conectamos você", "a quem cuida"],
    solucaoText:
      "O cuidado em si é sempre humano — nós organizamos o caminho até ele.",
  },
];
