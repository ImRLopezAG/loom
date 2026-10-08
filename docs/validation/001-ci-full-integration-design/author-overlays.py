# Artifact authoring only: reads live preimages, writes only this artifact subtree.
from pathlib import Path
import hashlib,json,difflib
root=Path.cwd(); out=root/'docs/validation/001-ci-full-integration-design'; old=root/'docs/validation/001-ci-linux-design'
m=json.loads((old/'manifest.json').read_text()); changed={}
for p,item in m['paths'].items():
 data=(root/p).read_bytes() if item['before'] else b''
 assert (hashlib.sha256(data).hexdigest() if data else None)==item['before'],p
 changed[p]=(old/'overlay'/p).read_text()
def rep(p,a,b,n=1):
 assert changed[p].count(a)==n,(p,a,changed[p].count(a));changed[p]=changed[p].replace(a,b)
p='apps/loom/src/tooling/dev/ci-trace.ts'
rep(p,'  | "watch.create"','  | "dev.credentials.restored" | "dev.recovery.write.begin" | "dev.recovery.write.end"\n  | "dev.recovery.poll" | "dev.recovery.wait.end" | "dev.recovery.settled"\n  | "watch.admitted" | "watch.error" | "revision.check" | "candidate.unchanged"\n  | "admission.begin" | "admission.install" | "admission.end"\n  | "watch.create"')
rep(p,'revision?: number; event?: string;','revision?: number; currentRevision?: number; event?: string;')
rep(p,'aborted?: boolean; pending?: boolean;','aborted?: boolean; stopped?: boolean; pending?: boolean;')
rep(p,'const instance = randomUUID();','const instance = randomUUID();\nconst surface = import.meta.url.includes("/apps/loom/src/") ? "source" : import.meta.url.includes("/apps/loom/dist/") ? "built" : "other";')
rep(p,'schema: 1, pid: process.pid, instance,','schema: 1, diagnostic: "001-full-435-r1", surface, pid: process.pid, instance,',n=3)
p='packages/e2e/integration/dev.test.ts'
rep(p,'      runtimeConnection = runtimeAddress.href;\n      await writeFile(source, expanded);\n      await until(() => running.active?.version !== second);\n      await running.settled();', '''      runtimeConnection = runtimeAddress.href;
      ciStage("dev.credentials.restored", { rootHash: ciHash(root), expectedHash: ciHash(second), activeHash: running.active ? ciHash(running.active.version) : undefined });
      ciStage("dev.recovery.write.begin", { rootHash: ciHash(root), candidateHash: ciHash(expanded) });
      await writeFile(source, expanded);
      ciStage("dev.recovery.write.end", { rootHash: ciHash(root), candidateHash: ciHash(expanded) });
      try {
        await until(() => {
          ciStage("dev.recovery.poll", { rootHash: ciHash(root), expectedHash: ciHash(second), activeHash: running.active ? ciHash(running.active.version) : undefined, failed: running.failure !== null, watchFailed: running.watchError !== null });
          return running.active?.version !== second;
        });
      } finally {
        ciStage("dev.recovery.wait.end", { rootHash: ciHash(root), expectedHash: ciHash(second), activeHash: running.active ? ciHash(running.active.version) : undefined, failed: running.failure !== null });
      }
      await running.settled();
      ciStage("dev.recovery.settled", { rootHash: ciHash(root), activeHash: running.active ? ciHash(running.active.version) : undefined, failed: running.failure !== null });''')
