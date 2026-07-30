/** Cenas reais da Aliviar — ambientes físicos de acolhimento e curadoria. */
export const ALIVIAR_SCENES = {
  /** Recepção iluminada — primeira dobra da landing (refúgio seguro). */
  landingHero: "/scenes/recepcao-bright.jpg",
  /** Sala ampla com luz natural — seções de impacto na landing. */
  landingAtrium: "/scenes/grand-finale.jpg",
  /** Detalhe íntimo com arte e planta — dashboard do paciente (diário de bordo). */
  patientStudy: "/scenes/cena-6-detalhe.jpg",
  /** Sala de leitura reservada — variação complementar do dashboard. */
  patientReading: "/scenes/cena-5-quadro-planta.jpg",
} as const;

export type AliviarSceneKey = keyof typeof ALIVIAR_SCENES;
