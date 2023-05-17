import type {
  DomNode,
  DomMeta,
  HookMap,
  HighlighterOptions,
} from '@hamsterbase-third-party-internal/highlighter/src/types/index.js';
import EventEmitter from '@hamsterbase-third-party-internal/highlighter/src/util/event.emitter.js';
import HighlightRange from '@hamsterbase-third-party-internal/highlighter/src/model/range/index.js';
import HighlightSource from '@hamsterbase-third-party-internal/highlighter/src/model/source/index.js';
import uuid from '@hamsterbase-third-party-internal/highlighter/src/util/uuid.js';
import Hook from '@hamsterbase-third-party-internal/highlighter/src/util/hook.js';
import getInteraction from '@hamsterbase-third-party-internal/highlighter/src/util/interaction.js';
import Cache from '@hamsterbase-third-party-internal/highlighter/src/data/cache.js';
import Painter from '@hamsterbase-third-party-internal/highlighter/src/painter/index.js';
import {
  eventEmitter,
  getDefaultOptions,
  INTERNAL_ERROR_EVENT,
} from '@hamsterbase-third-party-internal/highlighter/src/util/const.js';
import {
  ERROR,
  EventType,
  CreateFrom,
} from '@hamsterbase-third-party-internal/highlighter/src/types/index.js';
import {
  addClass,
  removeClass,
  isHighlightWrapNode,
  getHighlightById,
  getExtraHighlightId,
  getHighlightsByRoot,
  getHighlightId,
  addEventListener,
  removeEventListener,
} from '@hamsterbase-third-party-internal/highlighter/src/util/dom.js';

interface EventHandlerMap {
  [key: string]: (...args: any[]) => void;
  [EventType.CLICK]: (
    data: { id: string },
    h: Highlighter,
    e: MouseEvent | TouchEvent
  ) => void;
  [EventType.HOVER]: (
    data: { id: string },
    h: Highlighter,
    e: MouseEvent | TouchEvent
  ) => void;
  [EventType.HOVER_OUT]: (
    data: { id: string },
    h: Highlighter,
    e: MouseEvent | TouchEvent
  ) => void;
  [EventType.CREATE]: (
    data: {
      sources: HighlightSource[];
      type: CreateFrom;
      meta?: { textAfter: string; textBefore: string };
    },
    h: Highlighter
  ) => void;
  [EventType.REMOVE]: (data: { ids: string[] }, h: Highlighter) => void;
}

export class Highlighter extends EventEmitter<EventHandlerMap> {
  static event = EventType;

  static isHighlightWrapNode = isHighlightWrapNode;

  hooks: HookMap;

  //@ts-ignore
  painter: Painter;

  cache: Cache;

  //@ts-ignore
  private _hoverId: string;

  private options: HighlighterOptions;

  private readonly event = getInteraction();

