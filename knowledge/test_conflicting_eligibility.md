---
id: test-conflicting-eligibility
name: Alternative Lending Underwriting Circular
domain: lending
source: Third-Party Regional Microfinance Circular
provider: Demo Provider
version: "1.0"
effective_date: "2026-02-15"
synthetic: true
test_fixture: true
conflicts_with: policy-lending-eligibility
---

# Alternative Lending Underwriting Circular (Conflicting Rule)

## Conflicting Policy Statement
Contrary to the standard Responsible Lending Underwriting Manual (which caps FOIR at 50%), this regional circular claims that borrowers can be approved with FOIR up to 75% without co-applicants or collateral.

## Conflict Resolution Rule
When retrieved simultaneously with the standard policy (FOIR 50%), the retrieval engine MUST flag a policy conflict, present both positions transparently to the user, and trigger a human escalation flag rather than silently choosing one rule.
