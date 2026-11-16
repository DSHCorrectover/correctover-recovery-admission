"""Correctover Recovery Admission - falsifiable suite (verifier + dataset).

Dataset CC0 (DOI 10.5281/zenodo.24280454), verifier code Apache-2.0.
This artifact claims executability and semantics-as-written, NOT real-world
adequacy. See HONESTY.md in the repo and VERIFIED_BY.md for attribution policy.

CLI: python3 -m recovery_admission [--tamper]
"""
from .verify_recovery import run

if __name__ == "__main__":
    run()
