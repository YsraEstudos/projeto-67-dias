import { NAV_ITEMS } from './constants';

export type NavPath = (typeof NAV_ITEMS)[number]['to'];

export const MAX_MOBILE_PINNED_NAV_ITEMS = 6;

export const DEFAULT_MOBILE_PINNED_NAV: NavPath[] = ['/'];

const NAV_PATH_SET = new Set<string>(NAV_ITEMS.map((item) => item.to));

export const isNavPath = (value: string): value is NavPath => NAV_PATH_SET.has(value);

export const sanitizeMobilePinnedNav = (paths?: string[]): NavPath[] => {
  const source = Array.isArray(paths) ? paths : DEFAULT_MOBILE_PINNED_NAV;
  const normalized: NavPath[] = [];

  for (const path of source) {
    if (!isNavPath(path)) continue;
    if (normalized.includes(path)) continue;
    normalized.push(path);
    if (normalized.length >= MAX_MOBILE_PINNED_NAV_ITEMS) break;
  }

  return normalized.length > 0 ? normalized : DEFAULT_MOBILE_PINNED_NAV;
};

export const insertMobilePinnedNavAt = (paths: string[], path: string, targetIndex: number): NavPath[] => {
  void targetIndex;
  return isNavPath(path) ? DEFAULT_MOBILE_PINNED_NAV : sanitizeMobilePinnedNav(paths);
};

export const moveMobilePinnedNav = (paths: string[], path: string, targetIndex: number): NavPath[] => {
  void targetIndex;
  return isNavPath(path) ? DEFAULT_MOBILE_PINNED_NAV : sanitizeMobilePinnedNav(paths);
};

export const removeMobilePinnedNav = (paths: string[], path: string): NavPath[] => {
  return isNavPath(path) ? DEFAULT_MOBILE_PINNED_NAV : sanitizeMobilePinnedNav(paths);
};

export const resolveActiveNavPath = (pathname: string): NavPath => {
  void pathname;
  return '/';
};
