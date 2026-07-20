import type { ContentContact } from '@/types/content-contact';

import BaseMacro from './base-macro';
import ContactContent from './contents/contact-content';

type ContactMacroProps = ContentContact;

export default function ContactMacro(props: ContactMacroProps) {
  return (
    <BaseMacro {...props}>
      <ContactContent content={props.content} />
    </BaseMacro>
  );
}
