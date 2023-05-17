import { runes } from '@hamsterbase-third-party-internal/runes/index.js';
import { DomUtils } from './dom-utils.js';
import { isBlackListedElementNode } from './is-blacklisted-element.js';
import { resolveSerializedRangeOffsetInText } from './resolve-range.js';

interface Options {
  rootElement: Element;
  document: Document;
  charsToKeep: number;
}

function normalizeText(s: string) {
  return s.replace(/\s/g, '').toLowerCase();
}

interface SerializedRange {
  textBefore: string;
  text: string;
  textAfter: string;
}

export class Marker {
  private domUtils: DomUtils;

  constructor(private options: Options) {
    this.options = options;
    this.domUtils = new DomUtils(isBlackListedElementNode, normalizeText);
  }

  private getRangeAroundBlackListedElement(range: Range): Range | null {
    const blacklistedParentOfStartContainer =
      this.domUtils.getBlackListedParent(range.startContainer);
    const blacklistedParentOfEndContainer = this.domUtils.getBlackListedParent(
      range.endContainer
    );
    if (
      blacklistedParentOfStartContainer &&
      blacklistedParentOfEndContainer &&
      blacklistedParentOfStartContainer === blacklistedParentOfEndContainer
    ) {
      return null;
    }
    const newRange = this.options.document.createRange();
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(range.endContainer, range.endOffset);

    if (blacklistedParentOfStartContainer) {
      newRange.setStart(
        this.domUtils.findNextTextNodeInDomTree(
          blacklistedParentOfStartContainer
        ) as any,
        0
      );
    }
    if (blacklistedParentOfEndContainer) {
      let prevNode = this.domUtils.findPreviousTextNodeInDomTree(
        blacklistedParentOfEndContainer
      ) as any;
      newRange.setEnd(prevNode, this.domUtils.getInnerText(prevNode).length);
    }
    return newRange;
  }

  private trimRangeSpaces(range: Range) {
    let start = this.domUtils
      .getInnerText(range.startContainer)
      .slice(range.startOffset);
    let startTrimmed = start.trimStart();
    range.setStart(
      range.startContainer,
      range.startOffset + (start.length - startTrimmed.length)
    );

    let end = this.domUtils
      .getInnerText(range.endContainer)
      .slice(0, range.endOffset);
    let endTrimmed = end.trimEnd();
    range.setEnd(
      range.endContainer,
      range.endOffset - (end.length - endTrimmed.length)
    );
  }

  serializeRange(range: Range): SerializedRange | null {
    const newRange = this.getRangeAroundBlackListedElement(range);
    if (!newRange) {
      return null;
    }
    const charsToKeepForTextBeforeAndTextAfter = this.options.charsToKeep;
    let text = range.toString();
    let textNormalized = normalizeText(text);
    if (textNormalized) {
      let textBefore = '';
      let textAfter = '';
      {
        // find textBefore
        textBefore =
          textBefore +
          this.domUtils
            .getInnerText(range.startContainer)
            .slice(0, range.startOffset);
        let ptr = range.startContainer as Node | null;
        while (textBefore.length < charsToKeepForTextBeforeAndTextAfter) {
          ptr = this.domUtils.findPreviousTextNodeInDomTree(ptr);
          if (!ptr) {
            // already reached the front
            break;
          }
          textBefore = (ptr as any).textContent + textBefore;
        }
        if (textBefore.length > charsToKeepForTextBeforeAndTextAfter) {
          textBefore = runes(textBefore)
            .slice(
              runes(textBefore).length - charsToKeepForTextBeforeAndTextAfter
            )
            .join('');
        }
      }

      {
        // find textAfter
        textAfter =
          textAfter +
          this.domUtils.getInnerText(range.endContainer).slice(range.endOffset);

        let ptr = range.endContainer as Node | null;
        while (textAfter.length < charsToKeepForTextBeforeAndTextAfter) {
          ptr = this.domUtils.findNextTextNodeInDomTree(ptr);
          if (!ptr) {
            // already reached the end
            break;
          }
          textAfter = textAfter + (ptr as any).textContent;
        }

        if (textAfter.length > charsToKeepForTextBeforeAndTextAfter) {
          textAfter = runes(textAfter)
            .slice(0, charsToKeepForTextBeforeAndTextAfter)
            .join('');
        }
      }
      return {
        text,
        textAfter,
        textBefore,
      };
    }

    return null;
  }

  batchDeserializeRange(serializedRanges: SerializedRange[]) {
    const results: Record<number, { range: Range; tenThousandth: number }> =
      {} as any;
    const errors = {} as any;
    const rootText = this.domUtils.getNormalizedInnerText(
      this.options.rootElement
    );
    for (let i = 0; i < serializedRanges.length; i++) {
      try {
        const offsetinText = resolveSerializedRangeOffsetInText(rootText, {
          text: normalizeText(serializedRanges[i].text),
          textAfter: normalizeText(serializedRanges[i].textAfter),
          textBefore: normalizeText(serializedRanges[i].textBefore),
        });
        if (!offsetinText) {
          throw new Error('');
        }
        const [startOffset, endOffset] = offsetinText;
        const start = this.domUtils.findElementAtOffset(
          this.options.rootElement,
          startOffset
        );
        const end = this.domUtils.findElementAtOffset(
          this.options.rootElement,
          endOffset
        );
        const range = document.createRange();
        range.setStart(
          start.element,
          this.domUtils.getRealOffset(start.element, start.offset)
        );
        range.setEnd(
          end.element,
          this.domUtils.getRealOffset(end.element, end.offset)
        );
        this.trimRangeSpaces(range);
        results[i] = {
          range,
          tenThousandth: Math.floor(
            (offsetinText[0] * 10000) / rootText.length
          ),
        };
      } catch (ex) {
        errors[i] = ex;
      }
    }

    return { results, errors };
  }

  public deserializeRange(serializedRange: SerializedRange): Range {
    const { results, errors } = this.batchDeserializeRange([serializedRange]);
    if (errors[0]) {
      throw errors[0];
    }
    return results[0].range;
  }
}
