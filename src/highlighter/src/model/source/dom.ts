import type { DomNode } from '@hamsterbase-third-party-internal/highlighter/src//types/index.js';
import type HighlightSource from '@hamsterbase-third-party-internal/highlighter/src/model/source/index.js';
import { ROOT_IDX } from '@hamsterbase-third-party-internal/highlighter/src/util/const.js';

/**
 * Because of supporting highlighting a same area (range overlapping),
 * Highlighter will calculate which text-node and how much offset it actually be,
 * based on the origin website dom node and the text offset.
 *
 * @param {Node} $parent element node in the origin website dom tree
 * @param {number} offset text offset in the origin website dom tree
 * @return {DomNode} DOM a dom info object
 */
export const getTextChildByOffset = (
  $parent: Node,
  offset: number
): DomNode => {
  const nodeStack: Node[] = [$parent];

  let $curNode: Node | undefined;
  let curOffset = 0;
  let startOffset = 0;

  while (($curNode = nodeStack.pop())) {
    const children = $curNode.childNodes;

    for (let i = children.length - 1; i >= 0; i--) {
      nodeStack.push(children[i]);
    }

    if ($curNode.nodeType === 3) {
      startOffset = offset - curOffset;
      curOffset += $curNode.textContent?.length ?? 0;
      if (curOffset >= offset) {
        break;
      }
    }
  }

  if (!$curNode) {
    $curNode = $parent;
  }

  return {
    $node: $curNode,
    offset: startOffset,
  };
};

/**
 * get start and end parent element from meta info
 *
 * @param {HighlightSource} hs
 * @param {HTMLElement | Document} $root root element, default document
 * @return {Object}
 */
export const queryElementNode = (
  hs: HighlightSource,
  $root: Document | HTMLElement
): { start: Node; end: Node } => {
  const start =
    hs.startMeta.parentIndex === ROOT_IDX
      ? $root
      : $root.getElementsByTagName(hs.startMeta.parentTagName)[
          hs.startMeta.parentIndex
        ];
  const end =
    hs.endMeta.parentIndex === ROOT_IDX
      ? $root
      : $root.getElementsByTagName(hs.endMeta.parentTagName)[
          hs.endMeta.parentIndex
        ];

  return { start, end };
};
