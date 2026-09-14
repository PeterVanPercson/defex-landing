# Blog UI

The site uses Django templates. The blog's animated background is a React
island; the title, links, article, and contents remain server-rendered and
readable without JavaScript. React is loaded only by the blog index.

## Paths and components

- `components/ui/background-paths.tsx`: the supplied two sets of 36 curves,
  with deterministic timing, a pause control, reduced-motion support, and
  suspension when offscreen or in a hidden tab.
- `components/ui/button.tsx`: the supplied shadcn-compatible Radix button.
- `components/ui/demo.tsx`: standalone title demo.
- `lib/utils.ts`: `cn()` for class merging.
- `frontend/styles.css`: Tailwind v4 utilities and component styles. Preflight
  is omitted so it cannot reset the Django pages.
- `static/css/blog.css`: the blog and article layout, scoped by `.blog-page`.
- `templates/landing/blog/`: server-rendered content and metadata.

`components.json` and `tsconfig.json` both map `@/components/ui` to
`components/ui` at the repository root. Keeping that directory makes the
supplied imports and future shadcn component additions resolve consistently.
TypeScript, React, Tailwind, and the required dependencies are already set up;
there is no need to scaffold another application or run `shadcn init`.

## Build

```bash
npm ci
npm run build
DEBUG=True python manage.py runserver 0.0.0.0:8000
```

Vite emits `static/blog-ui/background-paths.js` and its CSS. These built files
are committed because the existing Vercel configuration serves `static/**`
directly and does not run a frontend builder. Django/WhiteNoise and Render
also serve these assets. CI rebuilds them and checks they match the source.

After changing the component, rebuild and commit both source and output.
Bump the component asset query version in `templates/landing/blog/index.html`
for each release; bump the blog stylesheet version in both blog templates
after CSS edits. These independent versions avoid stale assets when the
deployment overrides the site's global asset version.

The article retains its existing calculator and sharing links. The duplicate
opening ring, TL;DR box, animated latch drawing, and a few redundant transition
paragraphs were removed. The hypothetical-data qualification and the stated
A1 development milestones are preserved.
