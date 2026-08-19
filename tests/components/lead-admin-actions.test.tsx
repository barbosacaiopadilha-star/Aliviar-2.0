import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LeadAdminActions } from "@/components/crm/lead-admin-actions";
import {
  archiveLeadAdminAction,
  deleteLeadAdminAction,
  restoreLeadAdminAction,
} from "@/modules/crm/admin-lead-actions";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/modules/crm/admin-lead-actions", () => ({
  archiveLeadAdminAction: vi.fn(),
  deleteLeadAdminAction: vi.fn(),
  restoreLeadAdminAction: vi.fn(),
}));

const props = {
  leadId: "a0cea904-fa63-4b42-b607-e24c2887cc51",
  fullName: "Registro Sintético",
  archived: false,
  hasPatient: false,
  hasCase: false,
  returnHref: "/atendimento",
};

describe("LeadAdminActions", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(archiveLeadAdminAction).mockResolvedValue({ success: true });
    vi.mocked(deleteLeadAdminAction).mockResolvedValue({ success: true });
    vi.mocked(restoreLeadAdminAction).mockResolvedValue({ success: true });
  });

  it("só arquiva depois de receber um motivo válido", async () => {
    const user = userEvent.setup();
    render(<LeadAdminActions {...props} />);

    await user.click(screen.getByRole("button", { name: "Arquivar lead" }));
    const confirm = screen.getByRole("button", {
      name: "Confirmar arquivamento",
    });
    expect(confirm).toBeDisabled();

    await user.type(
      screen.getByLabelText("Motivo da ação"),
      "Resíduo de teste confirmado.",
    );
    const enabledConfirm = screen.getByRole("button", {
      name: "Confirmar arquivamento",
    });
    expect(enabledConfirm).toBeEnabled();
    await user.click(enabledConfirm);

    await waitFor(() =>
      expect(archiveLeadAdminAction).toHaveBeenCalledWith({
        leadId: props.leadId,
        reason: "Resíduo de teste confirmado.",
      }),
    );
    expect(deleteLeadAdminAction).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/atendimento");
  });

  it("não apaga sem motivo e confirmação nominal exata", async () => {
    const user = userEvent.setup();
    render(<LeadAdminActions {...props} />);

    await user.click(
      screen.getByRole("button", { name: "Apagar definitivamente" }),
    );
    const deleteButton = within(screen.getByRole("dialog")).getByRole(
      "button",
      {
        name: "Apagar definitivamente",
      },
    );

    await user.type(
      screen.getByLabelText("Motivo da ação"),
      "Teste encerrado.",
    );
    await user.type(
      screen.getByLabelText(
        `Digite exatamente “${props.fullName}” para confirmar`,
      ),
      "Nome incorreto",
    );
    expect(deleteButton).toBeDisabled();
    expect(deleteLeadAdminAction).not.toHaveBeenCalled();

    await user.clear(
      screen.getByLabelText(
        `Digite exatamente “${props.fullName}” para confirmar`,
      ),
    );
    await user.type(
      screen.getByLabelText(
        `Digite exatamente “${props.fullName}” para confirmar`,
      ),
      props.fullName,
    );
    expect(deleteButton).toBeEnabled();
    await user.click(deleteButton);

    await waitFor(() =>
      expect(deleteLeadAdminAction).toHaveBeenCalledWith({
        leadId: props.leadId,
        reason: "Teste encerrado.",
        confirmation: props.fullName,
      }),
    );
  });

  it("oferece restauração quando o lead está arquivado", async () => {
    const user = userEvent.setup();
    render(<LeadAdminActions {...props} archived />);

    expect(
      screen.queryByRole("button", { name: "Arquivar lead" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restaurar lead" }));
    await user.type(
      screen.getByLabelText("Motivo da ação"),
      "Retorno autorizado.",
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar restauração" }),
    );

    await waitFor(() =>
      expect(restoreLeadAdminAction).toHaveBeenCalledWith({
        leadId: props.leadId,
        reason: "Retorno autorizado.",
      }),
    );
  });
});
