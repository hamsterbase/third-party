export class DomUtils {
  constructor(
    private isBlackListedElementNode: (node: Node | null) => boolean,
    private normalizeText: (old: string) => string
  ) {}

  private findLastChildTextNode(node: Node | null): Node | null {
    if (!node) {
      return null;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }
    if (node.childNodes) {
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        if (this.isBlackListedElementNode(node.childNodes[i])) {
          continue;
        }
        const candidate = this.findLastChildTextNode(node.childNodes[i]);
        if (candidate !== null) {
          return candidate;
        }
      }
    }
    return null;
  }
  findPreviousTextNodeInDomTree(ptr: Node | null) {
    while (ptr) {
      while (this.isBlackListedElementNode(ptr?.previousSibling || null)) {
        ptr = ptr?.previousSibling || null;
      }
      while (ptr?.previousSibling) {
        const candidate = this.findLastChildTextNode(
          ptr?.previousSibling || null
        );
        if (candidate) {
          return candidate;
        }
        ptr = ptr.previousSibling;
      }

      ptr = ptr?.parentElement || null;
    }
    return null;
  }

  findNextTextNodeInDomTree(ptr: Node | null) {
    while (ptr) {
      while (this.isBlackListedElementNode(ptr?.nextSibling || null)) {
        ptr = ptr?.nextSibling || null;
      }
      while (ptr?.nextSibling) {
        if (this.isBlackListedElementNode(ptr?.nextSibling)) {
          ptr = ptr.nextSibling;
          continue;
        }
        const candidate = this.findFirstChildTextNode(ptr.nextSibling);
        if (candidate) {
          return candidate;
        }
        ptr = ptr.nextSibling;
      }

      ptr = ptr?.parentElement || null;
    }
    return null;
  }

  private findFirstChildTextNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }
    if (node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (this.isBlackListedElementNode(node.childNodes[i])) {
          continue;
        }
        const candidate = this.findFirstChildTextNode(node.childNodes[i]);
        if (candidate !== null) {
          return candidate;
        }
      }
    }
    return null;
  }

  getInnerText(element: Node): string {
    if (this.isBlackListedElementNode(element)) {
      return '';
    }
    if (element.nodeType === Node.TEXT_NODE) {
      return element.textContent ?? '';
    } else {
      if (typeof (element as any).innerText === 'undefined') {
        let result = '';
        for (let i = 0; i < element.childNodes.length; i++) {
          result += this.getInnerText(element.childNodes[i]);
        }
        return result;
      } else {
        return (element as any).innerText;
      }
    }
  }

  getNormalizedInnerText(element: Node) {
    return this.normalizeText(this.getInnerText(element));
  }

  findElementAtOffset(
    root: Node,
    offset: number
  ): { element: Node; offset: number } {
    if (root.nodeType === Node.TEXT_NODE) {
      return { element: root as Text, offset: offset };
    } else {
      let cumulativeOffset = 0;
      for (let i = 0; i < root.childNodes.length; i++) {
        if (this.isBlackListedElementNode(root.childNodes[i])) {
          continue;
        }
        const childSize = this.getNormalizedInnerText(
          root.childNodes[i]
        ).length;
        cumulativeOffset += childSize;
        if (cumulativeOffset < offset) {
          continue;
        }
        return this.findElementAtOffset(
          root.childNodes[i],
          offset - (cumulativeOffset - childSize)
        );
      }
      throw new Error('failed to findElementAtOffset');
    }
  }

  getRealOffset(textNode: Node, normalizedOffset: number) {
    const s = textNode.textContent || '';
    let cumulative = 0;
    for (let i = 0; i < s.length; i++) {
      while (i < s.length && !this.normalizeText(s.substr(i, 1))) {
        // omit whitespaces
        i++;
      }
      if (cumulative === normalizedOffset) {
        return i;
      }
      cumulative++;
    }
    if (cumulative === normalizedOffset) {
      return s.length;
    }
    throw new Error('failed to get real offset');
  }

  getBlackListedParent(node: Node): Element | null {
    let ptr = node;
    let blacklistedParentOfStartContainer: any = null;
    while (ptr) {
      if (this.isBlackListedElementNode(ptr)) {
        blacklistedParentOfStartContainer = ptr;
      }
      ptr = ptr.parentElement as Element;
    }
    return blacklistedParentOfStartContainer;
  }
}