p='apps/loom/src/tooling/dev/watcher.ts'
rep(p,'    ciScope({ event: ciEvent, rootHash: ciHash(directory) }, () => coordinator.invalidate());','    ciStage("watch.admitted", { event: ciEvent, rootHash: ciHash(directory) });\n    ciScope({ event: ciEvent, rootHash: ciHash(directory) }, () => coordinator.invalidate());')
rep(p,'  watcher.on("error", (cause) => {','  watcher.on("error", (cause) => {\n    ciStage("watch.error", { rootHash: ciHash(directory) });')
# Root lineage for initial and later revisions; no API extension.
rep(p,'  const coordinator = createDevelopmentCoordinator(update, options);','  const coordinator = ciScope({ rootHash: ciHash(directory) }, () => createDevelopmentCoordinator(update, options));')
rep(p,'  coordinator.invalidate();','  ciScope({ rootHash: ciHash(directory) }, () => coordinator.invalidate());')
p='apps/loom/src/tooling/dev/coordinator.ts'
rep(p,'        assertCurrent() {','        assertCurrent() {\n          ciStage("revision.check", { coordinator: ciCoordinator, revision: revisionNumber, currentRevision: number, stopped, aborted: cancellation.signal.aborted });')
# Capture root context independently of a stale triggering event, for each revision.
rep(p,'  const ciCoordinator = ciId();','  const ciCoordinator = ciId();\n  let ciRunningRevision: number | undefined;')
rep(p,'      controller = cancellation;','      controller = cancellation;\n      ciRunningRevision = revisionNumber;')
rep(p,'        controller = undefined;','        controller = undefined;\n        ciRunningRevision = undefined;')
rep(p,'ciStage("revision.cancel", { coordinator: ciCoordinator, revision: number, aborted:', 'ciStage("revision.cancel", { coordinator: ciCoordinator, revision: ciRunningRevision, currentRevision: number, aborted:', n=2)
p='apps/loom/src/tooling/dev/development.ts'
rep(p,'    if (candidate.version === active?.version) return;','    if (candidate.version === active?.version) {\n      ciStage("candidate.unchanged", { rootHash: ciHash(options.root), revision: revision.number, candidateHash: ciHash(candidate.version), activeHash: ciHash(active.version) });\n      return;\n    }')
rep(p,'        const result = await server.replace(runtime, revision.signal, async (install) => {','        ciStage("admission.begin", { rootHash: ciHash(options.root), revision: revision.number, candidateHash: ciHash(candidate.version), aborted: revision.signal.aborted });\n        const result = await server.replace(runtime, revision.signal, async (install) => {')
rep(p,'            install();','            ciStage("admission.install", { rootHash: ciHash(options.root), revision: revision.number, candidateHash: ciHash(candidate.version), aborted: revision.signal.aborted });\n            install();')
rep(p,'        if (!result.retired) {','        ciStage("admission.end", { rootHash: ciHash(options.root), revision: revision.number, failed: !result.retired, aborted: revision.signal.aborted });\n        if (!result.retired) {')
# Original root invocation stays strict; pass only one new synthetic destination variable.
p='turbo.json'; changed[p]=(root/p).read_text();rep(p,'"passThroughEnv": ["LOOM_TEST_DATABASE_URL"]','"passThroughEnv": ["LOOM_TEST_DATABASE_URL", "KELLO_CI_STAGE_DIRECTORY"]')
manifest={'base':'43599002a0da6e5db887c35cf221d018e6975c77','applied':False,'executableSupervisorAuthored':False,'paths':{}}; patch=''
for p,data in changed.items():
 before=(root/p).read_text() if (root/p).exists() else ''
 dest=out/'overlay'/p;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(data)
 manifest['paths'][p]={'before':hashlib.sha256(before.encode()).hexdigest() if before else None,'after':hashlib.sha256(data.encode()).hexdigest()}
 patch+=''.join(difflib.unified_diff(before.splitlines(True),data.splitlines(True),fromfile='a/'+p if before else '/dev/null',tofile='b/'+p))
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(out/'instrumentation.patch').write_text(patch)
workflow=(root/'.github/workflows/ci.yml').read_text()
proposed=workflow.replace('      - name: PostgreSQL integration and packed Bun/Node consumers\n        run: bun run test:integration','''      - name: PostgreSQL integration and packed Bun/Node consumers
        id: native_integration
        run: python3 docs/validation/001-ci-full-integration-design/linux-full-integration.py
      - name: Upload validated full-integration diagnostic receipts
        if: ${{ always() && !cancelled() && steps.native_integration.outcome != 'skipped' }}
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: kello-001-full-integration-${{ github.run_id }}-${{ github.run_attempt }}
          path: ${{ runner.temp }}/kello-001-full-integration/publish/
          if-no-files-found: error
          include-hidden-files: false
          retention-days: 3''')
assert proposed!=workflow
(out/'workflow-proposal.patch').write_text(''.join(difflib.unified_diff(workflow.splitlines(True),proposed.splitlines(True),fromfile='a/.github/workflows/ci.yml',tofile='b/.github/workflows/ci.yml')))
print('Authored eight unapplied overlays; workflow proposal references not-yet-authored supervisor.')
