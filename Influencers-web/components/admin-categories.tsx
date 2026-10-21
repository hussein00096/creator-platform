'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { getAdmin } from '@/lib/copy-admin';
import { getCopy } from '@/lib/copy';
import { categoryLabel } from '@/lib/names';
import type { CategoryNode } from '@/lib/types';
import { AdminHead, AdminWait, errText, useAdmin } from './admin-shell';
import { Icon } from './icons';

type Msg = { at: string; text: string; ok: boolean } | null;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Category tree editor: fields → specialties; add, rename (Arabic name) and delete. */
export function AdminCategories() {
  const { locale, token } = useAdmin();
  const copy = getCopy(locale);
  const t = getAdmin(locale);
  const [tree, setTree] = useState<CategoryNode[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const [msg, setMsg] = useState<Msg>(null);

  const load = useCallback(() => {
    api<CategoryNode[]>('/api/v1/admin/categories', { token })
      .then((result) => setTree(result.data))
      .catch((err) => setError(errText(err, copy.offline)));
  }, [token, copy.offline]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(at: string, ok: string, call: () => Promise<unknown>) {
    setMsg(null);
    try {
      await call();
      setMsg({ at, text: ok, ok: true });
      load();
      return true;
    } catch (err) {
      setMsg({ at, text: errText(err, copy.offline), ok: false });
      return false;
    }
  }

  const add = (parentId: number | null) => (body: { nameAr: string; slug: string }) =>
    run(parentId ? `new-${parentId}` : 'new', t.added, () => api('/api/v1/admin/categories', { method: 'POST', token, body: { ...body, parentId } }));
  const rename = (id: number, nameAr: string) => run(`n-${id}`, t.renamed, () => api(`/api/v1/admin/categories/${id}`, { method: 'PATCH', token, body: { nameAr } }));
  const remove = (id: number) => run(`n-${id}`, t.removed, () => api(`/api/v1/admin/categories/${id}`, { method: 'DELETE', token }));
  const note = (at: string) => (msg && msg.at === at ? <p className={msg.ok ? 'ok-msg' : 'err'} dir="auto" role={msg.ok ? 'status' : 'alert'}>{msg.text}</p> : null);

  return (
    <>
      <AdminHead eyebrow={<>{t.navCategories} — <span dir="ltr">{String(tree?.length ?? 0).padStart(2, '0')}</span></>} title={t.categoriesTitle} deck={t.categoriesDeck} />
      <p className="ad-hint"><Icon name="info" size={18} />{t.categoriesHint}</p>
      {error ? <p className="err ds-msg" dir="auto" role="alert">{error}</p> : null}

      <section className="card ds-panel">
        <header className="ds-panel-head"><h2 className="ds-h2">{t.addField}</h2></header>
        <NewCategory idBase="new" onAdd={add(null)} />
        {note('new')}
      </section>

      {tree === null ? (
        <AdminWait label={copy.loading} />
      ) : !tree.length ? (
        <p className="ds-none">{t.noCategories}</p>
      ) : (
        <ul className="ad-tree">
          {tree.map((field) => {
            const on = open === field.id;
            const kids = field.children || [];
            return (
              <li key={field.id} className={`card ad-field${on ? ' is-on' : ''}`}>
                <Node
                  node={field}
                  toggle={
                    <button type="button" className="ad-tog" aria-expanded={on} aria-controls={`ad-kids-${field.id}`} onClick={() => setOpen(on ? null : field.id)}>
                      <span className={`ds-pl${on ? ' on' : ''}`} aria-hidden="true"><Icon name="plus" size={16} /></span>
                      <span className="min-w-0">
                        <strong dir="auto">{field.nameAr}</strong>
                        <small>{locale === 'en' ? `${categoryLabel('en', field)} · ` : ''}<span dir="ltr">{field.slug}</span> · {t.specialties(kids.length)}</small>
                      </span>
                    </button>
                  }
                  onRename={(name) => rename(field.id, name)}
                  onRemove={() => remove(field.id)}
                />
                {note(`n-${field.id}`)}
                {on ? (
                  <div className="ad-kids" id={`ad-kids-${field.id}`}>
                    <ul>
                      {kids.map((kid) => (
                        <li key={kid.id}>
                          <Node
                            node={kid}
                            toggle={
                              <span className="ad-kid min-w-0">
                                <b dir="auto">{kid.nameAr}</b>
                                <small>{locale === 'en' ? `${categoryLabel('en', kid)} · ` : ''}<span dir="ltr">{kid.slug}</span></small>
                              </span>
                            }
                            onRename={(name) => rename(kid.id, name)}
                            onRemove={() => remove(kid.id)}
                          />
                          {note(`n-${kid.id}`)}
                        </li>
                      ))}
                    </ul>
                    <div className="ad-new-kid">
                      <p className="lbl">{t.addSpecialty}</p>
                      <NewCategory idBase={`new-${field.id}`} onAdd={add(field.id)} />
                      {note(`new-${field.id}`)}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Node({ node, toggle, onRename, onRemove }: { node: CategoryNode; toggle: ReactNode; onRename: (name: string) => Promise<boolean>; onRemove: () => Promise<boolean> }) {
  const { locale } = useAdmin();
  const t = getAdmin(locale);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.nameAr);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || name.trim() === node.nameAr) {
      setEditing(false);
      return;
    }
    setBusy(true);
    if (await onRename(name.trim())) setEditing(false);
    setBusy(false);
  }

  async function drop() {
    setBusy(true);
    await onRemove();
    setBusy(false);
    setAsking(false);
  }

  if (editing) {
    return (
      <form className="ad-node ad-rename" onSubmit={submit}>
        <label className="sr-only" htmlFor={`ad-rn-${node.id}`}>{t.nameAr}</label>
        <input id={`ad-rn-${node.id}`} className="inp" value={name} onChange={(event) => setName(event.target.value)} dir="rtl" autoFocus maxLength={120} />
        <button type="submit" className="btn btn-acc btn-sm" disabled={busy}>{busy ? t.saving : t.save}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setName(node.nameAr); }}>{t.cancel}</button>
      </form>
    );
  }

  return (
    <div className="ad-node">
      {toggle}
      <div className="ad-node-act">
        <button type="button" className="ibtn ibtn-sm" aria-label={`${t.rename}: ${node.nameAr}`} title={t.rename} onClick={() => { setEditing(true); setAsking(false); }}>
          <Icon name="edit" size={17} />
        </button>
        {asking ? (
          <>
            <button type="button" className="btn btn-sm ad-danger" disabled={busy} onClick={drop}>{t.removeAsk}</button>
            <button type="button" className="ibtn ibtn-sm" aria-label={t.cancel} onClick={() => setAsking(false)}><Icon name="close" size={17} /></button>
          </>
        ) : (
          <button type="button" className="ibtn ibtn-sm" aria-label={`${t.remove}: ${node.nameAr}`} title={t.remove} onClick={() => setAsking(true)}>
            <Icon name="trash" size={17} />
          </button>
        )}
      </div>
    </div>
  );
}

function NewCategory({ idBase, onAdd }: { idBase: string; onAdd: (body: { nameAr: string; slug: string }) => Promise<boolean> }) {
  const { locale } = useAdmin();
  const t = getAdmin(locale);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const bad = slug !== '' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (bad) return;
    setBusy(true);
    const ok = await onAdd({ nameAr: nameAr.trim(), slug: slug.trim() });
    setBusy(false);
    if (ok) {
      setNameAr('');
      setNameEn('');
      setSlug('');
      setTouched(false);
    }
  }

  return (
    <form className="ad-new" onSubmit={submit}>
      <div className="fld">
        <label className="lbl" htmlFor={`${idBase}-ar`}>{t.nameAr}</label>
        <input id={`${idBase}-ar`} className="inp" value={nameAr} onChange={(event) => setNameAr(event.target.value)} dir="rtl" required minLength={2} maxLength={120} />
      </div>
      <div className="fld">
        <label className="lbl" htmlFor={`${idBase}-en`}>{t.nameEn}</label>
        <input
          id={`${idBase}-en`}
          className="inp"
          value={nameEn}
          dir="ltr"
          maxLength={80}
          onChange={(event) => {
            setNameEn(event.target.value);
            if (!touched) setSlug(slugify(event.target.value));
          }}
        />
      </div>
      <div className="fld">
        <label className="lbl" htmlFor={`${idBase}-slug`}>{t.slug}</label>
        <input
          id={`${idBase}-slug`}
          className="inp"
          value={slug}
          dir="ltr"
          required
          maxLength={80}
          aria-invalid={bad || undefined}
          aria-describedby={`${idBase}-slug-h`}
          onChange={(event) => { setSlug(event.target.value.toLowerCase()); setTouched(true); }}
        />
        <small id={`${idBase}-slug-h`} className={bad ? 'err' : undefined}>{t.slugHint}</small>
      </div>
      <button type="submit" className="btn btn-acc ad-new-btn" disabled={busy || bad}><Icon name="plus" size={18} />{busy ? t.saving : t.add}</button>
    </form>
  );
}
