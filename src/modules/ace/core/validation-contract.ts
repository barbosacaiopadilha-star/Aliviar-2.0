// Contrato de validação — agora mantido pela Plataforma
// (docs/ace/06-governance/governance.md, seção 5).
//
// A forma foi absorvida em `src/platform/validation/validation-result.ts`, onde
// ganhou severidade (bloqueio × aviso), combinação de validadores e
// agrupamento por campo — o que faltava para uma tela mostrar o problema no
// campo certo em vez de dizer que "algo" está errado.
//
// O contrato do ACE nunca chegou a ter chamador: os protocolos validam com
// `ProtocolError`. Ele permanece exportado, apontando para a implementação
// única, para que a próxima validação do ACE nasça já convergida.

export {
  advisory,
  blocking,
  blockingIssues,
  combine,
  issuesByField,
  resultOf,
  VALID,
  type ValidationIssue,
  type ValidationResult,
  type Validator,
} from "@/platform/validation/validation-result";
