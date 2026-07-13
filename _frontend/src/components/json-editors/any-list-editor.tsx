import c from 'classnames';
import { array, record, string } from 'zod';

import EXAMPLE_ANY_LIST from '@/__example-json/any-list-1.json';
import { CONTENT_TYPES } from '@/constants';
import { ContentAnyList } from '@/types/content-any-list';
import type { NeverProps } from '@/types/generics';

import BaseEditor from './base-editor';

type AnyListProps = NeverProps | ContentAnyList;

// zod v4 requires an explicit key schema for record() (v3 defaulted to
// string() keys implicitly).
const schema = record(string(), array(string()));

export default function AnyListEditor(props: AnyListProps) {
  const { content = EXAMPLE_ANY_LIST } = props;

  const className = c('any-list-editor');

  return (
    <BaseEditor
      {...props}
      className={className}
      contentType={CONTENT_TYPES.ANY_LIST}
      macro="AnyList"
      content={content}
      schema={schema}
    />
  );
}
