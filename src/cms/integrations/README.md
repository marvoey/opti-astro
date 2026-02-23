# CMS Integrations

Components in this directory are used in preview/debug contexts to surface CMS and experimentation metadata. They are not CMS content types and are not registered in Optimizely.

---

## `CmsToolbarPanel.astro`

A display panel that mimics the Optimizely CMS global toolbar. Used in preview/debug contexts to surface CMS metadata controls.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `variations` | `string[]?` | List of available variation names. Defaults to `['Original']`. |
| `selectedVariation` | `string?` | Currently active variation. Defaults to the first item in `variations`. |

**Extending with more controls:**

Place additional control components inside the default slot — they will be laid out inline in the toolbar:

```astro
<CmsToolbarPanel variations={["Original", "Variant A"]} selectedVariation="Original">
  <!-- Add more toolbar controls here -->
</CmsToolbarPanel>
```

The `cms-add-variation` CustomEvent is dispatched on the root element when the "Add variation" item is clicked.

---

## `ContentInfo.astro`

A simple display panel that renders metadata about the currently previewed content item.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `version` | `string?` | Content version identifier |
| `locale` | `string?` | Active locale code |
| `context` | `string?` | Rendering context (e.g. preview, edit) |
| `types` | `string[]?` | List of content type names for the item |

**Usage:** Intended to be embedded inside a debug/preview panel. Renders a bordered section with labeled rows for each piece of metadata. Falls back to `'N/A'` or `'Loading...'` when values are absent.

---

## `PreviewDebugPanel.astro`

A collapsible debug banner rendered at the top of preview pages. It integrates with **Optimizely Web Experimentation (WebEx)** to show experimentation context alongside CMS content metadata.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `contentKey` | `string` | Unique key for the content item being previewed |
| `version` | `string?` | Content version identifier |
| `locale` | `string?` | Active locale code |
| `context` | `string?` | Rendering context |
| `types` | `string[]?` | List of content type names |
| `contentPayload` | `ContentPayload` | Full content payload used for GraphQL lookups |

**Behavior:**

1. Reads `OptiWebProjectId` from `SiteSettings` (looked up by hostname) to link the page to an Optimizely Web Experimentation project.
2. If `OPTIMIZELY_WEBEX_API_TOKEN` is set and a project ID is found, it initialises an `OptimizelyClient` and fetches:
   - Project details (name, ID)
   - Campaign count
   - Audience list (with deep-links into the Optimizely app)
   - Page list — filtered to pages whose URL conditions match the current content URL
3. The panel is collapsed by default; clicking **Show Details** expands it via AlpineJS (`x-collapse`).
4. Gracefully degrades: missing token or failed API calls surface informational messages rather than errors.

**Environment variable required:**

```
OPTIMIZELY_WEBEX_API_TOKEN=<your-token>
```

**Dependencies:**
- `@optimarvin/opti-webex-api-client` — typed WebEx REST client
- `src/lib/page-conditions` — `filterMatchingPages` utility for URL matching
- `src/graphql/getSdk` — Optimizely Graph SDK
