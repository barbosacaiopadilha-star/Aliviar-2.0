import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getCaseByStoryId } from "@/modules/cases/repository";
import {
  getPatientAccount,
  getPatientProfile,
  setPatientAccessAction,
  updatePatientProfileByAdminAction,
} from "@/modules/profiles";
import { listStoriesForProfile } from "@/modules/story/repository";
import {
  listAuditLogsForProfile,
  listCuratorOptions,
} from "@/modules/team/repository";

import { AdminPatientProfileForm } from "@/components/profiles/admin-patient-profile-form";
import { AuditLogList } from "@/components/admin/audit-log-list";
import { StartCaseButton } from "@/components/cases/start-case-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ResetPatientPasswordButton } from "@/components/profiles/reset-patient-password-button";

export const metadata: Metadata = {
  title: "Gerenciar paciente",
  robots: { index: false, follow: false },
};

type PatientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({
  params,
}: PatientDetailPageProps) {
  await requireRole("administrador");
  const { id } = await params;

  const regularClient = await createServerSupabaseClient();
  const adminClient = createAdminSupabaseClient();

  const [account, profile, history, stories, curators] = await Promise.all([
    getPatientAccount(regularClient, adminClient, id),
    getPatientProfile(regularClient, id),
    listAuditLogsForProfile(regularClient, id),
    listStoriesForProfile(regularClient, id),
    listCuratorOptions(regularClient),
  ]);

  if (!account) {
    notFound();
  }

  const storiesWithCase = await Promise.all(
    stories.map(async (story) => ({
      story,
      existingCase: await getCaseByStoryId(regularClient, story.id),
    })),
  );

  const nextActive = account.accountStatus !== "ativo";
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-sans text-xl font-semibold text-ink sm:text-2xl">
                {account.displayName}
              </h1>
              <p className="text-sm text-ink-muted">{account.email}</p>
              <div className="mt-2">
                <Badge
                  variant={
                    account.accountStatus === "ativo" ? "sage" : "default"
                  }
                >
                  {account.accountStatus === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>

            <form action={setPatientAccessAction.bind(null, id, nextActive)}>
              <Button
                type="submit"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {account.accountStatus === "ativo"
                  ? "Desativar acesso"
                  : "Ativar acesso"}
              </Button>
            </form>
          </div>
        </CardHeader>

        <ResetPatientPasswordButton profileId={id} email={account.email} />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Dados do paciente
          </h2>
        </CardHeader>

        <AdminPatientProfileForm
          action={updatePatientProfileByAdminAction.bind(null, id)}
          initialPhone={profile?.phone ?? ""}
          initialCity={profile?.city ?? ""}
          initialState={profile?.state ?? ""}
        />
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Histórias e casos
          </h2>
        </CardHeader>

        {storiesWithCase.length === 0 ? (
          <EmptyState
            title="Este paciente ainda não enviou nenhuma história."
            description="Um caso só pode ser iniciado a partir de uma história já enviada."
          />
        ) : (
          <ul className="divide-y divide-border">
            {storiesWithCase.map(({ story, existingCase }) => (
              <li
                key={story.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Badge
                    variant={story.status === "enviada" ? "sage" : "default"}
                  >
                    {story.status === "enviada" ? "Enviada" : "Rascunho"}
                  </Badge>
                  <p className="mt-1 text-xs text-ink-muted">
                    {new Date(story.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                {existingCase ? (
                  <Link
                    href={`/admin/casos/${existingCase.id}`}
                    className="font-medium text-brand-primary hover:text-brand-primary-deep"
                  >
                    Ver caso
                  </Link>
                ) : story.status === "enviada" ? (
                  <StartCaseButton storyId={story.id} curators={curators} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-sans text-lg font-semibold text-ink">
            Histórico
          </h2>
        </CardHeader>

        <AuditLogList
          entries={history}
          emptyMessage="Ainda não há histórico para este paciente."
        />
      </Card>
    </div>
  );
}
