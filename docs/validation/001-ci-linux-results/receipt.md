# Exact-head CI decision: 27da659c

Head: 27da659c650a23005c9f38ce27be5ef608672843. PR4 remains open against main; no merge. Evidence read from GitHub after the T3 completion event, not a manual rerun or polling loop.

| Evidence | Pull request | Push |
| --- | --- | --- |
| Run / verify job | 37710835037 / 113096115963 | 37710829782 / 113096099374 |
| Conclusion | success | success |
| Root graph | 20 successful / 20 | 20 successful / 20 |
| Unit reporter | 89 files / 500 passed | 89 files / 500 passed |
| Original integration | 277 pass / 2 skip / 0 fail; 2119 assertions, 124 files, 269.17s | 277 pass / 2 skip / 0 fail; 2119 assertions, 124 files, 276.51s |
| Original latest-generation case | pass, 46206.51ms | pass, 35568.09ms |
| Original provisioning case | pass, 3049.95ms | pass, 3362.83ms |
| Browser | 14 pass / 0 fail; 126 assertions, 11 files, 62.68s | 14 pass / 0 fail; 126 assertions, 11 files, 61.38s |
| Failure-only diagnostic step | skipped | skipped |
| Diagnostic upload step | skipped | skipped |
| GitHub artifact inventory | total_count 0, artifacts [] | total_count 0, artifacts [] |

Both jobs also report successful frozen install, build-cache output restoration, Chromium install, and provider-scope reporting. Original integration and packed Bun/Node consumer step succeeded. Integration Turbo reports 2 successful tasks with 1 cached; browser graph 9 successful tasks. Counts above preserve test reporter output rather than implying every graph task was uncached.

Two integration skips remain explicit: schema-only baseline adoption and pooler cancellation/lock release. They are not successful test evidence.

The failure-only condition was false because original integration passed. Therefore no diagnostic selected-case execution, validated trace payload, source/dist restoration audit, or supervisor-owned descendant audit was produced. Those statuses are NOT RUN / UNVERIFIED, not zero-child or successful-restoration claims. GitHub's ordinary container-stop step succeeded, which is distinct from supervisor cleanup proof.

Decision: exact-head ordinary PR CI is green. Both prior 0dbb integration reds, earlier 142 startup reds, R1/R2 supervisor rejects and their corrections remain retained. This nonreproduction with no live source overlay does not establish a timeout cause or fix. Linux pidfd/subreaper/restoration/upload remain unverified. Provider reporting explicitly limits these checks to local PostgreSQL/package/browser; Neon acceptance is separate, and no provider operation occurred.

Raw evidence: the two .log files, corresponding .jobs.json and .artifacts.json alongside this receipt. No local runtime commands, tests/build/types/lint/DB probes or diagnostic execution occurred while ROOT held the local window. Temporary diagnostic workflow remains on the PR; no unrequested removal commit or new CI attempt was made.
