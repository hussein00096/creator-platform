'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useMemo, useState, useTransition, type FormEvent } from 'react';
import { DirCard, FeatureCard, ListRow, PromoCard, toRow, useSaved } from '@/components/directory-cards';
import { DirectoryHero } from '@/components/directory-hero';
import { DirectoryRail } from '@/components/directory-rail';
import { ArrowIcon, Icon, Star } from '@/components/icons';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { getDirectory } from '@/lib/copy-directory';
import { categoryLabel, placeLabel } from '@/lib/names';
import type { CategoryNode, Influencer, Locale, Place } from '@/lib/types';

export type Facets = {
  total: number;
  available: number;
  governorates: { id: number; count: number }[];
  platforms: { platform: string; count: number }[];
  categories: { id: number; count: number }[];
};

/** Filter state as read from the URL by the page. */
export type Filters = {
  search: string;
  categoryId: string;
  group: string;
  scope: string;
  gender: string;
  cities: string[];
  platforms: string[];
  available: boolean;
  sort: string;
};

type Patch = Partial<Filters>;
type View = 'grid' | 'list';

const PLATFORM_ORDER = ['instagram', 'tiktok', 'youtube', 'snapchat', 'facebook', 'x'];
const TOP_CITIES = 6;

/** Creators listing: hero + deck, field rail, sticky toolbar, filter cards, grid/list results with "load more". Filters live in the URL. */
export function TalentStage({
  locale,
  people,
  offline,
  total,
  limit,
  listQuery,
  tree,
  governorates,
  facets,
  deck,
  top,
  filters,
  view: initialView,
}: {
  locale: Locale;
  people: Influencer[];
  offline: boolean;
  total: number;
  limit: number;
  listQuery: string;
  tree: CategoryNode[];
  governorates: Place[];
  facets: Facets | null;
  deck: Influencer[];
  top: Influencer | null;
  filters: Filters;
  view: View;
}) {
  const copy = getCopy(locale);
  const t = getDirectory(locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [allCities, setAllCities] = useState(false);
  const [view, setView] = useState<View>(initialView);
  const [more, setMore] = useState<{ query: string; pages: Influencer[][] }>({ query: listQuery, pages: [] });
  const [loading, setLoading] = useState(false);
  const [moreError, setMoreError] = useState('');
  const { saved, toggle } = useSaved();
  const { search, categoryId, group, scope, gender, cities, platforms, available, sort } = filters;

  const openParent = tree.find((parent) => parent.slug === group)
    || tree.find((parent) => String(parent.id) === categoryId)
    || tree.find((parent) => (parent.children || []).some((child) => String(child.id) === categoryId))
    || null;
  const openChild = openParent?.children?.find((child) => String(child.id) === categoryId) || null;
  const parents = useMemo(() => new Map(tree.map((parent) => [parent.id, parent])), [tree]);
  const categoryCounts = useMemo(() => new Map((facets?.categories || []).map((item) => [item.id, item.count])), [facets]);
  const cityCounts = useMemo(() => new Map((facets?.governorates || []).map((item) => [item.id, item.count])), [facets]);

  // Appended pages belong to one filter set; a new query starts over.
  const extra = more.query === listQuery ? more.pages : [];
  const rows = useMemo(() => {
    const seen = new Set<number>();
    const list: Influencer[] = [];
    [people, ...extra].flat().forEach((person) => {
      if (seen.has(person.id)) return;
      seen.add(person.id);
      list.push(person);
    });
    return list.map((person) => toRow(locale, person));
  }, [people, extra, locale]);
  const featured = view === 'grid' && top && total > 3 ? toRow(locale, top) : null;
  const gridRows = featured ? rows.filter((row) => row.person.id !== featured.person.id) : rows;
  const shown = rows.length + (featured && !rows.some((row) => row.person.id === featured.person.id) ? 1 : 0);
  const loadedPages = 1 + extra.length;
  const hasMore = !offline && loadedPages * limit < total;

  function href(patch: Patch, nextView: View = view) {
    const f = { ...filters, ...patch };
    const next = new URLSearchParams();
    if (f.search) next.set('search', f.search);
    if (f.categoryId) next.set('categoryId', f.categoryId);
    if (f.scope) next.set('locationScope', f.scope);
    if (f.group) next.set('group', f.group);
    if (f.gender) next.set('gender', f.gender);
    if (f.cities.length) next.set('governorateIds', f.cities.join(','));
    if (f.platforms.length) next.set('platform', f.platforms.join(','));
    if (f.available) next.set('available', '1');
    if (f.sort) next.set('sort', f.sort);
    if (nextView === 'list') next.set('view', 'list');
    if (limit !== 18) next.set('limit', String(limit));
    const text = next.toString();
    return text ? `/${locale}/directory?${text}` : `/${locale}/directory`;
  }

  function go(patch: Patch) {
    startTransition(() => router.push(href(patch), { scroll: false }));
  }

  function pickField(parent: CategoryNode | null) {
    go(parent ? { group: parent.slug, categoryId: String(parent.id) } : { group: '', categoryId: '' });
  }

  function pickScope(value: string) {
    go({ scope: value, cities: value === 'outside_iraq' ? [] : cities });
  }

  function toggleCity(id: string) {
    const on = cities.includes(id);
    const next = on ? cities.filter((item) => item !== id) : [...cities, id];
    go({ cities: next, scope: on ? scope : 'inside_iraq' });
  }

  function togglePlatform(value: string) {
    go({ platforms: platforms.includes(value) ? platforms.filter((item) => item !== value) : [...platforms, value] });
  }

  function changeView(next: View) {
    setView(next);
    // View is presentation only: update the URL without a server round trip.
    window.history.replaceState(null, '', href({}, next));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get('search') || '').trim();
    go({ search: value });
  }

  const cleared: Patch = { search: '', categoryId: '', group: '', scope: '', gender: '', cities: [], platforms: [], available: false };
  const clearAll = () => go(cleared);

  async function loadMore() {
    setLoading(true);
    setMoreError('');
    try {
      const next = await api<Influencer[]>(`/api/v1/influencers?${listQuery}&page=${loadedPages + 1}`);
      setMore({ query: listQuery, pages: [...extra, next.data] });
    } catch {
      setMoreError(t.moreError);
    } finally {
      setLoading(false);
    }
  }

  const scopes = [
    { value: '', label: copy.scopeAll },
    { value: 'inside_iraq', label: copy.inside },
    { value: 'outside_iraq', label: copy.outside },
  ];
  const genders = [
    { value: '', label: copy.genderAll },
    { value: 'female', label: copy.genderMap.female },
    { value: 'male', label: copy.genderMap.male },
  ];
  const sorts = [
    { value: '', label: t.sorts.newest },
    { value: 'popular', label: t.sorts.popular },
    { value: 'name', label: t.sorts.name },
  ];

  const byCount = [...governorates].sort((a, b) => (cityCounts.get(b.id) || 0) - (cityCounts.get(a.id) || 0) || a.id - b.id);
  const topCities = byCount.filter((item) => cityCounts.get(item.id)).slice(0, TOP_CITIES);
  const restCities = governorates.filter((item) => !topCities.includes(item));
  // A city chosen from "all governorates" stays visible when the list is folded.
  const visibleRest = allCities ? restCities : restCities.filter((item) => cities.includes(String(item.id)));
  const platformCounts = new Map((facets?.platforms || []).map((item) => [item.platform, item.count]));
  const platformList = PLATFORM_ORDER.filter((item) => platformCounts.has(item) || platforms.includes(item));

  const active: { key: string; label: string; patch: Patch }[] = [];
  if (search) active.push({ key: 'search', label: t.searchFor(search), patch: { search: '' } });
  if (openParent) active.push({ key: 'group', label: categoryLabel(locale, openParent), patch: { group: '', categoryId: '' } });
  if (openParent && openChild) active.push({ key: 'child', label: categoryLabel(locale, openChild), patch: { categoryId: String(openParent.id) } });
  if (scope && !cities.length) active.push({ key: 'scope', label: scope === 'inside_iraq' ? copy.inside : copy.outside, patch: { scope: '' } });
  cities.forEach((id) => {
    const place = governorates.find((item) => String(item.id) === id);
    if (place) active.push({ key: `city-${id}`, label: placeLabel(locale, place), patch: { cities: cities.filter((item) => item !== id) } });
  });
  if (gender === 'male' || gender === 'female') active.push({ key: 'gender', label: copy.genderMap[gender], patch: { gender: '' } });
  platforms.forEach((item) => active.push({ key: `pf-${item}`, label: copy.platforms[item as keyof typeof copy.platforms] || item, patch: { platforms: platforms.filter((p) => p !== item) } }));
  if (available) active.push({ key: 'available', label: t.liveNow, patch: { available: false } });
  const filtered = active.length > 0 || Boolean(group || categoryId);

  // The promo card sits after the fourth card (or at the end of a shorter grid).
  const promoAt = Math.min(featured ? 3 : 4, gridRows.length);

  return (
    <div className="dir">
      <DirectoryHero locale={locale} total={facets?.total ?? null} fields={tree.length} available={facets?.available ?? null} deck={deck} />

      <DirectoryRail locale={locale} tree={tree} counts={categoryCounts} total={facets?.total ?? null} activeId={openParent?.id ?? null} onPick={pickField} />
      {openParent && (openParent.children || []).length ? (
        <div className="wrap dkids" role="group" aria-label={t.kidsLabel}>
          {(openParent.children || []).map((child) => {
            const on = String(child.id) === categoryId;
            return (
              <button key={child.id} type="button" className={`chip chip-sm${on ? ' on' : ''}`} aria-pressed={on} onClick={() => go({ group: openParent.slug, categoryId: on ? String(openParent.id) : String(child.id) })}>
                {categoryLabel(locale, child)}
                {categoryCounts.get(child.id) ? <small>{categoryCounts.get(child.id)}</small> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="dbar">
        <div className="wrap dbar-in">
          <form className="dsearch" action={`/${locale}/directory`} method="get" role="search" onSubmit={submitSearch}>
            <Icon name="search" size={20} />
            <input key={search} name="search" defaultValue={search} placeholder={t.search} dir="auto" aria-label={copy.search} />
            <button type="submit" className="btn btn-acc btn-sm">{t.searchBtn}</button>
          </form>
          <div className="seg-w dscope" role="group" aria-label={t.scope}>
            {scopes.map((item) => (
              <button key={item.label} type="button" className={`seg${scope === item.value ? ' on' : ''}`} aria-pressed={scope === item.value} onClick={() => pickScope(item.value)}>
                {item.label}
              </button>
            ))}
          </div>
          <label className="dsort">
            <span className="sr-only">{t.sort}</span>
            <select className="inp" value={sort} onChange={(event) => go({ sort: event.target.value })}>
              {sorts.map((item) => <option key={item.value || 'newest'} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <div className="seg-w dview" role="group" aria-label={t.view}>
            <button type="button" className={`seg${view === 'grid' ? ' on' : ''}`} aria-pressed={view === 'grid'} aria-label={t.grid} title={t.grid} onClick={() => changeView('grid')}>
              <Icon name="grid" size={18} />
            </button>
            <button type="button" className={`seg${view === 'list' ? ' on' : ''}`} aria-pressed={view === 'list'} aria-label={t.list} title={t.list} onClick={() => changeView('list')}>
              <Icon name="menu" size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="wrap dbody">
        <aside className="side dside" data-open={open || undefined} data-lenis-prevent="">
          <button type="button" className="dtog card" aria-expanded={open} aria-controls="dir-filters" onClick={() => setOpen((current) => !current)}>
            <Icon name="sliders" size={20} />
            <span>{t.filters}</span>
            {active.length ? <em>{active.length}</em> : null}
            <Icon name={open ? 'minus' : 'plus'} size={18} />
          </button>
          <div className="dside-body" id="dir-filters">
            <section className="dcard-f">
              <div className="df-head">
                <h2 className="df-t">{t.filters}</h2>
                {filtered ? <button type="button" className="lnk df-clear" onClick={clearAll}>{t.clearAll}</button> : null}
              </div>
              <button type="button" role="switch" aria-checked={available} className="dsw" onClick={() => go({ available: !available })}>
                <span className="dsw-txt"><strong>{t.liveNow}</strong><small>{t.liveHint}</small></span>
                <span className="dsw-track" aria-hidden="true"><span /></span>
              </button>
              <div className="df-sub">
                <span className="df-l" id="df-gender">{t.gender}</span>
                <div className="seg-w seg-fill" role="group" aria-labelledby="df-gender">
                  {genders.map((item) => (
                    <button key={item.value || 'all'} type="button" className={`seg${gender === item.value ? ' on' : ''}`} aria-pressed={gender === item.value} onClick={() => go({ gender: item.value })}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {scope !== 'outside_iraq' && governorates.length ? (
              <section className="dcard-f">
                <h2 className="df-t">{t.city}</h2>
                <ul className="dchecks">
                  {[...topCities, ...visibleRest].map((item) => {
                    const id = String(item.id);
                    const on = cities.includes(id);
                    return (
                      <li key={item.id}>
                        <button type="button" role="checkbox" aria-checked={on} className="dck" onClick={() => toggleCity(id)}>
                          <span className="dck-box" aria-hidden="true"><Icon name="check" size={14} /></span>
                          <span className="dck-l">{placeLabel(locale, item)}</span>
                          <span className="dck-n">{cityCounts.get(item.id) || 0}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {restCities.length ? (
                  <button type="button" className="lnk dmore-c" aria-expanded={allCities} onClick={() => setAllCities((current) => !current)}>
                    {allCities ? t.lessCities : t.moreCities}
                    <Icon name={allCities ? 'minus' : 'plus'} size={16} />
                  </button>
                ) : null}
              </section>
            ) : null}

            <section className="dcard-f">
              {platformList.length ? (
                <>
                  <h2 className="df-t">{t.platform}</h2>
                  <div className="dpfs">
                    {platformList.map((item) => {
                      const on = platforms.includes(item);
                      return (
                        <button key={item} type="button" className={`chip chip-sm dpf${on ? ' on' : ''}`} aria-pressed={on} data-p={item} onClick={() => togglePlatform(item)}>
                          <i aria-hidden="true" />
                          {copy.platforms[item as keyof typeof copy.platforms] || item}
                          <small>{platformCounts.get(item) || 0}</small>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
              {/* TODO: no price data in the API yet — budget stays disabled until creators publish prices. */}
              <fieldset className="dbudget" disabled>
                <legend className="df-t">{t.budget} <span className="dsoon">[{t.soon}]</span></legend>
                <div className="dbudget-in">
                  <input className="inp" inputMode="numeric" placeholder={t.from} aria-label={`${t.budget} ${t.from}`} />
                  <input className="inp" inputMode="numeric" placeholder={t.to} aria-label={`${t.budget} ${t.to}`} />
                </div>
              </fieldset>
            </section>
          </div>
        </aside>

        <section className="dres" aria-live="polite" aria-busy={pending || undefined} data-busy={pending || undefined}>
          <div className="dres-head">
            <div>
              <p className="dres-n disp">{offline ? '—' : total}<span> {t.results}</span></p>
              <p className="dres-cat">{openChild ? categoryLabel(locale, openChild) : openParent ? categoryLabel(locale, openParent) : t.allFields}</p>
            </div>
            {active.length ? (
              <ul className="dactive">
                {active.map((item) => (
                  <li key={item.key}>
                    <button type="button" className="chip chip-sm on dx" aria-label={t.removeLabel(item.label)} onClick={() => go(item.patch)}>
                      <span dir="auto">{item.label}</span>
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {offline ? (
            <div className="dempty">
              <Icon name="info" size={32} />
              <strong className="disp">{t.offlineTitle}</strong>
              <p>{copy.offline}</p>
            </div>
          ) : rows.length === 0 && !featured ? (
            <div className="dempty">
              <Star size={44} className="dempty-star" />
              <strong className="disp">{t.emptyTitle}</strong>
              <p>{t.emptyText}</p>
              <div className="dempty-act">
                {filtered ? <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>{t.emptyClear}</button> : null}
                <Link href={`/${locale}/request`} className="btn btn-acc btn-sm">{t.emptyAsk}<ArrowIcon size={18} /></Link>
              </div>
            </div>
          ) : view === 'list' ? (
            <ul className="dlist">
              {rows.map((row, index) => (
                <li key={row.person.id} className="pop" style={{ animationDelay: `${0.06 * (index % limit % 12)}s` }}>
                  <ListRow locale={locale} row={row} parents={parents} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="dgrid">
              {featured ? (
                <div className="pop dg-wide">
                  <FeatureCard locale={locale} row={featured} />
                </div>
              ) : null}
              {gridRows.map((row, index) => (
                <Fragment key={row.person.id}>
                  <div className="pop" style={{ animationDelay: `${0.06 * ((index + (featured ? 1 : 0)) % limit % 12)}s` }}>
                    <DirCard locale={locale} row={row} saved={saved.includes(row.person.id)} onSave={toggle} />
                  </div>
                  {index + 1 === promoAt ? <div className="pop" style={{ animationDelay: '.3s' }}><PromoCard locale={locale} /></div> : null}
                </Fragment>
              ))}
              {promoAt === 0 ? <div className="pop"><PromoCard locale={locale} /></div> : null}
            </div>
          )}

          {!offline && total > 0 ? (
            <div className="dmore">
              <div className="dmore-bar" aria-hidden="true"><span style={{ transform: `scaleX(${Math.min(1, shown / Math.max(1, total))})` }} /></div>
              <p className="dmore-n">{t.shown(Math.min(shown, total), total)}</p>
              {hasMore ? (
                <button type="button" className="btn btn-ghost mag dmore-btn" onClick={loadMore} disabled={loading} aria-busy={loading || undefined}>
                  <span>{t.more}</span>
                  {loading ? <span className="dmore-dots" aria-hidden="true"><i /><i /><i /></span> : <Icon name="plus" size={18} />}
                </button>
              ) : null}
              {moreError ? <p className="err" role="alert">{moreError}</p> : null}
            </div>
          ) : null}
        </section>
      </div>

      <section className="wrap dcta-w">
        <div className="paper zoom dcta">
          <div>
            <h2 className="h2 dcta-t">{t.ctaTitle}</h2>
            <p>{t.ctaText}</p>
          </div>
          <Link href={`/${locale}/request`} className="btn btn-dark mag"><span>{t.ctaBtn}</span><ArrowIcon /></Link>
        </div>
      </section>
    </div>
  );
}
