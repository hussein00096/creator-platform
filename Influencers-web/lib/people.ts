import { getCopy } from './copy';
import { categoryLabel, placeLabel } from './names';
import type { Influencer, Locale } from './types';

/** Creator placeholder tones, used behind portraits until a real photo exists. */
export const tones = ['#3B2F7A', '#1F5A4E', '#7A2E3B', '#2B4C7E', '#6B4A1F', '#5E2B66', '#24525E', '#7A4A2E', '#4A2F5E', '#2F5A3A', '#6A2F4A', '#2A3F66'];

export function toneFor(id: number) {
  return tones[Math.abs(id) % tones.length];
}

/** Everything a creator card needs, flattened from the API shape. */
export type CardPerson = {
  id: number;
  name: string;
  initial: string;
  shot: string | null;
  tone: string;
  category: string;
  categoryIds: number[];
  parentIds: number[];
  place: string;
  platform: string;
  available: boolean;
  availability: string;
};

export function toCard(locale: Locale, person: Influencer): CardPerson {
  const copy = getCopy(locale);
  const profile = person.profile;
  const first = profile?.categories?.[0];
  const platform = profile?.socialAccounts?.[0]?.platform || '';
  const place = profile?.locationScope === 'inside_iraq' ? placeLabel(locale, profile?.governorate) : placeLabel(locale, profile?.country);
  return {
    id: person.id,
    name: person.name,
    initial: person.name.trim().charAt(0) || '·',
    shot: profile?.avatar || profile?.portfolio?.[0]?.filePath || null,
    tone: toneFor(person.id),
    category: first ? categoryLabel(locale, first) : '',
    categoryIds: (profile?.categories || []).map((item) => item.id),
    parentIds: (profile?.categories || []).map((item) => item.parentId).filter((item): item is number => typeof item === 'number'),
    place,
    platform: platform ? copy.platforms[platform as keyof typeof copy.platforms] || platform : '',
    available: (profile?.availability || 'active') === 'active',
    availability: profile?.availability || 'active',
  };
}

const eastern = '٠١٢٣٤٥٦٧٨٩';

/** Decorative numbers (ranks, step numbers): Eastern Arabic digits in Arabic, padded to two. */
export function deco(value: number, locale: Locale) {
  const text = String(value).padStart(2, '0');
  return locale === 'ar' ? text.replace(/\d/g, (digit) => eastern[Number(digit)]) : text;
}
