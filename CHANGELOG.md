# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-07-19

### Added
- Deterministic, fully local illustrative responses: prompts are classified
  into explanation, creative writing, code, business planning, visual design
  or a general fallback, and the Generation and Completion scenes now stream
  a short response relevant to the visitor's actual prompt, labelled
  "Illustrative response — generated locally for this demonstration."
  No network calls, transmission, storage or analytics.
- Persistent journey controller with current scene number, pause/resume,
  skip-to-next-scene and restart — keyboard operable, with mobile safe-area
  positioning.
- "Model only" capability card in the Tool Selection scene, lit whenever a
  prompt needs no external tools.
- Animation loops now also pause when the browser tab is hidden (previously
  only when a scene was off-screen or reduced motion was set).
- Project meta files: MIT `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md` and
  this changelog.

### Changed
- Scene 8 renamed from "Reasoning" to "Inference and selection", with new
  explanatory text: "At each step, the model scores possible continuations
  and selects what comes next."
- Final statement now reads: "Every response begins with tokens and
  inference. Depending on the request, context, tools, planning and
  safeguards may also shape the result."
- Capability routing corrected: Conversation and the model itself are the
  only defaults. Search activates only for current information, research or
  factual lookup; Uploaded Files/Documents only when a document or upload is
  mentioned; Memory only when prior context is explicitly referenced.
- The landing prompt is now a real, focusable text input occupying the
  visible prompt area (native emerald caret while typing, block cursor while
  idle), replacing the visually hidden input. The global pointerdown/keydown
  focus-forcing handlers were removed.

## [1.0.1] — 2026-07-19

### Changed
- Removed the infinite glow animation on the winning branch path
  (continuous full-viewport SVG repaints; settled frame rate doubled in
  software rendering).
- Raised the faintest text tier to meet WCAG AA contrast.
- Footer icons now link to the author's GitHub and LinkedIn profiles.

### Added
- Open Graph / Twitter card metadata and a social preview image.

## [1.0.0] — 2026-07-18

### Added
- Initial release: ten-scene interactive journey (prompt arrival,
  tokenisation, understanding, planning, context, tool selection, safety,
  reasoning, generation, completion) in dependency-free vanilla HTML, CSS
  and JavaScript with canvas and SVG visualisations, reduced-motion support
  and responsive layout.
