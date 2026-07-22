"use client";

import { useEffect, useState } from "react";

import {
  fetchAdminConfig,
  fetchAdminUsers,
  fetchFeatureFlags,
  fetchPermissionMatrix,
  fetchPlatformHealth,
  searchAuditTrail,
  updateAdminConfig,
  updateAdminUser,
  updateFeatureFlag,
} from "@/governance-layer/api/admin-client";
import type { AdminUserView } from "@/governance-flow/contracts/admin-view";
import type { FeatureFlagView } from "@/governance-flow/contracts/feature-flag";
import type { SystemConfigurationSnapshot } from "@/governance-flow/contracts/system-configuration";

type AdminModule =
  | "configuracao"
  | "usuarios"
  | "permissoes"
  | "feature-flags"
  | "saude"
  | "auditoria";

const MODULES: { id: AdminModule; label: string }[] = [
  { id: "configuracao", label: "Configuração" },
  { id: "usuarios", label: "Usuários" },
  { id: "permissoes", label: "Permissões" },
  { id: "feature-flags", label: "Feature Flags" },
  { id: "saude", label: "Saúde da Plataforma" },
  { id: "auditoria", label: "Audit Trail" },
];

export function AdminPortalContent() {
  const [module, setModule] = useState<AdminModule>("configuracao");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6" data-testid="admin-portal">
      <nav className="flex flex-wrap gap-2">
        {MODULES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={module === item.id ? "btn-primary" : "btn-secondary"}
            onClick={() => {
              setModule(item.id);
              setError(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error ? <p className="text-sm text-coral">{error}</p> : null}

      {module === "configuracao" ? (
        <ConfiguracaoModule onError={setError} loading={loading} setLoading={setLoading} />
      ) : null}
      {module === "usuarios" ? <UsuariosModule onError={setError} /> : null}
      {module === "permissoes" ? <PermissoesModule onError={setError} /> : null}
      {module === "feature-flags" ? <FeatureFlagsModule onError={setError} /> : null}
      {module === "saude" ? <SaudeModule onError={setError} /> : null}
      {module === "auditoria" ? <AuditoriaModule onError={setError} /> : null}
    </div>
  );
}

function ConfiguracaoModule({
  onError,
  loading,
  setLoading,
}: {
  onError: (msg: string | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [config, setConfig] = useState<SystemConfigurationSnapshot | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  useEffect(() => {
    void fetchAdminConfig()
      .then((data) => {
        setConfig(data);
        setMaintenanceMessage(data.maintenance.message);
        onError(null);
      })
      .catch((err: Error) => onError(err.message));
  }, [onError]);

  async function saveMaintenance(enabled: boolean) {
    if (!config) return;
    setLoading(true);
    try {
      const updated = await updateAdminConfig({
        maintenance: { enabled, message: maintenanceMessage },
      });
      setConfig(updated);
      onError(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  if (!config) return <p className="text-ink-soft">Carregando configuração...</p>;

  return (
    <section className="card space-y-4 p-5" data-testid="admin-configuracao">
      <h2 className="font-medium text-ink">Configuração do sistema</h2>
      <p className="text-sm text-ink-soft">SLA por etapa: {config.sla_policies.length} políticas</p>
      <p className="text-sm text-ink-soft">Limite de upload: {config.upload_limits.max_bytes} bytes</p>
      <label className="block text-sm">
        <span className="text-ink-soft">Mensagem global (banner)</span>
        <input
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          value={config.global_messages.banner ?? ""}
          onChange={(e) =>
            setConfig({
              ...config,
              global_messages: { banner: e.target.value || null },
            })
          }
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink-soft">Mensagem de manutenção</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          value={maintenanceMessage}
          onChange={(e) => setMaintenanceMessage(e.target.value)}
          rows={2}
        />
      </label>
      <div className="flex gap-2">
        <button type="button" className="btn-primary" disabled={loading} onClick={() => void saveMaintenance(true)}>
          Ativar manutenção
        </button>
        <button type="button" className="btn-secondary" disabled={loading} onClick={() => void saveMaintenance(false)}>
          Desativar manutenção
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={loading}
          onClick={() =>
            void updateAdminConfig({ global_messages: config.global_messages })
              .then(setConfig)
              .catch((err: Error) => onError(err.message))
          }
        >
          Salvar mensagem global
        </button>
      </div>
    </section>
  );
}

function UsuariosModule({ onError }: { onError: (msg: string | null) => void }) {
  const [users, setUsers] = useState<AdminUserView[]>([]);

  useEffect(() => {
    void fetchAdminUsers()
      .then(setUsers)
      .catch((err: Error) => onError(err.message));
  }, [onError]);

  async function toggleActive(user: AdminUserView) {
    try {
      const updated = await updateAdminUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      onError(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Falha ao atualizar usuário.");
    }
  }

  return (
    <section className="card p-5" data-testid="admin-usuarios">
      <h2 className="mb-4 font-medium text-ink">Gestão de usuários</h2>
      <ul className="space-y-3">
        {users.map((user) => (
          <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm">
            <div>
              <p className="font-medium text-ink">{user.full_name}</p>
              <p className="text-ink-soft">
                {user.governance_role} — {user.is_active ? "Ativo" : "Inativo"}
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => void toggleActive(user)}>
              {user.is_active ? "Desativar" : "Ativar"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PermissoesModule({ onError }: { onError: (msg: string | null) => void }) {
  const [matrix, setMatrix] = useState<Array<{ permission: string; roles: string[] }>>([]);

  useEffect(() => {
    void fetchPermissionMatrix()
      .then((data) => setMatrix(data.permissions))
      .catch((err: Error) => onError(err.message));
  }, [onError]);

  return (
    <section className="card p-5" data-testid="admin-permissoes">
      <h2 className="mb-4 font-medium text-ink">Matriz RBAC</h2>
      <ul className="space-y-2 text-sm">
        {matrix.map((row) => (
          <li key={row.permission} className="rounded-lg border border-line p-3">
            <p className="font-medium text-ink">{row.permission}</p>
            <p className="text-ink-soft">{row.roles.join(", ")}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeatureFlagsModule({ onError }: { onError: (msg: string | null) => void }) {
  const [flags, setFlags] = useState<FeatureFlagView[]>([]);

  useEffect(() => {
    void fetchFeatureFlags()
      .then(setFlags)
      .catch((err: Error) => onError(err.message));
  }, [onError]);

  async function toggleFlag(flag: FeatureFlagView) {
    try {
      const updated = await updateFeatureFlag(flag.key, {
        enabled: !flag.enabled,
        rollout_percentage: flag.rollout_percentage,
        description: flag.description,
      });
      setFlags((prev) => prev.map((f) => (f.key === updated.key ? updated : f)));
      onError(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Falha ao atualizar flag.");
    }
  }

  return (
    <section className="card p-5" data-testid="admin-feature-flags">
      <h2 className="mb-4 font-medium text-ink">Feature Flags</h2>
      <ul className="space-y-3">
        {flags.map((flag) => (
          <li key={flag.key} className="flex items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm">
            <div>
              <p className="font-medium text-ink">{flag.key}</p>
              <p className="text-ink-soft">{flag.description}</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => void toggleFlag(flag)}>
              {flag.enabled ? "Desativar" : "Ativar"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SaudeModule({ onError }: { onError: (msg: string | null) => void }) {
  const [report, setReport] = useState<Awaited<ReturnType<typeof fetchPlatformHealth>> | null>(null);

  useEffect(() => {
    void fetchPlatformHealth()
      .then(setReport)
      .catch((err: Error) => onError(err.message));
  }, [onError]);

  if (!report) return <p className="text-ink-soft">Carregando saúde da plataforma...</p>;

  return (
    <section className="card p-5" data-testid="admin-saude">
      <h2 className="mb-2 font-medium text-ink">Saúde da plataforma</h2>
      <p className="text-sm text-ink-soft">Status: {report.status}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {report.checks.slice(0, 12).map((check) => (
          <li key={check.name} className="rounded border border-line p-2">
            {check.name} — {check.status}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AuditoriaModule({ onError }: { onError: (msg: string | null) => void }) {
  const [jornadaId, setJornadaId] = useState("");
  const [items, setItems] = useState<Array<{ event_type: string; occurred_at: string; resultado: string }>>([]);

  async function search() {
    try {
      const result = await searchAuditTrail({
        ...(jornadaId ? { jornada_id: jornadaId } : {}),
      });
      setItems(result.items);
      onError(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Falha na consulta.");
    }
  }

  return (
    <section className="card space-y-4 p-5" data-testid="admin-auditoria">
      <h2 className="font-medium text-ink">Consulta de auditoria</h2>
      <label className="block text-sm">
        <span className="text-ink-soft">Jornada ID</span>
        <input
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          value={jornadaId}
          onChange={(e) => setJornadaId(e.target.value)}
        />
      </label>
      <button type="button" className="btn-primary" onClick={() => void search()}>
        Pesquisar
      </button>
      <ul className="space-y-2 text-sm">
        {items.map((item, index) => (
          <li key={`${item.event_type}-${index}`} className="rounded border border-line p-2">
            {item.event_type} — {item.resultado} — {new Date(item.occurred_at).toLocaleString("pt-BR")}
          </li>
        ))}
      </ul>
    </section>
  );
}
