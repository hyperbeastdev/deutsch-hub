# Architecture rule

- Organize new work by feature, but keep domain rules independent from React.
- Use the separation `UI → application service → domain → repository/provider adapter`.
- Introduce a boundary before moving behavior; do not combine decomposition with unrelated redesign.
- Prefer the smallest abstraction that creates a real seam for testing, migration or security.
- Decompose `App.jsx` by ownership: shell/navigation, feature views, domain logic, persistence and external providers. Move one coherent boundary at a time and preserve its public behavior.
- Firebase and Cloudflare remain adapters in the target architecture, not replacements.
