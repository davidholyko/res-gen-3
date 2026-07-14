import c from 'classnames';
import { array, record, string } from 'zod';

import { CONTENT_TYPES } from '@/constants';
import { ContentAnyList } from '@/types/content-any-list';
import type { FieldSpec } from '@/types/field-spec';

import BaseEditor from './base-editor';

// Always a placed block's inline editor now -- the ribbon's example-
// content template cards retired with specs/editor-redesign.md Phase 6.
type AnyListProps = ContentAnyList;

// zod v4 requires an explicit key schema for record() (v3 defaulted to
// string() keys implicitly).
const schema = record(string(), array(string()));

// One field spanning the whole record: AnyList's keys are user data
// ("Foods", "Gears", ...), not a fixed shape, so the single
// record-of-lists kind edits the entire content object -- its `name` is
// unused by convention (see field-spec.d.ts).
const fields: FieldSpec[] = [
  { kind: 'record-of-lists', name: '', label: 'Groups' },
];

export default function AnyListEditor(props: AnyListProps) {
  const className = c('any-list-editor');

  return (
    <BaseEditor
      {...props}
      className={className}
      contentType={CONTENT_TYPES.ANY_LIST}
      macro="AnyList"
      schema={schema}
      fields={fields}
    />
  );
}
