import { redirect } from "next/navigation";

// MERGE DE 23/08 (decisão do Fundador: "às vezes tem muita página"): a
// Curadoria passou a viver no próprio Início — a Home tinha virado um cartaz
// de um botão só apontando para cá. A rota permanece como redirect porque
// meio produto aponta para ela (projeção da próxima ação, narrativa da
// Jornada, oráculos, favoritos de navegador); `/paciente/curadoria/imprimir`
// continua rota própria, inalterada.
export default function PatientCuradoriaPage() {
  redirect("/paciente");
}
