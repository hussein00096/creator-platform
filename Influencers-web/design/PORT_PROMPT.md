# PORT PROMPT — copy the Bareeq design EXACTLY (pixel-perfect, with all animations)

> Give this file to Claude in VS Code. The folder `design/reference/` contains the **finished design as working HTML pages**.
> Open `design/reference/index.html` in your browser to see the exact target.

## The problem we are fixing
The previous attempt was built from a text description, so sizes, spacing, card styles and animations came out different, and much of the motion is missing.
**This time, do not design anything. Port the reference files 1:1.**

## Source of truth
```
design/reference/
  index.html          → Home            (/)
  creators.html       → Creators list   (/creators)
  profile.html        → Creator profile (/creators/[id])
  booking.html        → Booking wizard  (/book/[id])
  brands.html         → For brands      (/brands)
  join-creator.html   → Join as creator (/join)
  auth.html           → Login / register
  dashboard.html      → Brand dashboard (/dashboard)
  about.html          → About & contact (/about)
  assets/site.css     → ALL shared styles + keyframes (global stylesheet)
  assets/motion.js    → ALL JS motion: cursor, magnetic buttons, 3D tilt, scroll-reveal fallback, slider buttons, Lenis smooth scroll
```
Each page also has a page-specific `<style>` block and a Google Fonts `<link>` in its `<head>`. Keep both.

## Hard rules (follow strictly)
1. **Copy `assets/site.css` into the project unchanged** and import it globally (e.g. `app/globals.css` → `@import` or paste it in). Do not convert it to Tailwind. Do not rename classes. Do not "clean up" values.
2. **Keep every class name and every inline style value exactly** (px, clamp(), colors, radius, gaps, aspect-ratio, animation-delay). If the project uses JSX, convert `style="a: b; c: d"` to `style={{ a: 'b', c: 'd' }}` with identical values. Convert `class` → `className`, `for` → `htmlFor`, and SVG attrs to camelCase (`stroke-width` → `strokeWidth`, etc.).
3. **Keep the DOM structure the same.** The animations depend on nesting. For example, `.ln > .w` is the word reveal, `.ccard .ph .sil` is the hover zoom, and `.tilt::after` is the glare. Don't remove wrapper `<span>`/`<div>` elements.
4. **Put page-specific `<style>` blocks in a CSS file per page** (or a CSS module imported **globally** for that page). Keep the selectors and values the same.
5. **Port `assets/motion.js` as one client-side effect** that runs on every route change, for example a `'use client'` `<Motion />` component in the root layout with `useEffect(() => {...}, [pathname])`. It must:
   - set `--cx/--cy` on `.bq` (custom cursor),
   - bind `.mag` (magnetic) and `.tilt` (3D tilt + glare) handlers,
   - add the `io` class + IntersectionObserver fallback when `CSS.supports('animation-timeline: view()')` is false,
   - init Lenis smooth scroll (`npm i lenis`, use the package instead of the CDN).

   Use **event delegation or re-binding after each navigation** so elements that render later still get the effects. Clean up listeners on unmount.
6. Every page's root element must be `<div class="bq">`, and the decorative elements must exist on every page: `.prog`, `.cur-ring`, `.cur-dot`, and the `.grain` SVG. Put these in the root layout once.
7. **Fonts**: load **Alexandria (500,700,800,900)** and **IBM Plex Sans Arabic (400,500,600,700)**, e.g. with `next/font/google` and the variables mapped to the same family names. `<html lang="ar" dir="rtl">`.
8. **Replace sample content with my real data** (creators, categories, cities, counts, prices, photos) using my existing APIs/state. Keep my existing logic for filters, tabs, search, auth, forms and booking. Only the markup and styles come from the reference.
   - Repeated blocks in the reference (cards, rows, chips) are one sample of a loop. Render them with `.map()` over my data using the **same markup**.
   - Interactive states shown in the reference (active chip `.on`, selected tab, open FAQ `.pl.open`) must be driven by my state using the **same class names**.
   - Photos: put `<img>` inside `.ph` with `position:absolute; inset:0; width:100%; height:100%; object-fit:cover`, and keep the `.sil` silhouette only as a fallback when there's no photo. Keep the hover zoom by giving the `<img>` the same transition as `.sil`.
9. **Do NOT**: change sizes "to look better", swap components for a UI library (shadcn/MUI), drop "decorative" elements, remove animations to "simplify", or use different colors. Accent is `#FFC23D`.

## Work order
1. Copy `site.css`, set up fonts, root layout (`.bq` wrapper + cursor/grain/progress elements), and the `<Motion />` effect. **Show me, then stop.**
2. Port `index.html` → my home page. **Stop so I can compare side-by-side with `design/reference/index.html` in the browser.**
3. Then `creators.html`, then `profile.html`, and so on, one page per step.
4. After each page, self-check against the reference:
   - same font sizes/weights, paddings, radii, gaps (use DevTools on both)
   - hover a creator card: it tilts, shows the glare, the photo zooms, and the ring rotates
   - move the mouse: the custom cursor follows and grows over links and cards
   - buttons with `.mag` follow the mouse
   - scroll: the progress bar fills and sections reveal; marquees loop; the headline words rise on load
   - at 375px width there's no horizontal scroll

## If animations still don't show
- **Windows**: Settings → Accessibility → Visual effects → **Animation effects = On**. If it's off, the browser reports `prefers-reduced-motion` and the design intentionally disables all motion.
- **macOS**: System Settings → Accessibility → Display → turn **Reduce motion** off.
- Check that `site.css` actually loads (DevTools → Network) and that no other global CSS (Tailwind preflight, a reset) overrides `animation`, `transition` or `transform` on these classes.
- Check that the `<Motion />` effect runs (no hydration errors in the console).

When done with each step, list the files changed and anything you couldn't match exactly.
