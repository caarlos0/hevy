# Hevy CLI landing page design system

## Direction

A chrome training robot on a cobalt-accented lifting rack turns the hero into a physical expression of the CLI: precise, strong, and engineered rather than dashboard-like. The rest of the site keeps the command-surface language—dark steel surfaces, cobalt command marks, progressive data, and condensed athletic typography. It should feel built for lifting and shell work, never like a generic SaaS dashboard.

## Principles

1. Training is the visual source. Use plates, set rows, workload charts, session sheets, and programming language.
2. CLI behavior is the product. Commands, stdout, stderr, exit status, JSON, pipes, and local validation carry the story.
3. Show the translation. Terminal data and training surfaces should appear as two views of one system.
4. Stay community-built. Do not copy the proprietary Hevy interface or imply affiliation.
5. Earn every claim. Real commands and verified behaviors only. Label invented workout values and response examples as illustrative.

## Tokens

- Base steel: `#090a0b`
- Raised steel: `#121416`
- Primary text: `#f5f4ee`
- Muted text: `#a5a9ad`
- Rule: `#303438`
- Command cobalt: `#1c4eff`
- Readable cobalt text: `#4d75ff`
- Terminal: `#0c0d0e`
- Validation green: `#a8dc54`
- Display: Barlow Condensed, 800–900
- Body: Barlow, 400–700
- Code: Roboto Mono, 400–600

Fonts are self-hosted as WOFF2 files in `site/assets` so the deployed artifact has no font CDN dependency.

## Layout and components

- Maximum content width: 1440px.
- Desktop hero pairs the decisive headline and install action with a chrome robot and rack; the motion is decorative and the full product story remains in text.
- The rack is structural chrome, with cobalt telemetry, command frames, and hard-edged controls carrying the visual system beyond the hero.
- Sections use strong horizontal rules and alternating steel, cobalt, and near-black fields rather than floating cards.
- Data surfaces use compact mono labels, ruled rows, restrained shadows, and cobalt as a functional signal.
- Primary controls are rectangular and high contrast. No ornamental pill controls.
- Mobile collapses every two-column narrative into one column and contains all decorative overflow within its section.

## Interaction

- Copy controls use the Clipboard API with visible success feedback and text-selection fallback.
- Native anchor navigation and visible keyboard focus rings.
- The command ticker uses two identical full-viewport belts for a continuous edge-to-edge loop with no empty phase or visible reset.
- The articulated SVG squat keeps the feet planted while knees bend. Barbell, hands, arms, torso, and head live inside one `lifted-load` SVG group, so the bar and both grips descend as a mechanically locked unit through every rep. Motion only runs while its hero is visible and the document is not hidden.
- Motion is disabled with `prefers-reduced-motion`; the neutral robot pose remains visible.
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
