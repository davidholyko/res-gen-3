import Image from 'next/image';

import type { ContentContact } from '@/types/content-contact';

import BaseMacro from './base-macro';

type ContactMacroProps = ContentContact;

export default function ContactMacro(props: ContactMacroProps) {
  const { content } = props;
  const { name, title, phone, email, github, linkedin, website } = content;

  return (
    <BaseMacro {...props}>
      <h1 className="text-3xl font-bold text-center">{name}</h1>
      {title && <h4 className="text-center">{title}</h4>}
      <div className="flex flex-row justify-center text-center mr-2 flex-wrap">
        {phone && (
          <div className="flex flex-row items-center mr-2">
            <Image //
              src="./phone.svg"
              className="phone-icon icon inline mr-1"
              height="16"
              width="16"
              alt="phone icon"
            />
            <span className="whitespace-nowrap">{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex flex-row items-center mr-2">
            <Image //
              src="./gmail.svg"
              className="gmail-icon pdf-debug icon inline mr-1"
              height="16"
              width="16"
              alt="gmail icon"
            />
            <span className="">{email}</span>
          </div>
        )}
        {linkedin && (
          <div className="flex flex-row items-center mr-2">
            <Image
              src="./linkedin.svg"
              className="linkedin-icon icon inline mr-1"
              height="16"
              width="16"
              alt="linkedin icon"
            />
            <span className="">{linkedin}</span>
          </div>
        )}
        {github && (
          <div className="flex flex-row items-center mr-2">
            <Image //
              src="./github.svg"
              className="github-icon icon inline mr-1"
              height="16"
              width="16"
              alt="github icon"
            />
            <span className="">{github}</span>
          </div>
        )}
        {website && (
          <div className="flex flex-row items-center mr-2">
            <Image //
              src="./website.svg"
              className="website-icon icon inline mr-1"
              height="16"
              width="16"
              alt="website icon"
            />
            <span className="">{website}</span>
          </div>
        )}
      </div>
    </BaseMacro>
  );
}
