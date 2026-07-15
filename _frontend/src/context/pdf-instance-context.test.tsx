import { act, renderHook } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { usePDFMock, updateInstanceMock } = vi.hoisted(() => ({
  usePDFMock: vi.fn(),
  updateInstanceMock: vi.fn(),
}));
vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>();
  return { ...actual, usePDF: usePDFMock };
});

const { LAYOUTS } = await import('@/constants');
const { AppProvider, useAppContext } = await import('@/context/app-context');
const { PdfPreviewProvider } = await import('@/context/pdf-preview-context');
const { PdfInstanceProvider, usePdfInstance } =
  await import('./pdf-instance-context');

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <PdfPreviewProvider>
        <PdfInstanceProvider>{children}</PdfInstanceProvider>
      </PdfPreviewProvider>
    </AppProvider>
  );
}

function useTestHarness() {
  return { pdfInstance: usePdfInstance(), appContext: useAppContext() };
}

// updateInstance() (mocked here) never actually mounts the JSX tree
// PdfInstanceProvider builds for it -- the real one hands it to
// react-pdf's own renderer, not React DOM. So the only way to reach the
// onRender closure it built is to read it back off the captured element
// tree itself, not by mocking PdfDocument (which would never be invoked
// under this mock either, for the same reason).
function getOnRenderFromLastCall() {
  const documentProviderElement = updateInstanceMock.mock.calls.at(-1)?.[0] as
    ReactElement<{ children: ReactElement<{ onRender: unknown }> }> | undefined;
  return documentProviderElement?.props.children.props.onRender as (
    props: unknown,
  ) => void;
}

beforeEach(() => {
  vi.useFakeTimers();
  updateInstanceMock.mockReset();
  usePDFMock.mockReset();
  usePDFMock.mockReturnValue([
    { loading: false, url: null, blob: null, error: null },
    updateInstanceMock,
  ]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePdfInstance', () => {
  it('throws when used outside a PdfInstanceProvider', () => {
    expect(() => renderHook(() => usePdfInstance())).toThrow(
      'usePdfInstance must be used within a PdfInstanceProvider',
    );
  });

  it('starts with a null pageCount and does not render the document immediately', () => {
    const { result } = renderHook(() => usePdfInstance(), { wrapper });

    expect(result.current.pageCount).toBeNull();
    expect(updateInstanceMock).not.toHaveBeenCalled();
  });

  it('calls updateInstance only after the debounce elapses', () => {
    renderHook(() => usePdfInstance(), { wrapper });

    act(() => {
      vi.advanceTimersByTime(1749);
    });
    expect(updateInstanceMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(updateInstanceMock).toHaveBeenCalledTimes(1);
  });

  it('resets the debounce timer when items/layouts change before it fires', () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(updateInstanceMock).not.toHaveBeenCalled();

    act(() => {
      result.current.appContext.addLayout({
        layoutId: 'new-layout' as never,
        layoutType: LAYOUTS.SINGLE,
      });
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(updateInstanceMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(750);
    });
    expect(updateInstanceMock).toHaveBeenCalledTimes(1);
  });

  it('drops to the ~450ms live debounce while the editing view is open', () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper });

    act(() => {
      result.current.appContext.openEditingView('c1' as never);
    });

    act(() => {
      vi.advanceTimersByTime(449);
    });
    expect(updateInstanceMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(updateInstanceMock).toHaveBeenCalledTimes(1);
  });

  it('clears the pending timeout on unmount without calling updateInstance', () => {
    const { unmount } = renderHook(() => usePdfInstance(), { wrapper });

    unmount();
    act(() => {
      vi.advanceTimersByTime(1750);
    });

    expect(updateInstanceMock).not.toHaveBeenCalled();
  });

  it('extracts pageCount from a valid onRender layout-data payload', () => {
    const { result } = renderHook(() => usePdfInstance(), { wrapper });

    act(() => {
      vi.advanceTimersByTime(1750);
    });
    const onRender = getOnRenderFromLastCall();

    act(() => {
      onRender({ _INTERNAL__LAYOUT__DATA_: { children: [{}, {}] } });
    });

    expect(result.current.pageCount).toBe(2);
  });

  it('ignores an onRender payload with no layout data at all', () => {
    const { result } = renderHook(() => usePdfInstance(), { wrapper });

    act(() => {
      vi.advanceTimersByTime(1750);
    });
    const onRender = getOnRenderFromLastCall();

    act(() => {
      onRender({});
    });

    expect(result.current.pageCount).toBeNull();
  });

  it('ignores an onRender payload with an empty page list', () => {
    const { result } = renderHook(() => usePdfInstance(), { wrapper });

    act(() => {
      vi.advanceTimersByTime(1750);
    });
    const onRender = getOnRenderFromLastCall();

    act(() => {
      onRender({ _INTERNAL__LAYOUT__DATA_: { children: [] } });
    });

    expect(result.current.pageCount).toBeNull();
  });
});
