import React, { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

import H1 from '@/pdf/components/pdf-h1';
import H2 from '@/pdf/components/pdf-h2';
import H3 from '@/pdf/components/pdf-h3';
import H4 from '@/pdf/components/pdf-h4';
import H5 from '@/pdf/components/pdf-h5';
import Img from '@/pdf/components/pdf-img';
import LI from '@/pdf/components/pdf-li';
import P from '@/pdf/components/pdf-p';
import Span from '@/pdf/components/pdf-span';
import UL from '@/pdf/components/pdf-ul';
import GithubSvg from '@/pdf/icons/pdf-github';
import GmailSvg from '@/pdf/icons/pdf-gmail';
import LinkedinSvg from '@/pdf/icons/pdf-linkedin';
import PhoneSvg from '@/pdf/icons/pdf-phone';
import WebsiteSvg from '@/pdf/icons/pdf-website';

import Div from '../pdf/components/pdf-div';

const COMPONENTS = {
  div: Div,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  p: P,
  span: Span,
  ul: UL,
  li: LI,
  img: Img,
} as const;

const ICONS = {
  github: GithubSvg,
  gmail: GmailSvg,
  linkedin: LinkedinSvg,
  website: WebsiteSvg,
  phone: PhoneSvg,
} as const;

/**
 * Converts an HTML string to JSX for PDF components.
 * @param htmlString The HTML string to convert.
 * @returns JSX elements representing the HTML structure.
 */
export function toPdfComponents(htmlString: string): ReactNode {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;

  const jsxElements: ReactNode[] = [];

  for (let i = 0; i < tempDiv.childNodes.length; i++) {
    const childNode = tempDiv.childNodes[i];

    if (childNode.nodeType === 1) {
      const { tagName, attributes, className } = childNode as Element;

      const props: { [key: string]: string } = {
        className,
      };

      for (let j = 0; j < attributes.length; j++) {
        const { name, value } = attributes[j];
        props[name] = value;
      }

      const tag = tagName.toLowerCase() as keyof typeof COMPONENTS;

      let Component = COMPONENTS[tag];

      // currently expects the img src to be like "./github.svg"
      // if we change the string pattern, we will need to update regex
      const regex = /\.\/(.*?)\.svg/;
      const match = regex.exec(props.src);

      if (match && match[1]) {
        const [, matcher] = match;

        // @ts-expect-error -- matcher is a dynamically-extracted string, not a typed key of ICONS
        Component = ICONS[matcher];

        jsxElements.push(
          // @ts-expect-error -- Component is dynamically resolved, its exact prop type isn't known here
          <Component key={uuidv4()} {...props} />,
        );
      } else if (Component) {
        jsxElements.push(
          // @ts-expect-error -- Component is dynamically resolved, its exact prop type isn't known here
          <Component key={uuidv4()} {...props}>
            {toPdfComponents((childNode as Element).innerHTML)}
          </Component>,
        );
      } else {
        // If the tag name is not in COMPONENTS, treat it as a generic div
        jsxElements.push(
          <Div key={uuidv4()} {...props}>
            {toPdfComponents((childNode as Element).innerHTML)}
          </Div>,
        );
      }
    } else if (childNode.nodeType === 3) {
      jsxElements.push(childNode.textContent || ''); // Handle text nodes
    }
  }

  return jsxElements;
}
