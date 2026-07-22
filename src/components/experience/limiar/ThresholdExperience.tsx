import { resolveFilmSrc } from "./film-model";
import { LimiarExperience } from "./LimiarExperience";

type ThresholdExperienceProps = {
  filmSrc?: string;
};

export function ThresholdExperience({ filmSrc }: ThresholdExperienceProps) {
  return <LimiarExperience filmSrc={resolveFilmSrc(filmSrc)} />;
}
