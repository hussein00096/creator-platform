'use client';

import { doorIcon, Icon } from '@/components/icons';
import { getDirectory } from '@/lib/copy-directory';
import { categoryLabel } from '@/lib/names';
import { deco } from '@/lib/people';
import type { CategoryNode, Locale } from '@/lib/types';

/** Horizontal rail of field tiles ("all" + one per parent category); each tile is a toggle button. */
export function DirectoryRail({
  locale,
  tree,
  counts,
  total,
  activeId,
  onPick,
}: {
  locale: Locale;
  tree: CategoryNode[];
  counts: Map<number, number>;
  total: number | null;
  activeId: number | null;
  onPick: (parent: CategoryNode | null) => void;
}) {
  const t = getDirectory(locale);
  if (!tree.length) return null;
  return (
    <div className="hsc drail" role="group" aria-label={t.railLabel}>
      <div>
        <button type="button" className="dtile" aria-pressed={activeId === null} onClick={() => onPick(null)}>
          <span className="dt-ico"><Icon name="grid" size={24} /></span>
          <strong className="dt-name">{t.all}</strong>
          {total !== null ? <span className="dt-n">{t.allCount(total)}</span> : null}
          <span className="dt-num" aria-hidden="true">{deco(0, locale)}</span>
        </button>
      </div>
      {tree.map((parent, index) => {
        const on = activeId === parent.id;
        return (
          <div key={parent.id}>
            <button type="button" className="dtile" aria-pressed={on} onClick={() => onPick(on ? null : parent)}>
              <span className="dt-ico"><Icon name={doorIcon[parent.slug] || 'spark'} size={24} /></span>
              <strong className="dt-name">{categoryLabel(locale, parent)}</strong>
              <span className="dt-n">{t.tileCount((parent.children || []).length, counts.get(parent.id) || 0)}</span>
              <span className="dt-num" aria-hidden="true">{deco(index + 1, locale)}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
