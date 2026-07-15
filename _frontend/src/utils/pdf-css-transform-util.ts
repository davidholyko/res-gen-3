export type CssProperties = {
  [key: string]: string;
};

export function toJsObject(cssText: string, selector: string) {
  let styles: { [key: string]: string } = {};

  cssText
    .replace(selector, '')
    .replaceAll('{', '')
    .replaceAll('}', '')
    .split(';')
    .forEach((style) => {
      const parts = style.split(':');
      if (parts.length === 2) {
        const property = parts[0].trim();
        const value = parts[1].trim();
        styles[property] = value;
      }
    });

  styles = replaceCSSVariables(styles);

  Object.entries(styles).forEach(([key, value]) => {
    delete styles[key];

    Object.assign(styles, { [toCamel(key)]: toPdfCssFormat(value) });
  });

  return {
    [selector.replace('.', '')]: styles,
  };
}

export function toCamel(str: string): string {
  return str.replace(/-([a-z])/g, function (match: string, letter: string) {
    return letter.toUpperCase();
  });
}

function filterObjectByPrefix(obj: CssProperties, prefix = '--') {
  const filteredObj: CssProperties = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && key.startsWith(prefix)) {
      filteredObj[key] = obj[key];
    }
  }
  return filteredObj;
}

function filterObjectWithoutPrefix(obj: CssProperties, prefix = '--') {
  const filteredObj: CssProperties = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !key.startsWith(prefix)) {
      filteredObj[key] = obj[key];
    }
  }
  return filteredObj;
}

export function replaceCSSVariables(cssRule: CssProperties): CssProperties {
  const variables = filterObjectByPrefix(cssRule);
  const replacement = filterObjectWithoutPrefix(cssRule);

  const replacedRule = JSON.stringify(replacement).replace(
    /var\((.*?)\)/g,
    (match, varName) => {
      // Extract the variable name
      const trimmedVarName = varName.trim();

      // Check if the variable exists in the provided variables object
      if (variables.hasOwnProperty(trimmedVarName)) {
        return variables[trimmedVarName];
      }

      // If the variable doesn't exist, keep it as it is
      return match;
    },
  );

  return JSON.parse(replacedRule);
}

export function toHex(rgbString: string) {
  // Extract RGB values and alpha value. Accepts both the
  // space-separated form stylesheets declare (rgb(0 0 0 / 0.5)) and the
  // comma-separated form getComputedStyle returns (rgb(0, 0, 0)).
  const matches = rgbString.match(
    /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[\s,/]+([\d.]+))?\)/,
  );
  if (!matches) {
    return rgbString; // leave as is
  }

  // 4th capture group (alpha) is intentionally unused: hex output has no alpha channel.
  const [, red, green, blue] = matches.map(Number);

  // Convert RGB values to hexadecimal
  const redHex = red.toString(16).padStart(2, '0');
  const greenHex = green.toString(16).padStart(2, '0');
  const blueHex = blue.toString(16).padStart(2, '0');

  // Combine the hexadecimal RGB values
  const hexColor = `#${redHex}${greenHex}${blueHex}`.toUpperCase();

  return hexColor;
}

export function getComputedRemFontSize() {
  // TODO this is unusable inside the iframe
  // Create a temporary div element
  const div = document.createElement('div');

  // Set the font size of the div to 1 rem
  div.style.fontSize = '1rem';

  // Append the div to the document body (so it becomes part of the rendering)
  document.body.appendChild(div);

  // Get the computed font size of the div
  const computedFontSize = window.getComputedStyle(div).fontSize;

  // Remove the temporary div from the document
  document.body.removeChild(div);

  return computedFontSize;
}

function toPx(
  value: string,
  replacement: 'em' | 'rem',
  baseFontSizeInPixels = getComputedStyle(document.documentElement).fontSize,
  multiplier = 14 / 16, // 15 for PDF is and 16 is rem for dom
): string {
  if (!value.endsWith(replacement)) {
    return value;
  }

  const pxValue =
    multiplier *
    Number(value.replace(replacement, '')) *
    Number(baseFontSizeInPixels.replace('px', ''));
  return pxValue.toString() + 'px';
}

// For values that arrive from getComputedStyle rather than from a
// declared rule: the browser has already resolved every var()/calc()/
// oklch() down to absolute px lengths and rgb() colors, so all that's
// left is hex conversion plus the same 14/16 web-rem-to-PDF scale the
// declared-value path applies to rem sizes (the PDF's base font is 14
// where the browser's is 16 -- res-gen-2 parity).
export function toPdfComputedFormat(value: string): string {
  return toHex(value)
    .split(' ')
    .map((part) => scaleComputedPx(part))
    .join(' ');
}

function scaleComputedPx(value: string, multiplier = 14 / 16): string {
  if (!/^-?\d*\.?\d+px$/.test(value)) {
    return value;
  }

  return `${Number(value.slice(0, -2)) * multiplier}px`;
}

export function toPdfCssFormat(string: string): string {
  string = toHex(string);
  string = string
    .split(' ')
    .map((str) => toPx(str, 'rem'))
    .map((str) => toPx(str, 'em'))
    .join(' ');

  return string;
}
