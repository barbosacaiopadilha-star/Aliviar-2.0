import type { ReactNode } from "react";

import { ExperienceAtmosphere } from "./ExperienceAtmosphere";
import { ExperienceStaffFooter } from "./ExperienceStaffFooter";

type ExperienceShellProps = {
  rootClassName: string;
  mainClassName?: string;
  mainAriaHidden?: boolean;
  children: ReactNode;
};

export function ExperienceShell({
  rootClassName,
  mainClassName = "chapter-one__main",
  mainAriaHidden,
  children,
}: ExperienceShellProps) {
  return (
    <div className={rootClassName}>
      <ExperienceAtmosphere />
      <main className={mainClassName} aria-hidden={mainAriaHidden}>
        {children}
      </main>
      <ExperienceStaffFooter />
    </div>
  );
}
