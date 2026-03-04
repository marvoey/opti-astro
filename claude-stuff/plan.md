Plan to implement                                                                                        │
│                                                                                                          │
│ Plan: Dell Laptops Listing Page                                                                          │
│                                                                                                          │
│ Context                                                                                                  │
│                                                                                                          │
│ Create a high-fidelity static Astro page replicating the Dell laptops category page                      │
│ (www.dell.com/en-us/shop/dell-laptops/scr/laptops). The page must be completely self-contained — no      │
│ dependency on the project's TailwindCSS, Layout components, or any other project utilities.              │
│                                                                                                          │
│ File to Create                                                                                           │
│                                                                                                          │
│ src/pages/(dell)/shop/dell-laptops/index.astro                                                           │
│                                                                                                          │
│ Approach                                                                                                 │
│                                                                                                          │
│ Single .astro file with:                                                                                 │
│ - All HTML structure inline                                                                              │
│ - All CSS in a <style is:global> block (scoped to page via .dlp-* prefix classes)                        │
│ - All interactivity (image carousel, filter accordion, FAQ toggle) in a <script> block                   │
│ - Dell CDN images (//i.dell.com/...) used directly from the source HTML                                  │
│ - No imports from project source                                                                         │
│                                                                                                          │
│ Page Sections (in order)                                                                                 │
│                                                                                                          │
│ 1. <head> — meta, title, self-contained reset + page styles                                              │
│ 2. Header — Dell blue bar: logo, nav links (Deals, Products, Solutions, Services, Support), search,      │
│ account, cart icon                                                                                       │
│ 3. Promo strip — thin blue bar "Premier | Sign in for business pricing"                                  │
│ 4. Breadcrumb — Home › Laptop Computers                                                                  │
│ 5. Hero banner — background image from Dell CDN, "Laptop Computers" h1, subtitle, CTA button, category   │
│ tabs row (All Laptops / Personal / Professional / Workstations / Gaming / Education)                     │
│ 6. Main content row (CSS Grid 2-col: 240px sidebar + 1fr)                                                │
│   - Filter sidebar — collapsible accordion sections (Product Line, Processor Brand, OS, RAM, Storage,    │
│ Screen Size, GPU, Weight)                                                                                │
│   - Product area                                                                                         │
│       - Sort bar (result count + sort dropdown)                                                          │
│     - Product grid (2-col grid, 12 cards)                                                                │
│     - Each card: image carousel + title/specs/price/CTA                                                  │
│ 7. Showcase banners — 2 dark-navy side-by-side promo blocks                                              │
│ 8. SEO text + FAQ — accordion                                                                            │
│ 9. Pagination — prev/next + per-page select                                                              │
│ 10. Footer — 4-column link grid + legal                                                                  │
│                                                                                                          │
│ Product Data (12 cards, hardcoded)                                                                       │
│                                                                                                          │
│ All data extracted from source HTML:                                                                     │
│ - Dell 16 Plus (DB16250) — $699.99 — 4.5★ 3,199 reviews — Hot Deal badge                                 │
│ - Dell 14 Plus (DB14250) — $649.99 — 4.4★ 1,182 reviews — Hot Deal badge                                 │
│ - XPS 16 (DA16260) — $1,549.99 — 4.6★ 3,151 reviews                                                      │
│ - XPS 14 (DA14260) — $1,449.99 — 4.5★ 3,199 reviews                                                      │
│ - Dell 15 (DC15250) — $979.00 — 4.5★ 783 reviews                                                         │
│ - Dell Pro 16 (PC16250) — $799.99 — 4.3★ 370 reviews                                                     │
│ - Dell Pro 16 Plus (PB16250) — $1,399.00 — 4.5★ 783 reviews                                              │
│ - Dell Pro 14 Plus (DB14255) — $749.99 — 4.5★ 285 reviews                                                │
│ - Dell Pro Max 16 (MC16250) — $1,694.27 — 4.4★ 591 reviews                                               │
│ - Dell 14 (DB16255) — $449.99 — 4.1★ 71 reviews                                                          │
│ - Alienware 16X Aurora (AC16251) — $1,649.99 — 4.3★ 370 reviews                                          │
│ - Alienware 16 Aurora (AC16250) — $1,099.99 — 4.6★ 3,151 reviews                                         │
│                                                                                                          │
│ Style Approach                                                                                           │
│                                                                                                          │
│ - CSS custom properties for Dell brand colors                                                            │
│ - .dlp- prefix on all classes to avoid any cascade conflicts                                             │
│ - Flexbox/Grid layout — no external CSS framework                                                        │
│ - Dell brand colors: primary #0672CB, dark #0E2141, text #444, border #DDD, bg #F5F5F5                   │
│ - Responsive: sidebar collapses on mobile, product grid goes 1-col                                       │
│                                                                                                          │
│ Interactivity (vanilla JS in <script>)                                                                   │
│                                                                                                          │
│ - Image carousel prev/next on each product card                                                          │
│ - Filter accordion open/close                                                                            │
│ - FAQ accordion                                                                                          │
│ - Category tab switching (active state)                                                                  │
│ - "Show more / Show less" for SEO text                                                                   │
│                                                                                                          │
│ Verification                                                                                             │
│                                                                                                          │
│ - Run yarn dev and visit /shop/dell-laptops                                                              │
│ - Visually compare against screenshot at /home/marvin/Opps/Dell/dell-rebuild/fetched-content/www.dell.co │
│ m/en-us/shop/dell-laptops/scr/laptops/screenshot.png       