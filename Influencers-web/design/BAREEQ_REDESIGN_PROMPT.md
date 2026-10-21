# REDESIGN PROMPT — Apply the "Bareeq" design to my existing website

> Paste this whole file into your AI coding tool (Cursor, Claude Code, Windsurf, v0, Lovable…) **together with the attached file `bareeq-design-system.css`**.
> Replace every `[…]` placeholder with your real info before or after the AI finishes.

---

## 0. Your role and the golden rule

You are a senior front-end engineer and motion designer. My website already exists and works. Your job is to **replace its visual design (UI, layout, styling, animation) with the design described below**.

**Golden rule — do NOT break anything that works:**
- Keep the existing framework, routing, pages, API calls, database logic, auth, forms' submit handlers, state management, and data models.
- Do not rename routes or change backend code. Do not delete features. If a feature exists in my site but not in this spec, restyle it using the same design system.
- Only change: markup structure inside components, styles, class names, layout, and add animation.
- If something in this spec needs data my site does not have (e.g. follower counts, prices), render a clear placeholder like `[السعر]` and leave a `// TODO` comment — never invent fake data.

## 1. Work plan (follow in order, report after each step)

1. **Audit**: list every page/route and shared component in my project. Make a table mapping each existing page → the matching page in Section 7 of this spec (or "no match — restyle with design system").
2. **Foundation**: install fonts, add design tokens (Section 3), add `bareeq-design-system.css` (or convert it to Tailwind theme + a global CSS file if the project uses Tailwind). Set `<html lang="ar" dir="rtl">`.
3. **Global motion layer** (Section 4): smooth scroll, custom cursor, grain, scroll progress bar, preloader (home only), magnetic buttons, 3D tilt, reveal-on-scroll. Respect `prefers-reduced-motion`.
4. **Shared components** (Section 5): build them once, reuse everywhere.
5. **Pages** (Section 7): restyle page by page, keeping all existing logic wired.
6. **QA** (Section 9): run the checklist, fix issues, then give me a summary of what changed.

## 2. Design concept

- **Name / brand**: "بريق" (Bareeq = sparkle). Replace with my brand name: `[اسم العلامة]`.
- **What it is**: an Iraqi platform connecting **influencers / content creators and models** with **brands/companies** for campaigns and bookings.
- **Mood**: bold, dark, editorial, energetic — like an Awwwards "Site of the Day" creator agency. Big Arabic display type, a single hot accent color, rounded cards, lots of tasteful motion.
- **Creator-first**: the home page must lead with the creators themselves (faces, names, categories), not with generic marketing text.
- **Language**: Arabic, right-to-left, Iraqi-friendly tone (light dialect in headlines is OK).

## 3. Design tokens

### Colors
| Token | Value | Use |
|---|---|---|
| `--ink` | `#0E0D12` | Page background (dark) |
| `--card` | `#17151E` | Cards, inputs |
| `--card2` | `#1E1B26` | Nested surfaces, hover rows |
| `--line` | `#2C2936` | Borders, dividers |
| `--txt` | `#F5F2EA` | Main text on dark |
| `--mut` | `#B1ACBE` | Secondary text |
| `--dim` | `#8A859B` | Tertiary text, captions |
| `--paper` | `#F5F2EA` | Light "paper" sections (cream) |
| `--acc` | `#FFC23D` | **Accent (sparkle gold)**. Alternatives: `#FF4F9A` hot pink, `#FF6A3D` coral, `#3D8BFF` blue |
| Text on accent | `#0E0D12` | Always dark text on accent backgrounds |

On paper (cream) sections: text `#0E0D12`, secondary `#4E4A5C`, card `#FFFFFF`, border `#E2DCCD`, chip track `#E7E2D6`.

Creator placeholder tones (until real photos exist): `#3B2F7A #1F5A4E #7A2E3B #2B4C7E #6B4A1F #5E2B66 #24525E #7A4A2E #4A2F5E #2F5A3A #6A2F4A #2A3F66`.

Status colors (dashboard only): active `#6EE7A0` on `rgba(74,222,128,.14)`, pending `#FF9A5C` on `rgba(255,154,92,.15)`, done `#B1ACBE` on `#24212D`. Live dot `#4ADE80`.

**Do not** use gradient backgrounds, emoji, or neon glows. One accent only.

