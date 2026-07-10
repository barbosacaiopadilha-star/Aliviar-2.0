import type { Profile } from "@/lib/types/database";
import { USER_ROLE_LABELS } from "@/lib/types/database";

type FieldErrors = Record<string, string>;

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  error,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="field-input"
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function JourneyFormSection({
  managers,
  fieldErrors = {},
  prefix = "",
}: {
  managers: Profile[];
  fieldErrors?: FieldErrors;
  prefix?: string;
}) {
  const name = (field: string) => `${prefix}${field}`;

  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-ink">Primeira Jornada</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Todo paciente recebe uma Jornada inicial no momento do cadastro.
        </p>
      </div>

      <Field
        label="Título da Jornada"
        name={name("title")}
        required
        error={fieldErrors.title}
        placeholder="Ex.: Acompanhamento pós-cirúrgico"
      />

      <div>
        <label htmlFor={name("objective")} className="field-label">
          Objetivo
        </label>
        <textarea
          id={name("objective")}
          name={name("objective")}
          rows={3}
          className="field-input"
          placeholder="Descreva o objetivo desta Jornada"
        />
      </div>

      <div>
        <label htmlFor={name("manager_id")} className="field-label">
          Gestor *
        </label>
        <select id={name("manager_id")} name={name("manager_id")} required className="field-input">
          <option value="">Selecione um Gestor</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.full_name} — {USER_ROLE_LABELS[manager.role]}
            </option>
          ))}
        </select>
        {fieldErrors.manager_id && <p className="field-error">{fieldErrors.manager_id}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={name("priority")} className="field-label">
            Prioridade
          </label>
          <select id={name("priority")} name={name("priority")} defaultValue="NORMAL" className="field-input">
            <option value="LOW">Baixa</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
        <Field
          label="Data de abertura"
          name={name("opened_at")}
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          error={fieldErrors.opened_at}
        />
      </div>
    </section>
  );
}

export function PatientFormFields({ fieldErrors = {} }: { fieldErrors?: FieldErrors }) {
  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-ink">Dados do paciente</h2>
        <p className="mt-1 text-sm text-ink-soft">CPF é opcional. O identificador oficial é o UUID interno.</p>
      </div>

      <Field label="Nome completo" name="full_name" required error={fieldErrors.full_name} />
      <Field
        label="Nome preferido"
        name="preferred_name"
        placeholder="Como a pessoa prefere ser chamada"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Data de nascimento" name="birth_date" type="date" error={fieldErrors.birth_date} />
        <Field label="CPF" name="cpf" placeholder="Somente números" error={fieldErrors.cpf} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Telefone" name="phone" error={fieldErrors.phone} />
        <Field label="E-mail" name="email" type="email" error={fieldErrors.email} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Cidade" name="city" />
        <Field label="Estado (UF)" name="state" placeholder="Ex.: SP" error={fieldErrors.state} />
        <Field label="Plano de saúde" name="health_plan" />
      </div>
    </section>
  );
}
