---
name: deutsch-hub-design
description: Design or evolve Deutsch Hub UI and interaction patterns using its calm, premium language-learning direction, with accessibility and browser validation.
---

# Deutsch Hub design

Use this skill for product UX, information architecture, component design or visual implementation in Deutsch Hub.

## Product direction

The interface should feel calm, intelligent, warm, focused and intentional. Favor hierarchy, rhythm, readable content and confidence-building feedback. Avoid gradients as the primary visual language, glassmorphism, excessive cards or pills, emoji-heavy navigation, random colors, decorative motion and large unused areas.

## Process

1. Inspect the existing feature, data states and responsive constraints before proposing changes.
2. Define the user goal, primary action, secondary actions and failure/empty/loading states.
3. Express the design through semantic tokens and reusable primitives.
4. Preserve existing behavior unless the request explicitly changes it.
5. Implement the smallest coherent slice.
6. Render and inspect mobile and desktop states, then check keyboard and accessibility behavior.
7. Iterate from observed evidence, not visual preference alone.

External research tools such as Figma or Mobbin are optional inputs, not dependencies. Extract interaction principles; do not copy products or import their visual language wholesale.

## Required checks

- Light and dark themes when supported by the feature.
- Loading, empty, error, success and offline states.
- Keyboard focus, dialog behavior, accessible names and contrast.
- Narrow mobile, wide mobile/tablet and desktop widths.
- Reduced-motion behavior and touch target size.

Do not declare a UI task complete because it compiles. Use browser QA when available; if it is unavailable, state that visual validation remains outstanding.
