# Redesign prompt — Creators listing page (`/creators`)

> Give this to Claude in VS Code together with `design/bareeq-design-system.css` (already in your project).
> Only the creators listing page changes. Keep all existing data fetching, filters logic, search, pagination, routing and i18n (AR/EN toggle).

## Rules
- Do NOT change backend, API, database, or route names. Only UI of the creators listing page and any new small components it needs.
- Use the existing design tokens: `--ink #0E0D12`, `--card #17151E`, `--line #2C2936`, `--txt #F5F2EA`, `--mut #B1ACBE`, `--dim #8A859B`, `--paper #F5F2EA`, accent `--acc #FFC23D` (dark text `#0E0D12` on accent). Fonts: Alexandria (display) + IBM Plex Sans Arabic (body). RTL.
- Use real data from my database. If a field doesn't exist (price, availability, portfolio thumbnails), show a placeholder like `[السعر]` and add `// TODO`. Never invent fake numbers.
- Animate only transform / opacity / clip-path. Respect `prefers-reduced-motion`.

## What's wrong with the current page (fix these)
1. Huge empty area beside the hero headline.
2. Categories are only a plain list in the sidebar, which is easy to miss.
3. Every card looks the same: a big flat color block with a silhouette, name, and city. No info, no hierarchy.
4. Filters (search / location) scroll away; the city list is a long wall of chips.
5. Grid feels monotonous; nothing breaks the rhythm.

## New layout (top → bottom)

### 1. Hero — 2 columns
- **Right column**: breadcrumb (البداية › المؤثرين), H1 "كل **النجوم** / بمكان واحد" (keep the word-by-word reveal + gold highlighter on النجوم), the existing subtitle, then a **stats row**: `[العدد] مبدع موثّق` | `٧ مجالات` | live green dot + `[العدد] متاح هذا الأسبوع`. Stats come from the API (count of creators, count of available).
- **Left column (fills the empty space)**: an animated **deck of 3 featured creator cards** (280px wide, portrait 300px, name + verified + city + arrow button, tags "التخصص" and "● متاح").
  - Cards shuffle positions every 3.5s in a 10.5s loop: front (rotate −3°, scale 1) → back-left (translate −120px/34px, rotate −13°, scale .86, opacity .75) → back-right (translate 120px/34px, rotate 11°, scale .86) → front. Easing `cubic-bezier(.7,0,.2,1)`. Each card has animation-delay 0 / −3.5s / −7s.
  - Two floating badges: cream "✦ مبدعين الأسبوع" bottom-right, gold "+ حجز خلال دقائق" top-left (gentle float ±18px).
  - A big slowly spinning dashed circle behind.
  - Featured creators = first 3 from an API "featured" flag, or the top 3 by rating.
  - Hidden below 960px.

### 2. Category rail (replaces the sidebar category list)
Horizontal, scroll-snap row of big tiles (200×176px, radius 26px), one per category. Each has an icon box (52px), a name, and a count:
| Key | Label | Count | Icon |
|---|---|---|---|
| all | كل المجالات | total creators | 4-square grid |
| model | المودل والأزياء | ١١ تخصص | hanger |
| photo | التصوير والإنتاج | ١٢ تخصص | camera |
| design | الجرافيك والتصميم | ١٠ تخصص | pen tool |
| audio | الصوت والإنتاج | ٩ تخصص | microphone |
| mkt | التسويق والإعلانات | ١٠ تخصص | megaphone |
| tech | الإنتاج والدعم الفني | ١٠ تخصص | clapperboard |
| influ | المؤثرين وصناعة المحتوى | ٩ تخصص | user |

(Use my real category list and counts from the DB; the table is just the current content.)
- Big outlined number (١،٢،٣…) in the bottom-left corner of each tile (`-webkit-text-stroke`).
- Hover: lift 6px, border turns gold.
- **Active**: gold fill wipes up from the bottom (`::before` translateY 101% → 0, 0.55s), text turns dark, icon box turns ink.
- Each tile is a `<button aria-pressed>` and filters the grid.
- Each tile animates in as it scrolls horizontally into view (scale .86 → 1, rotate −2.5° → 0).

