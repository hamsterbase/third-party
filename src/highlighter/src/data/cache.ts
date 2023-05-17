import EventEmitter from '@hamsterbase-third-party-internal/highlighter/src/util/event.emitter.js';
import type HighlightSource from '@hamsterbase-third-party-internal/highlighter/src/model/source/index.js';
import { ERROR } from '@hamsterbase-third-party-internal/highlighter/src/types/index.js';

class Cache extends EventEmitter {
  private _data: Map<string, HighlightSource> = new Map();

  get data() {
    return this.getAll();
  }

  set data(map) {
    throw ERROR.CACHE_SET_ERROR;
  }

  save(source: HighlightSource | HighlightSource[]): void {
    if (!Array.isArray(source)) {
      this._data.set(source.id, source);

      return;
    }

    source.forEach((s) => this._data.set(s.id, s));
  }

  get(id: string): HighlightSource | undefined {
    return this._data.get(id);
  }

  remove(id: string): void {
    this._data.delete(id);
  }

  getAll(): HighlightSource[] {
    const list: HighlightSource[] = [];

    for (const pair of this._data) {
      list.push(pair[1]);
    }

    return list;
  }

  removeAll(): string[] {
    const ids: string[] = [];

    for (const pair of this._data) {
      ids.push(pair[0]);
    }

    this._data = new Map();

    return ids;
  }
}

export default Cache;
