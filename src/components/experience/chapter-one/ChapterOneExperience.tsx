import { WelcomeLetter } from "./WelcomeLetter";
import { ExperienceShell } from "../shared";

export function ChapterOneExperience() {
  return (
    <ExperienceShell rootClassName="chapter-one">
      <WelcomeLetter />
    </ExperienceShell>
  );
}
