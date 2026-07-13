import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import Div from '@/pdf/components/pdf-div';
import Img from '@/pdf/components/pdf-img';
import P from '@/pdf/components/pdf-p';
import GithubSvg from '@/pdf/icons/pdf-github';

import { toPdfComponents } from './pdf-transform-util';

// toPdfComponents returns react-pdf primitives (not DOM elements), which
// react-dom's render() can't mount -- so these assertions inspect the
// returned React element tree directly instead of rendering it.

describe('toPdfComponents', () => {
  it('converts a bare text node to a plain string', () => {
    const result = toPdfComponents('hello world');

    expect(result).toEqual(['hello world']);
  });

  it('maps a recognized tag to its PDF component, recursing into children', () => {
    const [element] = toPdfComponents('<p>hello</p>') as [React.ReactElement];

    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(P);
    expect((element.props as { children: unknown }).children).toEqual([
      'hello',
    ]);
  });

  it('falls back to a generic Div for unrecognized tags', () => {
    const [element] = toPdfComponents('<foo>hi</foo>') as [React.ReactElement];

    expect(element.type).toBe(Div);
    expect((element.props as { children: unknown }).children).toEqual(['hi']);
  });

  it('maps an <img src="./name.svg"> to the matching icon component', () => {
    const [element] = toPdfComponents(
      '<img src="./github.svg" alt="github">',
    ) as [React.ReactElement];

    expect(element.type).toBe(GithubSvg);
    expect((element.props as { src: string }).src).toBe('./github.svg');
    expect((element.props as { alt: string }).alt).toBe('github');
  });

  it('maps a non-svg <img> to the generic Img component', () => {
    const [element] = toPdfComponents('<img src="/photo.png">') as [
      React.ReactElement,
    ];

    expect(element.type).toBe(Img);
  });

  it('carries className and arbitrary attributes through as props', () => {
    const [element] = toPdfComponents(
      '<p class="lead" data-testid="x">hi</p>',
    ) as [React.ReactElement];

    expect((element.props as { className: string }).className).toBe('lead');
    expect((element.props as { 'data-testid': string })['data-testid']).toBe(
      'x',
    );
  });

  it('recurses through nested elements', () => {
    const [outer] = toPdfComponents('<div><p>nested</p></div>') as [
      React.ReactElement,
    ];
    const [inner] = (outer.props as { children: React.ReactElement[] })
      .children;

    expect(outer.type).toBe(Div);
    expect(inner.type).toBe(P);
    expect((inner.props as { children: unknown }).children).toEqual(['nested']);
  });

  it('assigns each element a unique key', () => {
    const [first, second] = toPdfComponents(
      '<p>a</p><p>b</p>',
    ) as React.ReactElement[];

    expect(first.key).toBeTruthy();
    expect(second.key).toBeTruthy();
    expect(first.key).not.toBe(second.key);
  });

  it('ignores node types that are neither elements nor text (e.g. comments)', () => {
    const result = toPdfComponents('<!-- a comment -->') as unknown[];

    expect(result).toEqual([]);
  });
});
