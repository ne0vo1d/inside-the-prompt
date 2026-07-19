# Contributing to Inside the Prompt

Thanks for your interest in improving the project! Contributions of all kinds
are welcome — bug fixes, accessibility improvements, performance work, copy
edits and new scene ideas.

## Ground rules

The project has a deliberately small footprint. Please keep these invariants
intact in any pull request:

- **Zero dependencies.** Vanilla HTML, CSS and JavaScript only — no frameworks,
  build steps, package managers or CDN assets.
- **No data leaves the page.** No network calls, no analytics, no storage of
  visitor input. Everything (including the illustrative responses) is computed
  locally and deterministically.
- **GitHub Pages compatible.** The site must work served as static files from
  the repository root, including under a sub-path.
- **Reduced motion is a first-class experience.** Every scene must remain
  legible and complete with `prefers-reduced-motion: reduce` — static frames
  and instant text, never missing content.
- **Performance.** Animation loops must stop when their scene is off-screen or
  the tab is hidden. Avoid indefinitely animated CSS `filter`s and other
  continuous full-viewport repaints.
- **Design language.** Matte black, soft emerald and violet accents, glass
  panels, restrained typography. New visuals should feel like part of the
  same exhibit.

## Developing locally

No setup required:

```sh
git clone https://github.com/ne0vo1d/inside-the-prompt.git
cd inside-the-prompt
npx serve .          # or python3 -m http.server, or open index.html directly
```

## Submitting changes

1. Fork and create a topic branch.
2. Make your change, keeping the invariants above.
3. Test on desktop and a narrow (~390px) viewport, and with reduced motion
   enabled, watching the console for errors.
4. Open a pull request describing what changed and why. Screenshots or
   recordings are appreciated for visual changes.

For larger ideas (new scenes, structural changes), please open an issue first
so we can discuss direction before you invest time.
