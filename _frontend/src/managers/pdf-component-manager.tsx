import React from 'react';

import PdfItem from '@/components/content/pdf-item';
import { LAYOUTS } from '@/constants';
import { usePdfDocumentContext } from '@/context/pdf-document-context';
import Div from '@/pdf/components/pdf-div';

export default function PdfComponentManager() {
  const { layouts, items } = usePdfDocumentContext();

  return (
    <>
      {layouts.map((layout) => {
        switch (layout.layoutType) {
          case LAYOUTS.SINGLE: {
            return (
              <Div key={layout.layoutId}>
                {items.map((item) => {
                  if (item.layoutId === layout.layoutId) {
                    return <PdfItem key={item.contentId} {...item} />;
                  }
                })}
              </Div>
            );
          }
          case LAYOUTS.DOUBLE: {
            return (
              <Div key={layout.layoutId} className="flex flex-row">
                <Div
                  key={layout.layoutLeftId}
                  style={{ maxWidth: '50%', padding: '5px' }}
                >
                  {items.map((item) => {
                    if (item.layoutId === layout.layoutLeftId) {
                      return <PdfItem key={item.contentId} {...item} />;
                    }
                  })}
                </Div>
                <Div
                  key={layout.layoutLeftId}
                  style={{ maxWidth: '50%', padding: '5px' }}
                >
                  {items.map((item) => {
                    if (item.layoutId === layout.layoutRightId) {
                      return <PdfItem key={item.contentId} {...item} />;
                    }
                  })}
                </Div>
              </Div>
            );
          }
          default: {
            throw new Error(`Unsupported layoutType ${layout.layoutType}`);
          }
        }
      })}
    </>
  );
}
