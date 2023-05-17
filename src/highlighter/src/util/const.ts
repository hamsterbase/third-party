import { HighlighterOptions } from './../types/index.js';
/**
 * all constants
 * cSpell:ignore mengshou
 */

import type HighlightSource from '@hamsterbase-third-party-internal/highlighter/src/model/source/index.js';
import type { ERROR } from '@hamsterbase-third-party-internal/highlighter/src/types/index.js';
import camel from '@hamsterbase-third-party-internal/highlighter/src/util/camel.js';
import EventEmitter from '@hamsterbase-third-party-internal/highlighter/src/util/event.emitter.js';

export const ID_DIVISION = ';';
export const LOCAL_STORE_KEY = 'highlight-mengshou';
export const STYLESHEET_ID = 'highlight-mengshou-style';

export const DATASET_IDENTIFIER = 'highlight-id';
export const DATASET_IDENTIFIER_EXTRA = 'highlight-id-extra';
export const DATASET_SPLIT_TYPE = 'highlight-split-type';
export const CAMEL_DATASET_IDENTIFIER = camel(DATASET_IDENTIFIER);
export const CAMEL_DATASET_IDENTIFIER_EXTRA = camel(DATASET_IDENTIFIER_EXTRA);
export const CAMEL_DATASET_SPLIT_TYPE = camel(DATASET_SPLIT_TYPE);

const DEFAULT_WRAP_TAG = 'span';

export const getDefaultOptions = (): HighlighterOptions => ({
  //@ts-ignore
  $root: document || document.documentElement,
  exceptSelectors: undefined,
  wrapTag: DEFAULT_WRAP_TAG,
  verbose: false,
  style: {
    className: 'highlight-mengshou-wrap',
  },
  contentWindow: window,
});

export const getStylesheet = () => `
    .${getDefaultOptions().style.className} {
        background: #ff9;
        cursor: pointer;
    }
    .${getDefaultOptions().style.className}.active {
        background: #ffb;
    }
`;

export const ROOT_IDX = -2;
export const UNKNOWN_IDX = -1;
export const INTERNAL_ERROR_EVENT = 'error';

interface EventHandlerMap {
  [key: string]: (...args: any[]) => void;
  error: (data: { type: ERROR; detail?: HighlightSource; error?: any }) => void;
}
class ErrorEventEmitter extends EventEmitter<EventHandlerMap> {}

export const eventEmitter = new ErrorEventEmitter();
