# Honest boundaries

What this suite does NOT claim, stated up front:

1. **Verb heuristic is a proxy.** Scope-drift statistics (reported from the
   229,827-tool census aggregation, shipped in a separate repo) flag tools whose
   descriptions contain dangerous verbs (delete/pay/admin/…) that the tool name
   does not reflect. It is a signal for prioritizing human review — not ground
   truth for authorization decisions.
2. **Sandbox egress caveat.** Endpoint-liveness numbers were probed from a
   cloud sandbox; corporate firewalls and geo-blocking depress reachable
   percentages. Treat them as lower bounds, and rerun the probe from your own
   network before citing them.
3. **Decision semantics, not a product.** The 576-vector suite proves the
   admission decision table and its independent re-derivation agree. It does
   not prove that a deployed gateway implements these semantics — that is what
   conformance testing against your deployment is for.
4. **Expected verdicts are table-generated.** The decision table produced the
   expected values; the verifier re-derives them independently. This catches
   table/checker divergence but cannot catch a shared wrong assumption — if you
   believe a verdict is semantically wrong, open an issue with the anchor id.