### Typography (Google Fonts)
- **Display / headings**: `Alexandria` 700/800/900.
- **Body / UI**: `IBM Plex Sans Arabic` 400/500/600/700.
- Scale: H1 hero `clamp(54px, 8.6vw, 136px)` weight 900, line-height 1.06, letter-spacing -1.5px. H2 section `clamp(36px, 4.6vw, 68px)` weight 900, line-height 1.12. H3 card 22–32px weight 800. Body 16–18px, line-height 1.8. Captions 13–14px.
- Outlined numbers/words: `color: transparent; -webkit-text-stroke: 1.5–2px <color>` (used for rank numbers, giant footer wordmark, step numbers).

### Shape & spacing
- Radius: buttons/chips `999px`, inputs `16px`, small cards `22–24px`, cards `28px`, big panels `32–48px`.
- Container: `max-width: 1280px`, side padding `24px`.
- Section vertical padding: `96–120px` desktop.
- Grid gaps: `16–22px` cards, `40–64px` columns.
- Touch targets ≥ 44px.

### Icons
- Inline stroke SVG icons (Lucide style), `stroke-width: 2`, `stroke-linecap: round`. No emoji, no icon fonts.
- Logo mark: 4-point sparkle star path `M12 1.5C12.6 7.6 16.4 11.4 22.5 12C16.4 12.6 12.6 16.4 12 22.5C11.4 16.4 7.6 12.6 1.5 12C7.6 11.4 11.4 7.6 12 1.5Z`, filled with accent; rotates 180° on hover.

## 4. Motion system (award-style, but smooth and accessible)

Recommended libraries (pick what fits my stack):
- **Lenis** for smooth scrolling.
- **GSAP + ScrollTrigger** (or **Framer Motion** for React) for scroll reveals, pinning and text splits.
- Fallback: the attached CSS already contains pure-CSS versions using `animation-timeline: view()` — keep those if no JS library is used.

Easings: main `cubic-bezier(.2,.8,.2,1)`, wipes `cubic-bezier(.7,0,.2,1)`.

| Effect | Where | Spec |
|---|---|---|
| **Preloader** | Home first load only | Full-screen accent panel, logo letters rise one by one (80ms stagger), dark progress bar fills bottom in 1.3s, panel slides up (`translateY(-100%)`, 1s). Hero animations start after it. |
| **Custom cursor** | Desktop only (`hover: hover`) | 8px accent dot + 42px accent ring that follows with ~0.18s lag. Over links/buttons ring grows to 76px with 18% accent fill. Over creator cards ring grows to 96px, solid accent, `mix-blend-mode: difference`. Keep native cursor visible. |
| **Grain** | Global | Fixed SVG `feTurbulence` noise overlay, opacity 0.06, `mix-blend-mode: overlay`, pointer-events none. |
| **Scroll progress** | Global | 3px accent bar fixed at top, scaleX from right 0→1 with page scroll. |
| **Split headline reveal** | Every H1 | Each word in its own mask (`overflow: hidden`), slides up from 80% + 4° rotate, 1.1s, 100ms stagger. |
| **Highlighter sweep** | One key word per H1 | Accent background wipes in from the right (0→100%), text turns dark, after the words land. |
| **Fade-up** | Sub-headings, CTAs | opacity 0→1, translateY 28px→0, 1s, staggered. |
| **Reveal on scroll** | Section headers, cards | translateY 60px→0 + fade as element enters (entry 0% → cover 26%). |
| **Clip reveal** | Images, model cards | `clip-path: inset(100% 0 0 0 round 28px)` → `inset(0)` on scroll. |
| **Parallax** | Images, collages | translateY 70px → -70px across viewport; inner image scale 1.25 → 1. |
| **Scroll-lit text** | Big statement paragraphs | Each phrase color goes from `#3A3646` to `--txt` as it scrolls into view. |
| **Zoom-in panel** | Big CTA / "how it works" / video panel | scale .82 → 1 and radius 80px → 40px on scroll. |
| **Sticky stacking cards** | Brands page process | Each card `position: sticky; top: 110px + i*26px`, stacking on top of the previous with shadow. |
| **Timeline fill** | Join page | Vertical line fills (scaleY 0→1) as the user scrolls through steps. |
| **Magnetic buttons** | Primary CTAs | Button follows the cursor: translate = (cursor − center) × 0.3 (x) / 0.45 (y), springs back on leave (0.45s). |
| **3D tilt + glare** | Creator cards | rotateX/Y up to ±6–7° from cursor position with `perspective(1000px)`, plus a soft white radial glare following the cursor; resets on leave. |
| **Card hover** | Creator cards | Border → accent, portrait scales 1.07, dashed ring rotates 120°, play button scales + turns accent, "شاهد الملف" button slides up from bottom. |
| **Infinite marquees** | Category bands, logo strip, profile cover | Seamless loop (duplicate content, translateX 0→50% in RTL), 34–60s, pause on hover. Two bands: one accent, rotated −2°; one dark, rotated +1.2°, opposite direction. |
| **3D creator wall** | Home hero | Two rows of creator cards in marquee (opposite directions) inside a container with `perspective: 1600px; rotateX(16deg) rotateZ(-3deg) scale(1.08)` and edge fade mask. |
| **Horizontal slider** | "Trending" & "Similar creators" | Scroll-snap row; each card animates scale .86→1 + rotate −2.5°→0 as it enters horizontally; prev/next round buttons. |
| **Index rows** | Category list | Row background wipes up with accent (scaleY 0→1), text turns dark and shifts 28px, arrow rotates −45°, 3 mini portraits pop in. |
| **Ambient** | Decorative | Floating cards (translateY ±18px, 6s), slowly spinning dashed rings and sparkle stars (20s), pulsing live dot. |
| **Success burst** | After booking / contact submit | 10 sparkle stars burst outward and fade around a check circle that pops in. |
| **Tabs / segments** | Everywhere | Active pill background slides with 0.35s ease; tab underline scales from 0→1. |

