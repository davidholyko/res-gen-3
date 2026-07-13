import type { ContentAll } from '@/types/content-all';
import type { LayoutItem } from '@/types/layouts';

import { prepopulateUtil } from './prepopulate-util';

const RES_GEN_KEY = 'res-gen-data';

export type LocalStorageData = {
  layouts: LayoutItem[];
  items: ContentAll[];
  isEditorVisible: boolean;
};

export type JsonType = {
  [key: string]: unknown;
};

export class LocalStorageUtil {
  constructor() {
    if (typeof window !== 'undefined') {
      // Client-side-only code
      window.resGenData = this.data;
    }
  }

  get data(): LocalStorageData {
    return JSON.parse(window.localStorage.getItem(RES_GEN_KEY)!) || {};
  }

  set data(value: JsonType) {
    window.localStorage.setItem(RES_GEN_KEY, JSON.stringify(value));
  }

  get layouts() {
    return this.isEmpty() ? this.data.layouts : prepopulateUtil.layouts;
  }

  get items() {
    return this.isEmpty() ? this.data.items : prepopulateUtil.items;
  }

  get isEditorVisible() {
    return this.data.isEditorVisible;
  }

  isEmpty() {
    if (!this.data.items?.length) return false;
    if (!this.data.layouts?.length) return false;
    return true;
  }
}

declare global {
  interface Window {
    resGenData: LocalStorageData;
  }
}

export const localStorageUtil = new LocalStorageUtil();

export default localStorageUtil;
