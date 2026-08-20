"use server";

import { revalidatePath } from "next/cache";

import { falhaParaUsuario } from "@/lib/observability/erros";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import { professionalProfileSchema, professionalRegistrationStatusSchema } from "./professional-schema";
import {
  setRegistrationVerification,
  upsertPracticeArea,
  createProfessionalProfile,
  replaceCompetencyDomains,
  setProfessionalPublicationStatus,
  setProfessionalStatus,
  updateProfessionalProfile,
} from "./professional-repository";
import type { ActionResult, ProfileStatus, PublicationStatus } from "./types";

// ---------------------------------------------------------------------------
// Porta de publicação (ETAPA 6): as três actions que a tornam satisfazível —
// verificação do registro, área de atuação e a publicação com resultado
// legível (nunca mais error boundary genérico para uma condição de negócio).
// ---------------------------------------------------------------------------

export async function verifyRegistrationAction(
  id: string,
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const status = professionalRegistrationStatusSchema.safeParse(formData.get("registrationStatus"));
  const source = String(formData.get("registrationSource") ?? "").trim();
  if (!status.success) {
    return { success: false, error: "Escolha a situação do registro: regular, irregular ou não localizado." };
  }
  if (!source) {
    return { success: false, error: "Informe a fonte da verificação — status sem proveniência não é registrável." };
  }

  const supabase = await createServerSupabaseClient();
  try {
    await setRegistrationVerification(supabase, id, {
      status: status.data,
      source,
      adminId: authState.user.id,
    });
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("profiles.verificarRegistro", erro, {
        mensagem: "Não foi possível registrar a verificação do registro.",
        contexto: { profissionalId: id },
      }),
    };
  }

  revalidatePath(`/admin/profissionais/${id}`);
  return { success: true };
}

export async function savePracticeAreaAction(
  id: string,
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const rawText = String(formData.get("practiceAreaText") ?? "").trim();
  const tags = String(formData.get("practiceAreaTags") ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);
  const source = String(formData.get("practiceAreaSource") ?? "").trim() || null;
  const verify = formData.get("practiceAreaVerify") === "on";

  if (!rawText) {
    return { success: false, error: "Descreva a área de atuação — o texto original é sempre preservado." };
  }
  if (verify && !source) {
    return {
      success: false,
      error: "Verificar exige a fonte (site institucional, entrevista, documento) — verificação sem proveniência não existe.",
    };
  }

  const supabase = await createServerSupabaseClient();
  try {
    await upsertPracticeArea(supabase, id, {
      rawText,
      tags,
      source,
      verify,
      adminId: authState.user.id,
    });
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("profiles.areaDeAtuacao", erro, {
        mensagem: "Não foi possível salvar a área de atuação.",
        contexto: { profissionalId: id },
      }),
    };
  }

  revalidatePath(`/admin/profissionais/${id}`);
  return { success: true };
}

/**
 * Publicação com resultado legível: quando a porta do banco recusa, a frase
 * da recusa (que o trigger já escreve em português) chega à tela com
 * referência — nunca um error boundary genérico.
 */
export async function publishProfessionalAction(
  id: string,
  publicationStatus: PublicationStatus,
  _prevState: ActionResult | undefined,
  _formData: FormData,
): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();
  try {
    await setProfessionalPublicationStatus(supabase, id, publicationStatus, authState.user.id);
  } catch (erro) {
    // A frase do trigger do banco é a explicação certa (ex.: "Publicacao
    // exige area de atuacao verificada.") — preserva-se; a referência liga ao log.
    const causa = erro instanceof Error && erro.cause ? erro.cause : erro;
    const fraseDoBanco =
      typeof causa === "object" && causa !== null && "message" in causa
        ? String((causa as { message: unknown }).message)
        : null;
    const mensagem =
      fraseDoBanco && /publica|demonstra|divergencia/i.test(fraseDoBanco)
        ? fraseDoBanco
        : "Não foi possível atualizar a publicação do profissional.";
    return {
      success: false,
      error: falhaParaUsuario("profiles.publicarProfissional", erro, {
        mensagem,
        contexto: { profissionalId: id, publicationStatus },
      }),
    };
  }

  revalidatePath(`/admin/profissionais/${id}`);
  revalidatePath("/admin/profissionais");
  return { success: true };
}

function parseProfessionalForm(formData: FormData) {
  return professionalProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    professionalIdentifier: formData.get("professionalIdentifier"),
    crm: formData.get("crm"),
    crmUf: formData.get("crmUf"),
    professionalSummary: formData.get("professionalSummary"),
    institutionName: formData.get("institutionName"),
    experienceLevel: formData.get("experienceLevel"),
    intakeApproach: formData.get("intakeApproach"),
    offersContinuousCare: formData.get("offersContinuousCare"),
    availabilityWindow: formData.get("availabilityWindow"),
    competencyDomains: formData.getAll("competencyDomains"),
  });
}