**Reduced motion**: when `prefers-reduced-motion: reduce`, disable all animation, show final states (no hidden text), no preloader, no smooth scroll. Also provide a site-level "motion off" switch class `.still` (already in CSS).

**Performance**: animate only `transform`, `opacity`, `clip-path`. Use `will-change` sparingly. Lazy-load images. Cursor/tilt handlers must write CSS variables (no React re-render per mouse move).

## 5. Shared components

1. **Navbar** — sticky, 80px tall, `rgba(14,13,18,.78)` + `backdrop-filter: blur(16px)`, bottom border `#1F1D27`. Right: logo (star + "بريق"). Center links: المؤثرين · للشركات · انضم كمؤثر · من نحن (underline grows from right on hover; active page underlined). Left: ghost button "تسجيل الدخول" + accent magnetic button "ابدأ الآن". Mobile: hide links, keep logo + CTA, add a menu button that opens a full-screen accent overlay menu with big staggered links.
2. **Buttons** — pill, min-height 52px (44px small). Variants: `accent` (accent bg, dark text), `dark` (ink bg, cream text), `ghost` (transparent, 1.5px `--line` border → accent on hover). Arrow icon inside slides 6px left on hover.
3. **Icon button** — 52px circle, ghost border, fills accent on hover.
4. **Chip** — pill 44px, border `--line`; active = accent fill + dark text.
5. **Segmented control** — pill track (`--card` + border), active segment cream bg + dark text (on paper sections: active = ink bg + cream text).
6. **Tag** — small pill on images: `rgba(14,13,18,.62)` + blur, 13px.
7. **Section header** — eyebrow (accent text with 28px accent line before it) + H2, optional paragraph on the opposite side, optional "عرض الكل" ghost button.
8. **Creator card** — `--card` bg, 28px radius, portrait area (aspect 4:4.5) in the creator tone with photo (placeholder: silhouette + dashed ring), category tag top-right, initial badge top-left, verified badge (accent circle with check) next to name, `city · platform` line, optional "يبدأ من [السعر]" footer. Whole card links to the profile. Tilt + hover effects from Section 4.
9. **Trending card** — 340px wide, 420px portrait, outlined rank number (`٠١`…), play button bottom-left, arrow icon.
10. **Model card** — on paper section, white card, aspect 3:4 portrait, live tag "متاح الخميس", hover reveals "احجز الآن".
11. **Category index row** — full-width row, number + giant label (`clamp(34px,5.2vw,76px)`), mini portraits + arrow on the left; hover effect from Section 4.
12. **FAQ accordion** — rows separated by `--line`, question 20px/600, plus icon in 40px circle rotates 45° and fills accent when open, answer fades/pops in.
13. **Form fields** — label 14px/600 `--mut`; input 54px, `--card`, 1.5px border, radius 16px, focus = accent border + 4px accent ring at 22%. Option cards (`.opt`) for choices: bordered card, selected = accent border + 10% accent tint.
14. **Footer (home)** — 4 columns (brand blurb, platform links, company links, contact), then a giant outlined "بريق" wordmark that drifts horizontally on scroll, then copyright row. **Footer (inner pages)** — single row: logo · links · ©.
15. **Dashboard sidebar** — 264px, `#121117`, nav items 46px with icon; active item accent fill; upgrade card at bottom (accent).

