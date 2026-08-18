/**
 * Chaves Supabase viram valores de cabeçalho HTTP e, portanto, precisam ser
 * ASCII imprimível sem espaços. O Preview já recebeu literalmente o valor
 * mascarado "••••" da interface de configuração; sem esta porta, a falha só
 * aparecia depois como "ByteString" dentro do cliente HTTP.
 *
 * A mensagem identifica a variável, nunca imprime o segredo.
 */
export function assertSupabaseCredential(name: string, value: string): void {
  const parecePlaceholder = /^(?:[x*]+|redacted|masked)$/i.test(value);
  const contemCaractereInvalido = /[^\x21-\x7e]/.test(value);

  if (parecePlaceholder || contemCaractereInvalido) {
    throw new Error(
      `${name} está inválida: configure o valor real, sem máscara, espaços ou caracteres fora de ASCII.`,
    );
  }
}
// preview-integration-trigger
