# @coyote-force/ui

Coyote Force Design System — shadcn/ui primitives, design tokens, and utilities in a single consumable package.

- Docs & component gallery: [design.coyoteforce.com](https://design.coyoteforce.com)
- Source: [coyote-force/design-system](https://github.com/coyote-force/design-system) (`packages/ui`)
- License: MIT

## Install

```sh
npm i @coyote-force/ui
# peer deps if not already present:
npm i react react-dom tailwindcss shadcn
```

Requires React 18.3+ / 19, Tailwind CSS v4, and shadcn 4.

## Set up

Import the stylesheet once at your app root:

```ts
import "@coyote-force/ui/styles";
```

This loads the OKLCH design tokens, Tailwind v4 base layer, and the `.prose` typography helper. It does **not** load fonts — see [Fonts](#fonts). Dark is the default; add `class="light"` for the paper theme.

### "use client" boundary

The entire bundle is marked `"use client"`. In Next.js App Router you can import from `@coyote-force/ui` anywhere, but the code is always bundled as client. If you need a server-safe `cn`, vendor it from `./utils`.

## Use

```tsx
import { Button, Card, cn } from "@coyote-force/ui";

export function Example() {
  return (
    <Card className={cn("p-6")}>
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Cancel</Button>
    </Card>
  );
}
```

### Button variants

`primary` (default, gold lock) · `secondary` (outlined) · `secondary-green` (filled olive) · `secondary-coral` (filled khaki) · `ghost` · `destructive` · `destructive-solid` · `link`

### Dark mode

Dark is the default. Add `class="light"` to `<html>` for the paper theme.

## Subpath exports

| Import | Purpose |
| --- | --- |
| `@coyote-force/ui` | All non-chart components + `cn` |
| `@coyote-force/ui/chart` | Chart primitives (pulls in `recharts` — keep separate) |
| `@coyote-force/ui/utils` | `cn` and other utilities, no React |
| `@coyote-force/ui/styles` | Tokens, Tailwind base, `.prose` (CSS side-effect import) |
| `@coyote-force/ui/fonts` | Inter Tight / Fragment Mono via Google Fonts |
| `@coyote-force/ui/components.json` | shadcn CLI config (for `npx shadcn add` in consumers) |

## Fonts

`./styles` does not load fonts. UNITED Sans is commercial — never ship the OTFs in this package. Docs self-host display. Consumers supply `--font-display`.

**Option A — `next/font` (recommended for Next.js):**

```ts
import { Inter_Tight, Fragment_Mono } from "next/font/google";

const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-sans-loaded" });
const mono = Fragment_Mono({ subsets: ["latin"], weight: "400", variable: "--font-mono-loaded" });
```

Attach the variables to `<html>`:

```tsx
<html className={`${interTight.variable} ${mono.variable}`}>
```

**Option B — blocking Google Fonts `@import` (non-Next.js):**

```ts
import "@coyote-force/ui/fonts";
```

## Icon-only buttons

Always pass `aria-label`:

```tsx
<Button size="icon" variant="ghost" aria-label="Delete item">
  <TrashIcon />
</Button>
```

## Links

- Docs site: [design.coyoteforce.com](https://design.coyoteforce.com)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)
- Issues: [github.com/coyote-force/design-system/issues](https://github.com/coyote-force/design-system/issues)
