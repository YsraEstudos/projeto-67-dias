import { NAV_ITEMS } from './constants';

export type NavPath = (typeof NAV_ITEMS)[number]['to'];

export const MAX_MOBILE_PINNED_NAV_ITEMS = 6;

export const DEFAULT_MOBILE_PINNED_NAV: NavPath[] = [
  '/',
  '/plano-diario',
  '/conteudo',
  '/anki',
  '/simulados-redacoes',
  '/configuracoes',
];

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

  return normalized;
};

export const insertMobilePinnedNavAt = (paths: string[], path: string, targetIndex: number): NavPath[] => {
  if (!isNavPath(path)) return sanitizeMobilePinnedNav(paths);

  const current = sanitizeMobilePinnedNav(paths);
  const withoutPath = current.filter((item) => item !== path);
  const alreadyPinned = current.includes(path);

  if (!alreadyPinned && withoutPath.length >= MAX_MOBILE_PINNED_NAV_ITEMS) {
    return withoutPath;
  }

  const insertIndex = Math.max(0, Math.min(targetIndex, withoutPath.length));
  const next = [...withoutPath];
  next.splice(insertIndex, 0, path);
  return sanitizeMobilePinnedNav(next);
};

export const moveMobilePinnedNav = (paths: string[], path: string, targetIndex: number): NavPath[] => {
  const current = sanitizeMobilePinnedNav(paths);
  if (!isNavPath(path) || !current.includes(path)) return current;

  const next = current.filter((item) => item !== path);
  const insertIndex = Math.max(0, Math.min(targetIndex, next.length));
  next.splice(insertIndex, 0, path);
  return sanitizeMobilePinnedNav(next);
};

export const removeMobilePinnedNav = (paths: string[], path: string): NavPath[] => {
  return sanitizeMobilePinnedNav(paths.filter((item) => item !== path));
};

export const resolveActiveNavPath = (pathname: string): NavPath => {
  const longestMatch = [...NAV_ITEMS]
    .sort((left, right) => right.to.length - left.to.length)
    .find((item) => item.to === '/'
      ? pathname === '/'
      : pathname === item.to || pathname.startsWith(`${item.to}/`));

  return longestMatch?.to ?? '/';
};
