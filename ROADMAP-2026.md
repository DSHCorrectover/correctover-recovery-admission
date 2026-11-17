# Roadmap (conditional, not dated)

This is a one-maintainer project; a dated roadmap here would be a list of debts. Signals, not deadlines:

- **Second action class: delegation-chain actions** (a delegates to b; b acts) — we start when the first external re-verification exists (anyone but us running this on a repo we don't control). It reuses the authorization-binding dimensions and adds one delegation-edge dimension; the cross-product stays exhaustive within dimensions, so the result stays recomputable. Not started before that signal — an unbuilt scaffold on the Marketplace page would be the first unrecomputable thing we ship.
- **Third action class: data-exfiltration-shaped actions** — starts when the second class has an external dispute or adoption.
- **Cross-implementation verifier** — starts when someone asks for one; the semantics are deliberately simple.

Standing rule: coverage claims stay scoped to shipped classes. No unshipped class is ever named in marketing copy.
