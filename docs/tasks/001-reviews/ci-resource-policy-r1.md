# CI resource policy — independent source review

Task: node:delegated-task:command%3Amcp%3A583aba27-23ff-4583-add7-a3bb37e882cc%3Adelegate-task%3A001-ci-resource-policy-workflow-review-r1

Provider/model: codex / gpt-6-astra, low reasoning.

**APPROVED — exact resource-policy diff and evidence document, source only.** No actionable implementation/API/security findings.

- [ci.yml:52](.github/workflows/ci.yml#L52) adds the supported Vitest worker cap and serial Turbo execution. Installed Turbo 2.11.6 documentation and Vitest 5.0.1 source confirm their semantics. The original task selection, subsequent gates, versions, services, authentication, and deadlines remain unchanged.
- [Policy:11–15](docs/tasks/001-ci-resource-policy.md#L11) accurately describes the security/cache tradeoff: loose mode exposes inherited environment, including the disposable database URL and runner metadata. No secrets/token mapping is explicit; absence of sensitive injected values is **not proven**. Arbitrary loose environment values are not automatically cache-accounted. No concrete credential leak or incorrect cache reuse was established.
- [Policy:19–31](docs/tasks/001-ci-resource-policy.md#L19) preserves both CI reds, local evidence limits, reporter uncertainty, corrected protocol analysis, and unchanged 5000 ms testcase/strict 2000 ms shutdown contracts. It makes no demonstrated timeout-fix claim.

HEAD verified: `142883c6f94e4811cd8426e086dfaea0a5d341c7`. Both SHA-256 values matched initially and on closing recheck:

```text
workflow 60786a50329f66a2a65bc7eace1043474319ad6ec4f1aef109875055a4efd0ed
document c8b71f4b97deb3510ce51faf212e4f0c04f4e232e9efa283379d08e234b71f83
```

Only source, documentation, and retained logs were inspected. No runtime/tests/build/import/DB/network/browser operations or edits occurred. Residual risks are broader inherited-environment exposure, undeclared environment-dependent caching, and unresolved Linux startup behavior. Fresh full exact-head CI remains authoritative; this is not feature or shipping acceptance.
