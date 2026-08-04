# Hevy CLI landing page design system

## Direction

A strength-programming ledger turned into a command surface. The site combines ruled training sheets, iron-black terminal windows, cobalt command marks, progressive data, and condensed athletic typography. It should feel built for lifting and shell work, never like a generic SaaS dashboard.

## Principles

1. Training is the visual source. Use plates, set rows, workload charts, session sheets, and programming language.
2. CLI behavior is the product. Commands, stdout, stderr, exit status, JSON, pipes, and local validation carry the story.
3. Show the translation. Terminal data and training surfaces should appear as two views of one system.
4. Stay community-built. Do not copy the proprietary Hevy interface or imply affiliation.
5. Earn every claim. Real commands and verified behaviors only. Label invented workout values and response examples as illustrative.

## Tokens

- Paper: `#f3f1ed`
- Deep paper: `#e7e3dc`
- Ink: `#11100f`
- Muted ink: `#5f5b55`
- Rule: `#c9c3ba`
- Command cobalt: `#1c4eff`
- Terminal: `#171717`
- Validation green: `#a8dc54`
- Display: Barlow Condensed, 800–900
- Body: Barlow, 400–700
- Code: Roboto Mono, 400–600

Fonts are self-hosted in `site/assets` so the deployed artifact has no font CDN dependency.

## Layout and components

- Maximum content width: 1440px.
- Desktop hero: decisive headline and actions opposite an overlapping terminal/workout-sheet composition.
- Sections use strong horizontal rules and alternating paper, cobalt, and ink fields rather than floating cards.
- Data surfaces use compact mono labels, ruled rows, restrained shadows, and cobalt as a functional signal.
- Primary controls are rectangular and high contrast. No ornamental pill controls.
- Mobile collapses every two-column narrative into one column and contains all decorative overflow within its section.

## Interaction

- Copy controls use the Clipboard API with visible success feedback and text-selection fallback.
- Native anchor navigation and visible keyboard focus rings.
- Motion is limited to the command ticker and disabled with `prefers-reduced-motion`.
- No critical information depends on animation or hover.

## Accessibility and content

- Semantic header, navigation, main, sections, and footer.
- Skip link, descriptive link text, button labels, and chart accessible name.
- Strong text contrast on all major surfaces.
- API keys are never requested or handled by the page.
- Illustrative workout and response data is labeled.
- Footer states that the project is not affiliated with or endorsed by Hevy Studios.

## Responsive verification

The artifact is checked at 320px, 390px, 428px, and 1440px. Document and body scroll widths must equal viewport width on mobile. The install action, headline, supporting copy, and hero product composition remain legible without horizontal clipping.
