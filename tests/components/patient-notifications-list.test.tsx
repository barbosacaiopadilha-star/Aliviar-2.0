import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PatientNotificationsList } from "@/components/profiles/patient-notifications-list";
import type { PatientNotification } from "@/modules/profiles/types";

vi.mock("@/modules/profiles/patient-notification-actions", () => ({
  markPatientNotificationReadAction: vi.fn().mockResolvedValue({ success: true }),
}));

afterEach(cleanup);

const NOTIFICATIONS: PatientNotification[] = [
  {
    id: "1",
    profileId: "p1",
    title: "Bem-vindo à Aliviar",
    body: "Sua conta foi criada.",
    createdAt: new Date().toISOString(),
    readAt: null,
  },
  {
    id: "2",
    profileId: "p1",
    title: "Seus dados foram atualizados",
    body: "A equipe atualizou seu cadastro.",
    createdAt: new Date().toISOString(),
    readAt: new Date().toISOString(),
  },
];

describe("PatientNotificationsList", () => {
  it("mostra botão de marcar como lida só para notificações não lidas", () => {
    render(<PatientNotificationsList notifications={NOTIFICATIONS} />);

    expect(screen.getAllByRole("button", { name: "Marcar como lida" })).toHaveLength(1);
  });

  it("esconde o botão após marcar como lida", async () => {
    const user = userEvent.setup();
    render(<PatientNotificationsList notifications={NOTIFICATIONS} />);

    await user.click(screen.getByRole("button", { name: "Marcar como lida" }));

    expect(screen.queryByRole("button", { name: "Marcar como lida" })).not.toBeInTheDocument();
  });
});
