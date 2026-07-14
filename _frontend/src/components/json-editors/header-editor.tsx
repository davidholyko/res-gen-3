import c from 'classnames';
import { object, string } from 'zod';

import { CONTENT_TYPES } from '@/constants';
import type { ContentHeader } from '@/types/content-header';
import type { FieldSpec } from '@/types/field-spec';

import BaseEditor from './base-editor';

// Always a placed block's inline editor now -- the ribbon's example-
// content template cards retired with specs/editor-redesign.md Phase 6,
// so `content` is required, never defaulted.
type HeaderEditorProps = ContentHeader;

const schema = object({
  header: string(),
});

const fields: FieldSpec[] = [{ kind: 'text', name: 'header', label: 'Header' }];

export default function HeaderEditor(props: HeaderEditorProps) {
  const className = c('header-editor');

  return (
    <BaseEditor
      {...props}
      className={className}
      contentType={CONTENT_TYPES.HEADER}
      macro="Header"
      schema={schema}
      fields={fields}
    />
  );
}
