import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { ContentExperience } from '@/types/content-experience';

import BaseMacro from './base-macro';

type ExperienceMacroProps = ContentExperience;

export default function ExperienceMacro(props: ExperienceMacroProps) {
  const { content } = props;

  const {
    company, //
    location,
    title,
    dates,
    tags: rawTags,
    descriptions: rawDescriptions,
  } = content;

  const tags = useMemo(
    () => rawTags?.map((tag) => ({ id: uuidv4(), text: tag })),
    [rawTags],
  );
  const descriptions = useMemo(
    () => rawDescriptions?.map((tag) => ({ id: uuidv4(), text: tag })),
    [rawDescriptions],
  );

  return (
    <BaseMacro {...props}>
      <div className="flex flex-row">
        <p className="font-bold">{company}</p>
        <span className="px-1">|</span>
        {location && <p className="grow">{location}</p>}
        <p>{dates}</p>
      </div>
      <p className="italic">{title}</p>
      {tags && (
        <div className="flex flex-row">
          {tags.map((tag) => {
            return (
              <span
                key={tag.id}
                className="bg-black text-white font-bold py-1 px-1 mr-1 rounded text-xs"
              >
                {tag.text}
              </span>
            );
          })}
        </div>
      )}
      {descriptions && (
        <ul>
          {descriptions?.map((description) => {
            return (
              <li key={description.id} className="list-disc ml-3">
                {description.text}
              </li>
            );
          })}
        </ul>
      )}
    </BaseMacro>
  );
}
