/**
 * Something about the Selection/Range API in browsers.
 * If you want to use Highlighter in some old browsers, you may use a polyfill.
 * https://caniuse.com/#search=selection
 */

export const getDomRange = (globalContext: Window): Range | null => {
  const selection = globalContext.getSelection();
  if (!selection) {
    return null;
  }
  if (selection.isCollapsed) {
    // eslint-disable-next-line no-console
    console.debug("no text selected");

    return null;
  }

  return selection.getRangeAt(0);
};

export const removeSelection = (globalContext: Window): void => {
  globalContext.getSelection()?.removeAllRanges();
};