## 6. Responsive rules
- Breakpoint 960px: all multi-column grids → 1 column; hide nav links (use mobile menu); sticky sidebars become static; hero visuals min-height 440px; wall cards 160×210; hide index-row thumbnails.
- No horizontal page scroll at 375px. Wide tables scroll inside their own box.
- Cursor and tilt effects disabled on touch devices.

## 7. Pages (map these onto my existing routes)

### 7.1 Home `/`
1. Preloader.
2. Hero (centered): pill "متاح الآن • أول منصة عراقية تجمع المؤثرين والموديلز والشركات" → H1 "اكتشف **نجوم** / المحتوى في **العراق**" ("نجوم" gets the highlighter, "العراق" in accent) → lead "تصفّح المؤثرين والموديلز، شاهد أعمالهم، واحجز تعاونك القادم خلال دقائق." → pill search bar (search icon, input "ابحث باسم المؤثر، المجال أو المدينة…", accent "ابحث" button) → popular chips (جمال، طعام، أزياء، موديلز، تقنية).
3. 3D creator wall (2 marquee rows of creator cards, linking to profiles).
4. "ترند هذا الأسبوع / الأكثر طلباً من الشركات" — horizontal trending slider with prev/next buttons.
5. "تصفّح حسب المجال / كل مجال، له نجومه" — 6 category index rows (جمال ومكياج، أزياء وموضة، طعام ومطاعم، تقنية وألعاب، سفر ولايف ستايل، رياضة ولياقة).
6. Paper section "موديلز للحجز / متاحين هذا الأسبوع لجلسات التصوير" — 4 model cards.
7. "اختر الوجه المناسب لعلامتك التجارية" — category filter chips + grid of 8 creator cards + "عرض كل المؤثرين" button.
8. Two rotated marquee bands (categories / services).
9. Paper "How it works" with segmented toggle **للشركات / للمؤثرين** that swaps 3 step cards (outlined big numbers ٠١ ٠٢ ٠٣). Brand steps: انشر حملتك · اختر المؤثر · تابع النتائج. Creator steps: أنشئ ملفك · استقبل العروض · استلم أرباحك.
10. Services bento (6-col grid): big card "حملات تسويقية متكاملة" with a mini campaign-status list (منشور / قيد التنفيذ / مسودة), accent card "حجز موديلز", card "تقارير أداء واضحة" with animated bars, "عقود ودفع آمن", "تصوير وإنتاج محتوى".
11. Scroll-lit statement: "المحتوى العراقي صار يحرّك السوق. بريق يوصلك بالناس الصح، بالوقت الصح."
12. FAQ (2 columns: title left, accordion right).
13. Two CTA panels: accent "للشركات — أطلق حملتك الجاية ويا أفضل المؤثرين" + dark "للمؤثرين — حوّل محتواك إلى دخل ثابت".
14. Big footer.

### 7.2 Creators listing `/creators`
**Full detailed spec is in `design/CREATORS_PAGE_PROMPT.md` — follow that file for this page.** Summary:
- 2-column hero: headline + live stats on one side, an animated shuffling deck of 3 featured creator cards on the other.
- Horizontal category rail of big tiles (icon, name, specialty count) with a gold wipe-up active state; replaces the sidebar category list.
- Sticky glass toolbar: search pill, location segmented (في كل مكان / داخل العراق / خارج العراق), sort, grid/list toggle.
- Sidebar split into 3 cards: switches (موثّق فقط، متاح هذا الأسبوع), top-6 city checkboxes + "عرض كل المحافظات", platform chips + budget.
- Grid: featured wide card first, rich creator cards (save button, availability, skill chips, price, hover portfolio strip), a promo "انضم" card after the 4th item; list view option; load-more with progress bar.
- Paper CTA "ما تعرف منو تختار؟".
- Wire to my existing listing/filter/search logic.

### 7.3 Creator profile `/creators/[id]`
- Cover panel (creator tone, giant outlined name marquee, spinning rings).
- Avatar circle overlapping the cover (6px ink border), name + verified badge, category tags, city, live "متاحة للتعاون"; actions: save (heart toggle), share, "راسلها", accent "احجز تعاون".
- 4 platform stat cards (`[المتابعين]`), bio.
- Tabs: الأعمال (masonry portfolio with play buttons) / الباقات (selectable package option cards with `[السعر]`) / التقييمات.
- Sticky booking card on the side (selected package, price, date, brand type, "متابعة الحجز", response time, payment protection note).
- "مؤثرين مشابهين" horizontal slider.

