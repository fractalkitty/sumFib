# sumFib

A small puzzle game — slide tiles and combine adjacent pairs whose **sum is a Fibonacci number**
(1 + 1 = 2, 1 + 2 = 3, 2 + 3 = 5, 3 + 5 = 8, …).

Vanilla HTML, CSS, and JS — no framework, no build step, ~15 KB total.

## Play

- **Desktop:** Arrow keys or WASD to slide. <kbd>R</kbd> to restart.
- **Mobile:** Swipe in any direction.
- **Best score** is remembered locally (`localStorage`).

## Accessibility

- Keyboard control + visible focus rings
- ARIA live regions announce score changes and game over to screen readers
- Skip link to jump straight to the board
- `prefers-reduced-motion` disables animations
- WCAG AA color contrast on tiles

## Layout

- `index.html` / `script.js` / `style.css` — the game
- `favicon.svg` — φ favicon
- `_headers` / `_redirects` — Cloudflare Pages security headers and route rules
- `dev/` — random-play simulator used for tuning (excluded from the public site by `_redirects`)

## License

MIT — see [LICENSE](./LICENSE).
