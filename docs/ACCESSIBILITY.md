# Accessibility

## Current state

The app uses native controls in places but has inconsistent accessible names, emoji-dependent meaning, modal focus behavior and keyboard semantics. There is no automated accessibility test suite or browser evidence from the first audit because browser control was unavailable.

## Target requirements

- Semantic landmarks and heading hierarchy.
- Accessible names for icon-only controls and audio actions.
- Visible focus with sufficient contrast.
- Keyboard-complete navigation and dialog interaction.
- Focus trapping/return and escape handling for dialogs.
- Screen-reader announcements for loading, errors, generation completion and review results.
- Reduced-motion support.
- Text alternatives for color-coded grammar gender.
- Touch targets suitable for mobile use.
- No essential information conveyed only through emoji or color.

## Verification

Use automated checks as a baseline, then keyboard and screen-reader walkthroughs at critical flows: sign-in, generation, deck editing, review, tutor, import and profile.

## Open decisions

- Supported assistive-technology/browser matrix.
- Whether review feedback should use live regions or an explicit result panel.
- Language metadata strategy for mixed English/German content.