### 7.4 Booking / campaign request `/book/[id]`
- Minimal header (logo + "إلغاء").
- 4-step wizard with segmented progress bars: النوع (4 option cards with icons) → التفاصيل (campaign name, brand, description, platform chips) → الموعد (date, time, budget, delivery segmented) → المراجعة (summary + terms checkbox).
- Sticky summary card (creator mini, selections, total `[السعر]`, protection note).
- Success screen with sparkle burst, "وصل طلبك!", buttons to dashboard / browse.

### 7.5 For brands `/brands`
- Split hero "خلّي المؤثرين / يحچون عن / **علامتك**" with floating creator cards + campaign status card.
- Client logo marquee (`[شعار عميل]`).
- 4 sticky stacking process cards (alternating dark / accent / paper / dark).
- 6 feature cards.
- Zoom-in video panel with big magnetic play button (`[فيديو تعريفي]`).
- Paper pricing: monthly/yearly toggle, 3 plans (أساسي / احترافي highlighted dark / مؤسسات), `[السعر]`.
- Scroll-lit CTA "جاهز تطلق حملتك؟".

### 7.6 Join as creator `/join`
- Hero with giant outlined marquee in background, H1 "محتواك / يستاهل **يوصل**", trust ticks, and a quick-signup card (segmented صانع محتوى / موديل, name, phone, main platform).
- 4 benefit cards (tilt) with outlined numbers.
- Paper timeline (sticky title + vertical line that fills on scroll, 4 stages).
- "أنواع التعاون" index rows.
- FAQ, accent CTA "دورك تلمع".

### 7.7 Auth `/login` & `/register`
- Split screen: form side (logo, H1 changes "هلا بيك من جديد" / "أهلاً بيك في بريق", tabs تسجيل الدخول / حساب جديد, on signup: role cards شركة / مؤثر / موديل, fields, remember me, forgot password, primary button, divider, Google + SMS buttons, terms).
- Visual side: rounded accent panel with 3 tilted columns of creator cards scrolling vertically in alternating directions + glass caption card.
- Keep my existing auth logic.

### 7.8 Brand dashboard `/dashboard`
- Sidebar (Section 5.15). Top bar: date + "هلا، [اسم الشركة]", search, notifications with pulsing dot, accent "حملة جديدة".
- 4 KPI tiles (first one accent).
- Campaigns table with segmented filter (الكل / نشطة / للموافقة / مكتملة) and status pills.
- Right column: incoming creator requests with قبول / رفض (animated result), weekly calendar strip with booking list.
- Use my real data; if a creator dashboard exists, restyle it with the same layout.

### 7.9 About & contact `/about`
- Manifesto H1 "نبني المساحة اللي / يلتقي بيها **الإبداع** / بالسوق العراقي."
- Story split (clip-reveal collage + text).
- Paper values (3 cards, outlined numbers): الوضوح · الثقة · المحلي أولاً.
- Team cards (tilt), contact info cards, contact form with topic chips and success state, big footer wordmark.

## 8. Content & data rules
- Use my real creators, photos, prices, and text from the database/CMS. Photos: portrait crops, `object-fit: cover`, placed inside the same card shapes.
- Arabic numerals style: use Eastern Arabic digits (١٢٣) in decorative numbers; keep data numbers as my site currently shows them.
- Placeholders to fill: `[اسم العلامة]`, `[رقم الهاتف]`, `[البريد الإلكتروني]`, `[السعر]`, `[المتابعين]`, `[شعار عميل]`, `[فيديو تعريفي]`, payment/commission FAQ answers.

## 9. QA checklist (must pass)
- [ ] Every existing route still works; forms still submit; auth still works; no console errors.
- [ ] RTL correct everywhere (icons/arrows mirrored, text right-aligned).
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 95 on home.
- [ ] Text contrast ≥ 4.5:1 (including grey captions); focus states visible; all icon-only buttons have `aria-label`; real `<button>` / `<a>` elements.
- [ ] No layout shift from fonts (use `font-display: swap` + size-adjust or next/font).
- [ ] Works at 375px, 768px, 1280px, 1440px; no horizontal scroll.
- [ ] Reduced-motion mode shows all content with no animation.
- [ ] Animations run at 60fps (only transform/opacity/clip-path).

When finished, give me: (1) the page mapping table, (2) list of files changed, (3) any placeholders or TODOs left for me.