  constructor(options?: HighlighterOptions) {
    super();
    //@ts-ignore
    this.options = getDefaultOptions();
    // initialize hooks
    this.hooks = this._getHooks();
    this.setOption(options);
    // initialize cache
    this.cache = new Cache();

    const $root = this.options.$root;

    // initialize event listener
    //@ts-ignore
    addEventListener($root, this.event.PointerOver, this._handleHighlightHover);
    // initialize event listener
    //@ts-ignore
    addEventListener($root, this.event.PointerTap, this._handleHighlightClick);
    eventEmitter.on(INTERNAL_ERROR_EVENT, this._handleError);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  static isHighlightSource = (d: any) => !!d.__isHighlightSource;

  run = () =>
    addEventListener(
      //@ts-ignore
      this.options.$root,
      this.event.PointerEnd,
      this._handleSelection
    );

  stop = () => {
    removeEventListener(
      //@ts-ignore
      this.options.$root,
      this.event.PointerEnd,
      this._handleSelection
    );
  };

  addClass = (className: string, id?: string) => {
    this.getDoms(id).forEach(($n) => {
      addClass($n, className);
    });
  };

  removeClass = (className: string, id?: string) => {
    this.getDoms(id).forEach(($n) => {
      removeClass($n, className);
    });
  };

  getIdByDom = ($node: HTMLElement): string =>
    //@ts-ignore
    getHighlightId($node, this.options.$root);

  getExtraIdByDom = ($node: HTMLElement): string[] =>
    //@ts-ignore
    getExtraHighlightId($node, this.options.$root);

  getDoms = (id?: string): HTMLElement[] =>
    id
      ? //@ts-ignore
        getHighlightById(this.options.$root, id, this.options.wrapTag)
      : //@ts-ignore
        getHighlightsByRoot(this.options.$root, this.options.wrapTag);

  dispose = () => {
    const $root = this.options.$root;

    removeEventListener(
      //@ts-ignore
      $root,
      this.event.PointerOver,
      this._handleHighlightHover
    );
    //@ts-ignore
    removeEventListener($root, this.event.PointerEnd, this._handleSelection);
    removeEventListener(
      //@ts-ignore
      $root,
      this.event.PointerTap,
      this._handleHighlightClick
    );
    this.removeAll();
  };

  setOption = (options?: HighlighterOptions) => {
    this.options = {
      ...this.options,
      ...options,
    };
    this.painter = new Painter(
      {
        //@ts-ignore
        $root: this.options.$root,
        //@ts-ignore
        wrapTag: this.options.wrapTag,
        //@ts-ignore
        className: this.options.style.className,
        //@ts-ignore
        exceptSelectors: this.options.exceptSelectors,
        contentWindow: this.options.contentWindow,
      },
      this.hooks
    );
  };

  fromRange = (
    range: Range,
    meta: { textAfter: string; textBefore: string; temporary?: boolean },
    highlightId?: string
  ): HighlightSource => {
    const start: DomNode = {
      $node: range.startContainer,
      offset: range.startOffset,
    };
    const end: DomNode = {
      $node: range.endContainer,
      offset: range.endOffset,
    };

    const text = range.toString();

    const hRange = new HighlightRange(start, end, text, highlightId ?? uuid());

    if (!hRange) {
      eventEmitter.emit(INTERNAL_ERROR_EVENT, {
        type: ERROR.RANGE_INVALID,
      });

      //@ts-ignore
      return null;
    }

    return this._highlightFromHRange(hRange, meta);
  };

  fromStore = (
    start: DomMeta,
    end: DomMeta,
    text: string,
    id: string,
    extra?: unknown
  ): HighlightSource => {
    const hs = new HighlightSource(start, end, text, id, extra);

    try {
      this._highlightFromHSource(hs);

      return hs;
    } catch (err: unknown) {
      eventEmitter.emit(INTERNAL_ERROR_EVENT, {
        type: ERROR.HIGHLIGHT_SOURCE_RECREATE,
        error: err,
        detail: hs,
      });

      //@ts-ignore
      return null;
    }
  };

  remove(id: string) {
    if (!id) {
      return;
    }

    const doseExist = this.painter.removeHighlight(id);

    this.cache.remove(id);

    // only emit REMOVE event when highlight exist
    if (doseExist) {
      this.emit(EventType.REMOVE, { ids: [id] }, this);
    }
  }

  removeAll() {
    this.painter.removeAllHighlight();

    const ids = this.cache.removeAll();

    this.emit(EventType.REMOVE, { ids }, this);
  }

  private readonly _getHooks = (): HookMap => ({
    Render: {
      UUID: new Hook('Render.UUID'),
      SelectedNodes: new Hook('Render.SelectedNodes'),
      WrapNode: new Hook('Render.WrapNode'),
    },
    Serialize: {
      Restore: new Hook('Serialize.Restore'),
      RecordInfo: new Hook('Serialize.RecordInfo'),
    },
    Remove: {
      UpdateNodes: new Hook('Remove.UpdateNodes'),
    },
  });

  private readonly _highlightFromHRange = (
    range: HighlightRange,
    meta?: { textAfter: string; textBefore: string; temporary?: boolean }
  ): HighlightSource => {
    const source: HighlightSource = range.serialize(
      //@ts-ignore
      this.options.$root,
      this.hooks
    );
    const $wraps = this.painter.highlightRange(range);

    if ($wraps.length === 0) {
      eventEmitter.emit(INTERNAL_ERROR_EVENT, {
        type: ERROR.DOM_SELECTION_EMPTY,
      });
      //@ts-ignore
      return null;
    }

    this.cache.save(source);
    if (!meta?.temporary) {
      this.emit(
        EventType.CREATE,
        { sources: [source], type: CreateFrom.INPUT, meta },
        this
      );
    }
    return source;
  };

  private _highlightFromHSource(
    sources: HighlightSource | HighlightSource[] = []
  ) {
    const renderedSources: HighlightSource[] =
      this.painter.highlightSource(sources);

    this.emit(
      EventType.CREATE,
      { sources: renderedSources, type: CreateFrom.STORE },
      this
    );
    this.cache.save(sources);
  }

  private readonly _handleSelection = () => {
    const range = HighlightRange.fromSelection(
      this.hooks.Render.UUID,
      this.options.contentWindow
    );

    if (range) {
      this._highlightFromHRange(range);
      HighlightRange.removeDomRange(this.options.contentWindow);
    }
  };

  private readonly _handleHighlightHover = (e: MouseEvent | TouchEvent) => {
    const $target = e.target as HTMLElement;

    if (!isHighlightWrapNode($target)) {
      this._hoverId &&
        this.emit(EventType.HOVER_OUT, { id: this._hoverId }, this, e);
      //@ts-ignore
      this._hoverId = null;

      return;
    }

    //@ts-ignore
    const id = getHighlightId($target, this.options.$root);

    // prevent trigger in the same highlight range
    if (this._hoverId === id) {
      return;
    }

    // hover another highlight range, need to trigger previous highlight hover out event
    if (this._hoverId) {
      this.emit(EventType.HOVER_OUT, { id: this._hoverId }, this, e);
    }

    this._hoverId = id;
    this.emit(EventType.HOVER, { id: this._hoverId }, this, e);
  };

  private readonly _handleError = (type: {
    type: ERROR;
    detail?: HighlightSource;
    error?: any;
  }) => {
    if (this.options.verbose) {
      // eslint-disable-next-line no-console
      console.warn(type);
    }
  };

  private readonly _handleHighlightClick = (e: MouseEvent | TouchEvent) => {
    const $target = e.target as HTMLElement;

    if (isHighlightWrapNode($target)) {
      //@ts-ignore
      const id = getHighlightId($target, this.options.$root);

      this.emit(EventType.CLICK, { id }, this, e);
    }
  };
}
