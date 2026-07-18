# Inside the Prompt

An open-source, single-page interactive visualisation exploring what happens
between pressing **Enter** on a prompt and receiving an AI-generated response.

Type anything on the landing screen and press Enter to begin a cinematic,
ten-scene journey:

1. **Prompt Arrival** — your words race through a fibre-optic tunnel
2. **Tokenisation** — the prompt explodes into floating tokens
3. **Understanding** — a neural network lights up related concepts
4. **Planning** — an AI operations centre hands work between stages
5. **Context** — only the relevant context sources illuminate
6. **Tool Selection** — only the required tools activate
7. **Safety** — the prompt passes through transparent guardrail layers
8. **Reasoning** — many candidate continuations fade to one bright path
9. **Generation** — the answer streams in, one token at a time
10. **Completion** — back to the chat, answer waiting

Built to educate developers, students and anyone curious about AI — a museum
exhibit, not a marketing page.

## Running it

No build step, no backend, no dependencies:

```sh
# any static file server works
npx serve .
# or simply open index.html in a browser
```

## Tech notes

- Vanilla HTML / CSS / JS — three files, zero dependencies
- Canvas particle field + fibre tunnel, generated SVG for the neural network,
  pipeline connectors and branching paths
- Scene animations are driven by `IntersectionObserver` and only run while
  visible; canvas loops pause off-screen
- Respects `prefers-reduced-motion` (static frames, instant text, no loops)
- Responsive from mobile to desktop; the prompt's content shapes the token
  cloud, context sources and tool selection
