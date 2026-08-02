import { devolverTrava } from "../execucao-exclusiva";

export default function globalTeardown(): void {
  devolverTrava("e2e");
}
