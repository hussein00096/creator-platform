import type { CategoryNode } from './types';

const LOOK_PARENTS = new Set(['models-fashion', 'influencers-content']);
const LOOK_SKIP = new Set(['influencer-management']);

export function specialtyNeedsLook(parent: CategoryNode, child: CategoryNode) {
  if (LOOK_SKIP.has(child.slug)) return false;
  return LOOK_PARENTS.has(parent.slug);
}

export function selectionNeedsLook(tree: CategoryNode[], ids: number[]) {
  const picked = new Set(ids);
  return tree.some((parent) => (parent.children || []).some((child) => picked.has(child.id) && specialtyNeedsLook(parent, child)));
}

export function adultDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isAdult(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return value <= adultDate();
}
