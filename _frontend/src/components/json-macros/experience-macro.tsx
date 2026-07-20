import type { ContentExperience } from '@/types/content-experience';

import BaseMacro from './base-macro';
import ExperienceContent from './contents/experience-content';

type ExperienceMacroProps = ContentExperience;

export default function ExperienceMacro(props: ExperienceMacroProps) {
  return (
    <BaseMacro {...props}>
      <ExperienceContent content={props.content} />
    </BaseMacro>
  );
}
