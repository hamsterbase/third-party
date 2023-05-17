export function isBlackListedElementNode(element: Node | null) {
  if (!element) {
    return false;
  }
  if (element.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }
  const computedStyle = getComputedStyle(element as any);
  if (computedStyle.display === 'none') {
    return true;
  }
  if (computedStyle.visibility === 'hidden') {
    return true;
  }

  const className = (element as any).className;
  if (
    className &&
    className.indexOf &&
    className.indexOf('HighlightBlacklistedElementClassName') >= 0
  ) {
    return true;
  }

  const tagName = (element as any).tagName;
  return (
    tagName === 'STYLE' ||
    tagName === 'SCRIPT' ||
    tagName === 'TITLE' ||
    tagName === 'NOSCRIPT'
  );
}
