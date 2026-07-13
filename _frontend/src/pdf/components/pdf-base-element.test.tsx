import { render } from '@testing-library/react';
import { View } from '@react-pdf/renderer';
import type { ElementType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PdfDocumentProvider } from '@/context/pdf-document-context';

import BaseElement from './pdf-base-element';

// react-pdf's primitives (View, Text, ...) render as unrecognized custom
// elements under react-dom; React doesn't reliably serialize non-standard
// boolean props like `debug` onto them. Substituting a plain function as
// `Element` lets us capture exactly what props BaseElement passes down,
// via a mock call rather than mutating an outer variable during render
// (which react-hooks/immutability correctly flags as an impure render).
const onRenderElement = vi.fn();
function CapturingElement(props: Record<string, unknown>) {
  onRenderElement(props);
  return <div>{props.children as React.ReactNode}</div>;
}

function renderBaseElement(
  props: Partial<React.ComponentProps<typeof BaseElement>> = {},
  Element: ElementType = View,
) {
  return render(
    <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
      <BaseElement element="div" Element={Element} {...props}>
        content
      </BaseElement>
    </PdfDocumentProvider>,
  );
}

describe('BaseElement', () => {
  it('renders the given Element with computed styles', () => {
    const { container } = render(
      <PdfDocumentProvider styles={{}} items={[]} layouts={[]} title="">
        <BaseElement element="div" Element={View}>
          content
        </BaseElement>
      </PdfDocumentProvider>,
    );

    expect(container.querySelector('view')).toHaveTextContent('content');
  });

  it('defaults debug to false and does not log debug info', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    renderBaseElement();

    expect(infoSpy).not.toHaveBeenCalled();
    infoSpy.mockRestore();
  });

  describe('when debug is true', () => {
    let infoSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
      infoSpy.mockRestore();
    });

    it('logs debug info', () => {
      renderBaseElement({ debug: true });

      expect(infoSpy).toHaveBeenCalledWith('^^^ styleSheet', expect.anything());
      expect(infoSpy).toHaveBeenCalledWith('^^^ styles', expect.anything());
      expect(infoSpy).toHaveBeenCalledWith('^^^ className', undefined);
    });
  });

  it('treats a className containing "debug" as enabling debug mode even when the debug prop is false', () => {
    onRenderElement.mockClear();
    renderBaseElement(
      { className: 'foo debug bar', debug: false },
      CapturingElement,
    );

    expect(onRenderElement).toHaveBeenCalledWith(
      expect.objectContaining({ debug: true }),
    );
  });

  it('is not in debug mode when neither debug prop nor className request it', () => {
    onRenderElement.mockClear();
    renderBaseElement({ className: 'foo bar' }, CapturingElement);

    expect(onRenderElement).toHaveBeenCalledWith(
      expect.objectContaining({ debug: false }),
    );
  });
});
