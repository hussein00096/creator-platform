'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Icon, Star, type IconName } from '@/components/icons';
import { Reveal, Split } from '@/components/motion';
import { Portrait } from '@/components/ui';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/copy-auth';
import { getCopy } from '@/lib/copy';
import { toCard, tones, type CardPerson } from '@/lib/people';
import type { Influencer, Locale } from '@/lib/types';

export type AuthMode = 'login' | 'user' | 'client' | 'influencer' | 'model';

let crowd: Promise<Influencer[]> | null = null;

/** Approved creators for the visual side; fetched once per visit, empty on failure. */
function loadCrowd() {
  if (!crowd) {
    crowd = api<Influencer[]>('/api/v1/influencers?limit=12')
      .then((result) => result.data || [])
      .catch(() => {
        crowd = null;
        return [];
      });
  }
  return crowd;
}

/**
 * Split-screen auth surface: form side (logo, headline, login/signup tabs,
 * role cards on signup) and an accent panel with scrolling creator columns.
 */
export function AuthShell({
  locale,
  mode,
  caption,
  title,
  deck,
  plain = false,
  children,
}: {
  locale: Locale;
  mode: AuthMode;
  caption?: ReactNode;
  /** Overrides the headline (Split markup) and deck. */
  title?: string;
  deck?: string;
  /** Hides the login/sign-up tabs, role cards and the switch line (e.g. signed-in upgrade). */
  plain?: boolean;
  children: ReactNode;
}) {
  const copy = getCopy(locale);
  const t = getAuth(locale);
  const login = mode === 'login';
  const roles: { id: Exclude<AuthMode, 'login' | 'model'>; href: string; icon: IconName }[] = [
    { id: 'user', href: `/${locale}/join/user`, icon: 'user' },
    { id: 'client', href: `/${locale}/join/client`, icon: 'briefcase' },
    { id: 'influencer', href: `/${locale}/join/influencer`, icon: 'megaphone' },
  ];

  return (
    <div className="au">
      <section className="au-side">
        <header className="au-top">
          <Link href={`/${locale}`} className="logo" aria-label={copy.wordmark}>
            <Star size={26} />
            <span>{copy.wordmark}</span>
          </Link>
          <Link href={`/${locale}`} className="btn btn-ghost btn-sm">
            {t.leave}<Icon name="close" size={16} />
          </Link>
        </header>

        <div className="au-main">
          <Split
            as="h1"
            className="au-h1"
            text={(title ?? (login ? t.loginTitle : t.signupTitle)).replace('%w', copy.wordmark)}
            delay={0.05}
          />
          <Reveal as="p" className="au-deck" kind="fd" delay={0.35}>{deck ?? (login ? t.loginDeck : t.signupDeck)}</Reveal>

          {plain ? null : (
            <Reveal kind="fd" delay={0.45}>
              <nav className="seg-w seg-fill au-tabs" aria-label={t.tabs}>
                <Link href={`/${locale}/login`} className={`seg${login ? ' on' : ''}`} aria-current={login ? 'page' : undefined}>{t.login}</Link>
                <Link href={`/${locale}/join/user`} className={`seg${login ? '' : ' on'}`} aria-current={login ? undefined : 'page'}>{t.signup}</Link>
              </nav>
            </Reveal>
          )}

          {login || plain ? null : (
            <Reveal kind="fd" delay={0.5}>
              <nav aria-label={t.roleLegend}>
                <p className="lbl">{t.roleLegend}</p>
                <div className="au-roles">
                  {roles.map((role) => {
                    const on = role.id === mode || (role.id === 'influencer' && mode === 'model');
                    return (
                      <Link key={role.id} href={role.href} className="opt au-role" data-on={on} aria-current={on ? 'page' : undefined}>
                        <span className="au-role-i"><Icon name={role.icon} size={20} /></span>
                        <b>{t.roles[role.id].title}</b>
                        <small>{t.roles[role.id].deck}</small>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </Reveal>
          )}

          <Reveal kind="fd" delay={0.55}>{children}</Reveal>

          {plain ? null : (
            <p className="au-alt">
              {login ? t.noAccount : t.haveAccount}{' '}
              <Link className="lnk" href={login ? `/${locale}/join/user` : `/${locale}/login`}>{login ? t.signup : t.login}</Link>
            </p>
          )}
        </div>
      </section>

      <aside className="au-vis hide-m">
        <div className="panel-acc au-pan">
          <AuthWall locale={locale} />
          <div className="au-cap">
            {caption ?? (
              <>
                <Star size={28} className="spin" />
                <p className="au-cap-t disp">{t.captionTitle}</p>
                <p className="au-cap-n">{t.captionNote}</p>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

type Tile = { key: string; tone: string; person: CardPerson | null };

/** Three tilted columns of creator cards scrolling vertically in alternating directions. */
function AuthWall({ locale }: { locale: Locale }) {
  const [people, setPeople] = useState<CardPerson[]>([]);

  useEffect(() => {
    let live = true;
    loadCrowd().then((list) => {
      if (live) setPeople(list.map((item) => toCard(locale, item)));
    });
    return () => {
      live = false;
    };
  }, [locale]);

  const tiles: Tile[] = people.length
    ? Array.from({ length: Math.max(12, people.length) }, (_, index) => {
      const person = people[index % people.length];
      return { key: `${person.id}-${index}`, tone: person.tone, person };
    })
    : tones.map((tone, index) => ({ key: `t${index}`, tone, person: null }));
  const columns = [0, 1, 2].map((col) => tiles.filter((_, index) => index % 3 === col));

  return (
    <div className="au-wall" aria-hidden="true">
      {columns.map((items, col) => (
        <div key={col} className={`au-col${col === 1 ? ' au-col-rev' : ''}`}>
          <div className="au-track">
            {[0, 1].map((copyIndex) => (
              <div key={copyIndex} className="au-half">
                {items.map((tile) => (
                  <div key={tile.key} className="au-card">
                    <Portrait shot={tile.person?.shot || null} tone={tile.tone} className="au-ph" eager={copyIndex === 0} />
                    {tile.person ? (
                      <span className="au-cn">
                        <b dir="auto">{tile.person.name}</b>
                        {tile.person.category ? <small dir="auto">{tile.person.category}</small> : null}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A numbered group of fields on the form side. */
export function AuthSection({ index, title, deck, children }: { index: string; title: string; deck?: string; children: ReactNode }) {
  return (
    <section className="au-sec">
      <header className="au-sec-h">
        <span className="au-sec-n disp" aria-hidden="true">{index}</span>
        <div className="min-w-0">
          <h2 className="au-sec-t">{title}</h2>
          {deck ? <p className="au-sec-d">{deck}</p> : null}
        </div>
      </header>
      <div className="au-sec-b">{children}</div>
    </section>
  );
}
