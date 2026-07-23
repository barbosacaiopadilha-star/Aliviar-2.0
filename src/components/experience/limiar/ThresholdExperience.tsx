import { resolveFilmSrc } from "./film-model";
import { isFilmAssetDeployed } from "./film-availability.server";
import { LimiarExperience } from "./LimiarExperience";

type ThresholdExperienceProps = {
  filmSrc?: string;
};

export function ThresholdExperience({ filmSrc }: ThresholdExperienceProps) {
  const resolvedFilmSrc = resolveFilmSrc(filmSrc);
  const filmAvailable = isFilmAssetDeployed(resolvedFilmSrc);

  return (
    <LimiarExperience filmSrc={resolvedFilmSrc} filmAvailable={filmAvailable} />
  );
}