### 3. Sticky toolbar (sticks under the navbar, `top: 80px`)
Glass bar `rgba(14,13,18,.86)` + blur 16px, top/bottom hairline. Contains:
- Search pill (flex-grow) with icon, input "ابحث باسم المؤثر أو الموهبة…", and a gold "ابحث" button inside the pill.
- Location segmented control: **في كل مكان / داخل العراق / خارج العراق** (existing filter).
- Sort select: الأكثر طلباً / الأحدث / الأعلى تقييماً.
- View toggle (icon segmented): grid / list.

### 4. Body — sidebar 290px + results
**Sidebar** (sticky `top: 176px`), split into 3 small cards (radius 26px) instead of one long panel:
1. **الفلاتر** + "مسح الكل" link, with 2 switch toggles (role="switch", 48×28 pill, knob slides, gold when on):
   - موثّق فقط: "حسابات مراجَعة من فريقنا"
   - متاح هذا الأسبوع: "يقبل حجوزات جديدة"
2. **المدينة**: custom checkbox rows (22px rounded box → gold with check) for the **top 6 cities** with counts on the left, then a "عرض كل المحافظات +" link that expands the rest (replaces the wall of city chips).
3. **المنصة**: chips with a colored dot (Instagram pink, TikTok mint, YouTube red, Behance blue), then **الميزانية** from/to inputs.

**Results header**: big "{n} نتيجة" (Alexandria 26px/900, the word نتيجة in grey), the current category name below it, and on the left the **active filter chips** (gold, each with ✕ to remove that filter).

**Grid view**: 3 columns, gap 20px, cards pop in with a 60ms stagger.
- **Item 1 = featured wide card** (spans 2 columns; only when there are more than 3 results): image left half (min-height 380px) with a gold badge "✦ مختار الأسبوع". Right half: specialty + city tags, name 34px with verified badge, short bio (`[نبذة]`), a row of 3 portfolio thumbnails, and buttons "احجز تعاون" (gold, magnetic) + "شاهد الملف".
- **Normal creator card** (replaces the current flat card):
  - Portrait 4:4.4 with the real photo (`object-fit: cover`), dark bottom scrim, specialty tag top-right, **save/heart button** top-left (44px glass circle → gold when saved; a separate `<button>`, not inside the link), "● متاح" tag bottom-right if available.
  - **Hover**: 3D tilt (±6°) + glare, photo zooms 1.07, and a **strip of 3 portfolio thumbnails slides up** at the bottom of the image.
  - Body: name + verified badge (only if verified), "📍 city · platform" line with a pin icon, 2 skill chips (small outlined pills), then a footer row "يبدأ من **[السعر]**" + small ghost "احجز" button.
- **Promo card** inserted after the 4th card: gold card "للمبدعين / انت مبدع؟ مكانك هنا." + dark button "انضم مجاناً" linking to the join page, with a big spinning sparkle star in the corner.
- Below 960px: 1 column; the featured card stops spanning.

**List view** (when toggled): rows with an 84px rounded photo, name + specialty tag, "city · platform · category", price, and an arrow button. Hover: border turns gold and the row slides 6px.

**Empty state**: dashed card, gold sparkle icon, "ما لكينا أحد بهذي الفلاتر", "مسح الفلاتر" + "اطلب اقتراحات" buttons.

**Pagination**: replace numbered pages with a thin gold progress bar + "عرضنا X من [العدد]" + a magnetic "عرض المزيد" button (load more, using my existing pagination API).

### 5. Bottom CTA
Cream (paper) panel radius 40px with a zoom-in-on-scroll effect: "ما تعرف منو تختار؟" / "احچيلنا عن حملتك ونرشّح لك أنسب المبدعين خلال ٢٤ ساعة." + dark magnetic button "اطلب ترشيحات".

## Accessibility & QA
- All toggles are real `<button>` elements with `aria-pressed` / `role="switch"` + `aria-checked`; icon-only buttons have `aria-label`.
- Contrast ≥ 4.5:1 (grey captions `#8A859B` on `#17151E` pass).
- Works at 375px with no horizontal page scroll; the category rail scrolls on its own.
- The URL keeps the filter state (category, location, city, verified, available, view) as query params, if my app already does that.
- No console errors; existing filters return the same results as before.

When finished, list the files you changed and any TODO placeholders left for me.
