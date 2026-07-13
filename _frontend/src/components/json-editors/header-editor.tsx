import c from 'classnames';
import { object, string } from 'zod';

import EXAMPLE_HEADER from '@/__example-json/header-1.json';
import { CONTENT_TYPES } from '@/constants';
import type { ContentHeader, HeaderJson } from '@/types/content-header';
import type { NeverProps } from '@/types/generics';

import BaseEditor from './base-editor';

type HeaderEditorProps =
  | NeverProps
  | (ContentHeader & {
      content?: HeaderJson;
    });

const schema = object({
  header: string(),
});

export default function HeaderEditor(props: HeaderEditorProps) {
  const { content = EXAMPLE_HEADER } = props;

  const className = c('header-editor');

  return (
    <BaseEditor
      {...props}
      className={className}
      contentType={CONTENT_TYPES.HEADER}
      macro="Header"
      content={content}
      schema={schema}
    />
  );
}
