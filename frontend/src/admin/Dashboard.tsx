import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { DEFAULT_SIZES, formatLKR, mediaUrl } from '../shared/media';
import type { AdminData, Banner, Campaign, Product } from '../shared/types';
import { api, setCsrfToken } from './api';
import { Field } from './fields';
import './dashboard.css';

type Tab = 'products' | 'campaigns' | 'banners' | 'settings' | 'media';
type AdminProduct = Required<Product>;

const TABS: { id: Tab; label: string; title: string }[] = [
  { id: 'products', label: '◈   Products', title: 'Your collection.' },
  { id: 'campaigns', label: '▣   Hero campaigns', title: 'The first impression.' },
  { id: 'banners', label: '◫   Collection banners', title: 'Set the scene.' },
  { id: 'settings', label: '⚙   Store settings', title: 'Brand control.' },
  { id: 'media', label: '↑   Media & backup', title: 'Your media library.' },
];

type Editing =
  | { kind: 'product'; item: AdminProduct | null }
  | { kind: 'campaign'; item: Campaign }
  | { kind: 'banner'; item: Banner };

const SETTING_KEYS = ['phone', 'display_phone', 'instagram_url', 'video_url', 'announcement', 'order_note'] as const;
type SettingsForm = Record<(typeof SETTING_KEYS)[number], string>;

const blankProduct = (position: number): AdminProduct => ({
  id: '', name: '', category: 'Polos', detail: '', description: '', image: 'assets/polo-forest.png', badge: 'NEW',
  price: '', stock: null, sizes: DEFAULT_SIZES, colors: [{ name: 'Forest', hex: '#164535' }], active: true, featured: true, position,
});

const onActivate = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

function useMessage() {
  const [msg, setMsg] = useState({ text: '', error: false, on: false });
  const timer = useRef<number | undefined>(undefined);
  const toast = useCallback((text: string, error = false) => {
    setMsg({ text, error, on: true });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg((m) => ({ ...m, on: false })), 3600);
  }, []);
  return { msg, toast };
}