// Nunca por autocadastro: só administrador chega até aqui (checagem
// server-side, além da RLS — "rotas e ações do servidor validam
// autorização, não apenas a interface").
export async function createProfessionalProfileAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = parseProfessionalForm(formData);
  if (!parsed.success) {
    return { success: false, error: "Confira os dados informados e tente novamente." };
  }

  const supabase = await createServerSupabaseClient();
  let created;
  try {
    created = await createProfessionalProfile(supabase, {
      displayName: parsed.data.displayName,
      professionalIdentifier: parsed.data.professionalIdentifier,
      crm: parsed.data.crm ?? null,
      crmUf: parsed.data.crmUf ?? null,
      professionalSummary: parsed.data.professionalSummary ?? null,
      institutionName: parsed.data.institutionName ?? null,
      experienceLevel: parsed.data.experienceLevel ?? null,
      intakeApproach: parsed.data.intakeApproach ?? null,
      offersContinuousCare: parsed.data.offersContinuousCare ?? null,
      availabilityWindow: parsed.data.availabilityWindow ?? null,
      competencyDomains: parsed.data.competencyDomains,
      createdBy: authState.user.id,
    });

    // Áreas de competência vivem em tabela própria — gravadas depois do perfil
    // existir, porque referenciam o id dele. Dentro do try: uma falha aqui era
    // exceção NÃO tratada, e a criação parecia simplesmente "não avançar".
    // SÓ quando o formulário declarou domínios: o form real não tem campos de
    // competência (removidos pela ADR-042) e o parse devolve `undefined`
    // (FS-03/ADR-048) — ausência de declaração nunca é um comando de escrita
    // (Bloco B/E7). Criar sem competências é legítimo: perfil nasce sem
    // domínios, sem erro.
    if (parsed.data.competencyDomains?.length) {
      await replaceCompetencyDomains(supabase, created.id, parsed.data.competencyDomains);
    }
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("profiles.criarProfissional", erro, {
        mensagem: "Não foi possível criar o profissional.",
        contexto: { identificador: parsed.data.professionalIdentifier },
      }),
    };
  }

  revalidatePath("/admin/profissionais");
  // Quem navega é a tela, não o framework — ver `ActionResult` em types.ts.
  return { success: true, redirectTo: `/admin/profissionais/${created.id}/cadastro` };
}

export async function updateProfessionalProfileAction(
  id: string,
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = parseProfessionalForm(formData);
  if (!parsed.success) {
    return { success: false, error: "Confira os dados informados e tente novamente." };
  }

  const supabase = await createServerSupabaseClient();
  try {
    await updateProfessionalProfile(supabase, id, {
      displayName: parsed.data.displayName,
      professionalIdentifier: parsed.data.professionalIdentifier,
      crm: parsed.data.crm ?? null,
      crmUf: parsed.data.crmUf ?? null,
      professionalSummary: parsed.data.professionalSummary ?? null,
      institutionName: parsed.data.institutionName ?? null,
      experienceLevel: parsed.data.experienceLevel ?? null,
      intakeApproach: parsed.data.intakeApproach ?? null,
      offersContinuousCare: parsed.data.offersContinuousCare ?? null,
      availabilityWindow: parsed.data.availabilityWindow ?? null,
      competencyDomains: parsed.data.competencyDomains,
      updatedBy: authState.user.id,
    });

    // Semântica de patch (Bloco B/E7, gate B15): campo ausente = "não
    // alterar". O form real de edição não tem campos de competência — o
    // parse devolve `undefined` (FS-03/ADR-048) — e editar dados básicos
    // NUNCA pode apagar as áreas já cadastradas. A substituição só roda
    // quando o formulário declarou domínios; remover tudo exigiria uma ação
    // explícita de esvaziamento (`esvaziamentoExplicito`), que nenhuma
    // superfície oferece hoje.
    if (parsed.data.competencyDomains?.length) {
      await replaceCompetencyDomains(supabase, id, parsed.data.competencyDomains);
    }
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("profiles.atualizarProfissional", erro, {
        mensagem: "Não foi possível atualizar o profissional.",
        contexto: { profissionalId: id },
      }),
    };
  }

  revalidatePath(`/admin/profissionais/${id}`);
  revalidatePath("/admin/profissionais");
  return { success: true };
}

// Toggles simples — usados diretamente como `action` de um <form>, sem
// useActionState (não há estado de campo para validar). Erro de
// autorização propaga para o error.tsx do segmento /admin.
export async function setProfessionalStatusAction(
  id: string,
  status: ProfileStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exigido pela assinatura de `action` de <form>
  _formData: FormData,
): Promise<void> {
  const authState = await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  try {
    await setProfessionalStatus(supabase, id, status, authState.user.id);
  } catch (erro) {
    // Propaga para o error.tsx do segmento, mas nunca sem deixar rastro.
    throw new Error(
      falhaParaUsuario("profiles.statusProfissional", erro, {
        mensagem: "Não foi possível atualizar o status do profissional.",
        contexto: { profissionalId: id, status },
      }),
      { cause: erro },
    );
  }
  revalidatePath(`/admin/profissionais/${id}`);
  revalidatePath("/admin/profissionais");
}

export async function setProfessionalPublicationStatusAction(
  id: string,
  publicationStatus: PublicationStatus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exigido pela assinatura de `action` de <form>
  _formData: FormData,
): Promise<void> {
  const authState = await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();
  try {
    await setProfessionalPublicationStatus(supabase, id, publicationStatus, authState.user.id);
  } catch (erro) {
    throw new Error(
      falhaParaUsuario("profiles.publicacaoProfissional", erro, {
        mensagem: "Não foi possível atualizar a publicação do profissional.",
        contexto: { profissionalId: id, publicationStatus },
      }),
      { cause: erro },
    );
  }
  revalidatePath(`/admin/profissionais/${id}`);
  revalidatePath("/admin/profissionais");
}
