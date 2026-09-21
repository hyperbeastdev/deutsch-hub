# Design system

## Current state

Visual values are mostly Tailwind utilities written directly in components. Colors and spacing are repeated locally. The app uses gradients, rounded cards, pills, emoji and shadows heavily. `App.css` contains unused Vite starter styles, and repeated card/tutor patterns are implemented in more than one place.

## Target state

Define semantic tokens for:

- canvas, surface, elevated surface, border, text, muted text and focus;
- accent, success, warning, danger and learning-state colors;
- typography scale, line heights and weights;
- spacing, radii, elevation and motion;
- light and dark theme values.

Build primitives before feature-specific composites:

`AppShell`, `Button`, `IconButton`, `TextField`, `Select`, `Dialog`, `Sheet`, `Surface`, `Progress`, `Badge`, `DeckRow`, `ReviewCard`, `EmptyState`.

## Principles

- hierarchy before decoration;
- semantic HTML and accessible names;
- visible focus and sufficient contrast;
- no unnecessary pills, gradients, glass or animation;
- touch targets and keyboard behavior are part of component contracts;
- use motion to communicate state, not to add spectacle.

## Open decisions

- Token naming convention and CSS-variable ownership.
- Whether to use a small icon library or an existing asset set.
- Theme persistence and system-theme precedence.