export default function Dashboard() {
  const [state, setState] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<Tab>('products');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Editing | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsForm>({ phone: '', display_phone: '', instagram_url: '', video_url: '', announcement: '', order_note: '' });
  const [uploadedPath, setUploadedPath] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const { msg, toast } = useMessage();

  const reload = useCallback(async () => {
    const data = await api<AdminData>('/api/admin/data');
    setCsrfToken(data.csrf);
    setState(data);
    setSettings(Object.fromEntries(SETTING_KEYS.map((k) => [k, data.settings[k] ?? ''])) as SettingsForm);
  }, []);

  useEffect(() => {
    document.title = 'ALFA · Control Room';
    reload().catch((e) => toast(e.message, true));
  }, [reload, toast]);

  const open = (next: Editing) => {
    setEditing(next);
    setPreview(next.item?.image ?? 'assets/polo-forest.png');
    setEditorKey((k) => k + 1);
  };
  const close = useCallback(() => setEditing(null), []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  /** Reads the editor form into the payload the API expects. */
  const collect = (): object => {
    const el = form.current!;
    const input = (k: string) => el.querySelector<HTMLInputElement>(`[name="${k}"]`);
    const val = (k: string) => input(k)?.value.trim() || '';
    if (editing!.kind === 'product') {
      const colors = val('colors').split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
        const sep = x.indexOf(':');
        return { name: x.slice(0, sep).trim(), hex: x.slice(sep + 1).trim() };
      });
      return {
        id: val('id'), category: val('category'), name: val('name'), detail: val('detail'), description: val('description'),
        image: val('image'), badge: val('badge'), price: val('price') || null, stock: val('stock') === '' ? null : Number(val('stock')),
        position: Number(val('position') || 0), sizes: val('sizes').split(',').map((x) => x.trim()).filter(Boolean), colors,
        active: input('active')!.checked, featured: input('featured')!.checked,
      };
    }
    const out: Record<string, unknown> = { ...editing!.item };
    for (const field of el.querySelectorAll<HTMLInputElement>('[name]')) out[field.name] = field.type === 'checkbox' ? field.checked : field.value;
    return out;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const endpoint = { product: 'products', campaign: 'campaigns', banner: 'banners' }[editing.kind];
      await api('/api/admin/' + endpoint, 'POST', collect());
      close();
      await reload();
      toast('Saved successfully. Your live storefront has been updated.');
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (editing?.kind !== 'product' || !editing.item) return;
    if (!confirm('Permanently delete ' + editing.item.id + '?')) return;
    try {
      await api('/api/admin/products/' + encodeURIComponent(editing.item.id), 'DELETE');
      close();
      await reload();
      toast('Product deleted.');
    } catch (err) {
      toast((err as Error).message, true);
    }
  };

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/admin/settings', 'POST', settings);
      await reload();
      toast('Store details saved.');
    } catch (err) {
      toast((err as Error).message, true);
    }
  };

  const upload = async () => {
    const file = fileInput.current?.files?.[0];
    if (!file) {
      toast('Choose an image or video first.', true);
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api<{ path: string }>('/api/admin/upload', 'POST', fd);
      setUploadedPath(res.path);
      toast('Upload complete. Copy the path and paste into your content.');
    } catch (err) {
      toast((err as Error).message, true);
    }
  };

  const logout = async () => {
    try {
      await api('/api/admin/logout', 'POST', {});
      location.href = '/admin';
    } catch (err) {
      toast((err as Error).message, true);
    }
  };

  const products = state?.products ?? [];
  const term = search.toLowerCase();
  const matching = products.filter((p) => [p.name, p.id, p.category].join(' ').toLowerCase().includes(term));
  const setSetting = (key: keyof SettingsForm) => (e: { currentTarget: { value: string } }) => {
    const value = e.currentTarget.value;
    setSettings((s) => ({ ...s, [key]: value }));
  };

  return (
    <>
      <div className="shell">
        <aside className="side">
          <div><div className="brand">ALFA<b>.</b></div><div className="micro">Owner control room</div></div>
          <div className="nav">
            {TABS.map((t) => <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>{t.label}</button>)}
          </div>
          <div className="side-bottom"><a href="/" target="_blank" rel="noopener">↗ View your store</a><button id="logout" onClick={logout}>Sign out</button></div>
        </aside>
        <main className="workspace">
          <header className="top">
            <div><span className="micro">ALFA INFINITY / CONTENT MANAGEMENT</span><h1 id="tabtitle">{TABS.find((t) => t.id === tab)!.title}</h1></div>
            <span className="live">● PRIVATE ADMIN</span>
          </header>
          <div className="overview">
            <div className="stat"><strong id="countProduct">{state ? products.filter((p) => p.active).length : '—'}</strong><small>Published styles</small></div>
            <div className="stat"><strong id="countPrice">{state ? products.filter((p) => p.price).length : '—'}</strong><small>With prices</small></div>
            <div className="stat"><strong id="countCampaign">{state ? state.campaigns.filter((c) => c.active).length : '—'}</strong><small>Active campaigns</small></div>
          </div>

          <section id="section-products" className={'section' + (tab === 'products' ? ' on' : '')}>
            <div className="section-title">
              <div><h2>Products and pricing.</h2><p>Upload photos, change collections, set prices and publish immediately.</p></div>
              <button className="primary" id="newProduct" onClick={() => open({ kind: 'product', item: null })}>+ New product</button>
            </div>
            <div className="bar">
              <input className="search" id="productSearch" placeholder="Search product, SKU, collection..." aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="secondary" id="downloadCSV" onClick={() => window.open('/api/admin/catalogue.csv', '_blank')}>Export CSV</button>
            </div>
            <div className="products" id="productRows">
              {state && !matching.length && <p className="muted">No matching products.</p>}
              {matching.map((p) => (
                <div className="prodrow" key={p.id}>
                  <img src={mediaUrl(p.image)} alt="" onError={(e) => (e.currentTarget.style.opacity = '.2')} />
                  <div className="prodinfo">
                    <strong>{p.name}</strong>
                    <span>{p.id} · {p.category} · {p.price ? formatLKR(p.price) : 'Price on enquiry'}{p.stock === 0 ? ' · OUT OF STOCK' : ''}</span>
                  </div>
                  <span className={'pill ' + (p.active ? '' : 'draft')}>{p.active ? 'PUBLISHED' : 'DRAFT'}</span>
                  <button className="rowbtn" onClick={() => open({ kind: 'product', item: p })}>Edit ↗</button>
                </div>
              ))}
            </div>
          </section>

          <section id="section-campaigns" className={'section' + (tab === 'campaigns' ? ' on' : '')}>
            <div className="section-title"><div><h2>Homepage hero campaigns.</h2><p>Control the three full-width featured slides.</p></div></div>
            <div className="notice">Use a short headline. Separate lines with <b>|</b> and wrap the green-highlighted word in <b>*asterisks*</b>. Example: WEAR|YOUR OWN|*STANDARD.*</div>
            <div className="card-list" id="campaignRows">
              {state?.campaigns.map((c) => {
                const edit = () => open({ kind: 'campaign', item: c });
                return (
                  <div className="content-card" key={c.id} tabIndex={0} role="button" onClick={edit} onKeyDown={onActivate(edit)}>
                    <img src={mediaUrl(c.image)} alt="" />
                    <strong>0{c.id + 1} / {c.kicker}</strong>
                    <small>{c.active ? 'Published' : 'Hidden'} · Tap to edit</small>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="section-banners" className={'section' + (tab === 'banners' ? ' on' : '')}>
            <div className="section-title"><div><h2>Collection banners.</h2><p>Edit the three campaign cards below the hero.</p></div></div>
            <div className="card-list" id="bannerRows">
              {state?.banners.map((b) => {
                const edit = () => open({ kind: 'banner', item: b });
                return (
                  <div className="content-card" key={b.id} tabIndex={0} role="button" onClick={edit} onKeyDown={onActivate(edit)}>
                    <img src={mediaUrl(b.image)} alt="" />
                    <strong>{b.title.replaceAll('|', ' ')}</strong>
                    <small>Tap to edit collection banner</small>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="section-settings" className={'section' + (tab === 'settings' ? ' on' : '')}>
            <div className="section-title"><div><h2>Your store details.</h2><p>These settings update public contact details and enquiries.</p></div></div>
            <div className="panel">
              <form id="settingsForm" className="formgrid" onSubmit={saveSettings}>
                <div className="field"><label htmlFor="setPhone">WhatsApp number</label><input id="setPhone" required placeholder="9477xxxxxxx" inputMode="numeric" value={settings.phone} onChange={setSetting('phone')} /><small>International digits only, no + or spaces.</small></div>
                <div className="field"><label htmlFor="setDisplay">Displayed contact number</label><input id="setDisplay" placeholder="071 091 0951" value={settings.display_phone} onChange={setSetting('display_phone')} /></div>
                <div className="field full"><label htmlFor="setInstagram">Instagram URL (optional)</label><input id="setInstagram" placeholder="https://instagram.com/yourbrand" value={settings.instagram_url} onChange={setSetting('instagram_url')} /><small>Shown as an Instagram link in the storefront footer.</small></div>
                <div className="field full"><label htmlFor="setVideo">Production video file / HTTPS link (optional)</label><input id="setVideo" placeholder="uploads/your-video.mp4" value={settings.video_url} onChange={setSetting('video_url')} /><small>Use Media &amp; backup to upload an MP4. Without one, the video area remains a placeholder.</small></div>
                <div className="field full"><label htmlFor="setAnnounce">Top announcement</label><input id="setAnnounce" value={settings.announcement} onChange={setSetting('announcement')} /></div>
                <div className="field full"><label htmlFor="setNote">WhatsApp order note</label><textarea id="setNote" value={settings.order_note} onChange={setSetting('order_note')} /></div>
                <div className="field full"><button className="primary" type="submit">Save store settings ↗</button></div>
              </form>
            </div>
          </section>

          <section id="section-media" className={'section' + (tab === 'media' ? ' on' : '')}>
            <div className="section-title"><div><h2>Photos, videos and backups.</h2><p>Upload product photographs or your workshop video.</p></div></div>
            <div className="panel">
              <h3>Upload an asset</h3>
              <p className="hint">Images JPG, PNG or WebP (up to 9 MB); MP4 production clips (up to 40 MB). Uploading returns a path you can paste into a product, banner or campaign.</p>
              <input id="uploadFile" ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" aria-label="Choose a file to upload" />
              <div className="actions">
                <button id="uploadBtn" className="primary" onClick={upload}>Upload asset</button>
                {uploadedPath && <button className="secondary" id="copyPath" onClick={() => { navigator.clipboard?.writeText(uploadedPath); toast('Path copied.'); }}>Copy file path</button>}
              </div>
              <p className="hint" id="uploadedPath">{uploadedPath && 'Uploaded: ' + uploadedPath}</p>
            </div>
            <div className="panel">
              <h3>Keep a backup</h3>
              <p className="hint">Download the catalogue database regularly, especially before making large edits. You also need to back up the <code>uploads/</code> folder containing your own media.</p>
              <div className="actions">
                <button className="secondary" id="backupDB" onClick={() => window.open('/api/admin/backup', '_blank')}>Download database backup</button>
                <button className="secondary" id="backupCSV" onClick={() => window.open('/api/admin/catalogue.csv', '_blank')}>Download product CSV</button>
              </div>
            </div>
            <div className="notice">This admin is connected to a real SQLite database. Changes affect the public storefront on the same server. To remain online between server restarts, your hosting must use a persistent disk for both database and uploaded files.</div>
          </section>
        </main>
      </div>

      <div className={'overlay' + (editing ? ' on' : '')} id="overlay" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className={'editor' + (saving ? ' loading' : '')} role="dialog" aria-modal="true" aria-labelledby="editorTitle">
          {editing && (
            <>
              <div className="edithead">
                <h2 id="editorTitle">{editorTitle(editing)}</h2>
                <button className="x" aria-label="Close editor" onClick={close}>×</button>
              </div>
              <form id="editorForm" ref={form} key={editorKey} onSubmit={save}>
                <div className="formgrid" id="formFields">
                  <EditorFields editing={editing} preview={preview} onImage={setPreview} position={products.length} />
                </div>
                <div className="actions">
                  <button className="primary" type="submit">Save changes ↗</button>
                  <button className="secondary" type="button" id="editCancel" onClick={close}>Cancel</button>
                  {editing.kind === 'product' && editing.item && (
                    <button className="danger" type="button" id="deleteProduct" style={{ marginLeft: 'auto' }} onClick={deleteProduct}>Delete product</button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      <div id="toast" className={'message' + (msg.error ? ' error' : '')} role="status" style={{ display: msg.on ? 'block' : 'none' }}>{msg.text}</div>
    </>
  );
}

function editorTitle(editing: Editing) {
  if (editing.kind === 'product') return editing.item ? 'Edit ' + editing.item.name : 'New product';
  if (editing.kind === 'campaign') return 'Campaign ' + (editing.item.id + 1);
  return 'Collection banner ' + (editing.item.id + 1);
}

interface EditorFieldsProps {
  editing: Editing;
  preview: string;
  onImage: (path: string) => void;
  position: number;
}

function ImagePreview({ path, wide }: { path: string; wide?: boolean }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [path]);
  if (!path || broken) return null;
  return (
    <div className="field full">
      <img className={'preview' + (wide ? ' bannerpreview' : '')} src={mediaUrl(path)} alt="Image preview" onError={() => setBroken(true)} />
    </div>
  );
}

function EditorFields({ editing, preview, onImage, position }: EditorFieldsProps) {
  if (editing.kind === 'product') {
    const p = editing.item ?? blankProduct(position);
    return (
      <>
        <Field name="id" label="SKU / Product ID" value={p.id} readOnly={Boolean(editing.item)} />
        <Field name="category" label="Collection (Polos, Tees, Performance, Other)" value={p.category} />
        <Field name="name" label="Product name" value={p.name} full />
        <Field name="detail" label="Short description" value={p.detail} full />
        <Field name="description" label="Full description" value={p.description} type="textarea" full />
        <Field name="image" label="Image path (upload under Media tab)" value={p.image} full onInput={onImage} />
        <ImagePreview path={preview} />
        <Field name="badge" label="Product badge" value={p.badge} />
        <Field name="price" label="Price LKR (blank = enquiry)" value={p.price || ''} type="number" />
        <Field name="stock" label="Total stock (blank = not tracked)" value={p.stock ?? ''} type="number" />
        <Field name="position" label="Display order" value={p.position || 0} type="number" />
        <Field name="sizes" label="Sizes (comma separated)" value={p.sizes.join(', ')} full />
        <Field name="colors" label="Colours (name:#RRGGBB, comma-separated)" value={p.colors.map((c) => c.name + ':' + c.hex).join(', ')} type="textarea" full />
        <Field name="active" label="Published" value={p.active} type="checkbox" />
        <Field name="featured" label="Featured" value={p.featured} type="checkbox" />
      </>
    );
  }
  if (editing.kind === 'campaign') {
    const c = editing.item;
    return (
      <>
        <Field name="kicker" label="Small label above headline" value={c.kicker} full />
        <Field name="title" label="Headline (| new line, *green text*)" value={c.title} full />
        <Field name="description" label="Supporting copy" value={c.description} type="textarea" full />
        <Field name="image" label="Hero background image" value={c.image} full onInput={onImage} />
        <ImagePreview path={preview} wide />
        <Field name="cta" label="Main button label" value={c.cta} />
        <Field name="link" label="Main button link" value={c.link} />
        <Field name="secondary" label="Second button label" value={c.secondary} />
        <Field name="secondary_link" label="Second button link" value={c.secondary_link} />
        <Field name="active" label="Published" value={c.active} type="checkbox" />
      </>
    );
  }
  const b = editing.item;
  return (
    <>
      <Field name="eyebrow" label="Small label" value={b.eyebrow} full />
      <Field name="title" label="Heading (| new line)" value={b.title} full />
      <Field name="description" label="Supporting copy" value={b.description} type="textarea" full />
      <Field name="image" label="Banner image" value={b.image} full onInput={onImage} />
      <ImagePreview path={preview} wide />
      <Field name="link" label="Button anchor (#shop, #bulk)" value={b.link} />
      <Field name="filter" label="Collection (Polos, Tees, Performance, All)" value={b.filter} />
    </>
  );
}
