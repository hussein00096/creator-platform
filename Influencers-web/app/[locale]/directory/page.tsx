import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RefCreators } from '@/components/ref/creators';
import type { Facets, Filters } from '@/components/talent-stage';
import { api } from '@/lib/api';
import { getCopy } from '@/lib/copy';
import { isLocale, type CategoryNode, type Influencer, type Locale, type Place } from '@/lib/types';

const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook', 'snapchat', 'x'];
const SORTS = ['newest', 'popular', 'name'];

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

/** Comma list of positive ids, deduplicated. */
function idList(...values: string[]) {
  return [...new Set(values.join(',').split(',').filter((item) => /^\d+$/.test(item) && item !== '0'))];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getCopy(locale).directory };
}

export default async function DirectoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const query = await searchParams;
  const scope = one(query.locationScope);
  const gender = one(query.gender);
  const sort = one(query.sort);
  const filters: Filters = {
    search: one(query.search).trim(),
    categoryId: /^\d+$/.test(one(query.categoryId)) ? one(query.categoryId) : '',
    group: one(query.group),
    scope: scope === 'inside_iraq' || scope === 'outside_iraq' ? scope : '',
    gender: gender === 'male' || gender === 'female' ? gender : '',
    // The old single `governorateId` link still works; it joins the multi-select list.
    cities: scope === 'outside_iraq' ? [] : idList(one(query.governorateIds), one(query.governorateId)),
    platforms: one(query.platform).split(',').filter((item, index, list) => PLATFORMS.includes(item) && list.indexOf(item) === index),
    available: one(query.available) === '1' || one(query.available) === 'true',
    sort: SORTS.includes(sort) ? sort : '',
  };
  const view = one(query.view) === 'list' ? 'list' : 'grid';
  const limitRaw = Number.parseInt(one(query.limit), 10);
  const limit = Number.isInteger(limitRaw) && limitRaw >= 1 && limitRaw <= 60 ? limitRaw : 18;

  const apiQuery = new URLSearchParams();
  if (filters.search) apiQuery.set('search', filters.search);
  if (filters.categoryId) apiQuery.set('categoryId', filters.categoryId);
  if (filters.scope) apiQuery.set('locationScope', filters.scope);
  if (filters.gender) apiQuery.set('gender', filters.gender);
  if (filters.cities.length) apiQuery.set('governorateIds', filters.cities.join(','));
  if (filters.platforms.length) apiQuery.set('platform', filters.platforms.join(','));
  if (filters.available) apiQuery.set('available', '1');
  const filterQuery = apiQuery.toString();
  if (filters.sort) apiQuery.set('sort', filters.sort);
  apiQuery.set('limit', String(limit));
  const pick = new URLSearchParams(filterQuery);
  pick.set('sort', 'popular');
  pick.set('limit', '1');

  // No "featured" flag exists in the API: the hero deck shows the 3 most requested creators overall,
  // and the wide card in the grid is the most requested creator among the current matches.
  const [list, tree, governorates, facets, deck, top] = await Promise.all([
    api<Influencer[]>(`/api/v1/influencers?${apiQuery}`).catch(() => null),
    api<CategoryNode[]>('/api/v1/categories').then((result) => result.data).catch(() => [] as CategoryNode[]),
    api<Place[]>('/api/v1/governorates').then((result) => result.data).catch(() => [] as Place[]),
    api<Facets>('/api/v1/influencers/facets').then((result) => result.data).catch(() => null),
    api<Influencer[]>('/api/v1/influencers?sort=popular&limit=3').then((result) => result.data).catch(() => [] as Influencer[]),
    api<Influencer[]>(`/api/v1/influencers?${pick}`).then((result) => result.data[0] || null).catch(() => null),
  ]);

  return (
    <RefCreators
      locale={locale}
      people={list?.data ?? []}
      offline={!list}
      total={list?.meta?.total ?? 0}
      limit={limit}
      listQuery={apiQuery.toString()}
      tree={tree}
      governorates={governorates}
      facets={facets}
      deck={deck}
      top={top}
      filters={filters}
      view={view}
    />
  );
}
