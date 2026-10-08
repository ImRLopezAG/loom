from pathlib import Path
import difflib,hashlib,json
root=Path.cwd();out=root/'docs/validation/001-ci-linux-design'
paths=['apps/loom/src/tooling/dev/watcher.ts','apps/loom/src/tooling/dev/coordinator.ts','apps/loom/src/tooling/dev/development.ts','apps/loom/src/tooling/codegen/lock.ts','packages/e2e/integration/dev.test.ts','packages/e2e/integration/provision-cli.test.ts']
original={p:(root/p).read_text() for p in paths};changed=dict(original)
def rep(p,a,b,n=1):
 assert changed[p].count(a)==n,(p,a,changed[p].count(a));changed[p]=changed[p].replace(a,b)
for p in paths:
 imp='./ci-trace' if '/tooling/dev/' in p else '../dev/ci-trace' if '/codegen/' in p else '../../../apps/loom/src/tooling/dev/ci-trace'
 changed[p]=f'import {{ ciStage, ciHash, ciId, ciScope }} from "{imp}";\n'+changed[p]
p=paths[0]
rep(p,'  const coordinator = createDevelopmentCoordinator(update, options);','  ciStage("watch.create", { rootHash: ciHash(directory) });\n  const coordinator = createDevelopmentCoordinator(update, options);')
rep(p,'    if (stopped) return;','    const ciEvent = ciId();\n    ciStage("watch.event", { event: ciEvent, rootHash: ciHash(directory), eventKind: _event === "rename" || _event === "change" ? _event : "other", filenameHash: filename ? ciHash(filename) : undefined, filenameKind: !filename ? "missing" : filename === "kello/schema.ts" ? "schema" : filename.includes("_generated") ? "generated" : filename.includes(".loom") ? "internal" : "other" });\n    if (stopped) return;')
rep(p,'  async function stop(): Promise<void> {','  async function stop(): Promise<void> {\n    ciStage("watch.stop.begin", { rootHash: ciHash(directory) });')
rep(p,'    await Promise.all([closed, coordinator.stop()]);','    await Promise.all([closed, coordinator.stop()]);\n    ciStage("watch.stop.end", { rootHash: ciHash(directory) });')
rep(p,'    coordinator.invalidate();','    ciScope({ event: ciEvent, rootHash: ciHash(directory) }, () => coordinator.invalidate());')
p=paths[1]
rep(p,'  const debounceMs = options.debounceMs ?? 75;','  const ciCoordinator = ciId();\n  ciStage("coordinator.create", { coordinator: ciCoordinator });\n  const debounceMs = options.debounceMs ?? 75;')
rep(p,'      try {\n        await update(revision);','      ciStage("revision.begin", { coordinator: ciCoordinator, revision: revisionNumber });\n      try {\n        await ciScope({ coordinator: ciCoordinator, revision: revisionNumber }, () => update(revision));\n        ciStage("revision.success", { coordinator: ciCoordinator, revision: revisionNumber, aborted: cancellation.signal.aborted });')
rep(p,'      } catch (cause) {','      } catch (cause) {\n        ciStage("revision.failure", { coordinator: ciCoordinator, revision: revisionNumber, aborted: cancellation.signal.aborted });')
rep(p,'        controller = undefined;','        ciStage("revision.end", { coordinator: ciCoordinator, revision: revisionNumber, aborted: cancellation.signal.aborted, pending });\n        controller = undefined;')
rep(p,'  function ready() {','  function ready() {\n    ciStage("coordinator.ready", { coordinator: ciCoordinator, revision: number });')
rep(p,'      number++;','      number++;\n      ciStage("coordinator.invalidate", { coordinator: ciCoordinator, revision: number, pending, aborted: controller?.signal.aborted ?? false });')
rep(p,'      controller?.abort();','      controller?.abort();\n      ciStage("revision.cancel", { coordinator: ciCoordinator, revision: number, aborted: controller?.signal.aborted ?? false });',n=2)
p=paths[2]
rep(p,'    if (fatal) throw fatal;','    ciStage("update.begin", { rootHash: ciHash(options.root), revision: revision.number });\n    if (fatal) throw fatal;')
rep(p,'    const candidate = await prepareProject(options.root);','    const candidate = await prepareProject(options.root);\n    ciStage("candidate.ready", { rootHash: ciHash(options.root), revision: revision.number, candidateHash: ciHash(candidate.version), aborted: revision.signal.aborted });')
rep(p,'    await synchronizeDevelopment(','    ciStage("sync.begin", { revision: revision.number });\n    await synchronizeDevelopment(')
rep(p,'    const started = await startDevelopmentRuntime(','    ciStage("sync.end", { revision: revision.number });\n    ciStage("runtime.begin", { revision: revision.number });\n    const started = await startDevelopmentRuntime(')
rep(p,'    let transferred = false;','    ciStage("runtime.ready", { revision: revision.number });\n    let transferred = false;')
rep(p,'        active = Object.freeze({ version: candidate.version, target: started.target });','        active = Object.freeze({ version: candidate.version, target: started.target });\n        ciStage("active.installed", { rootHash: ciHash(options.root), revision: revision.number, activeHash: ciHash(candidate.version) });')
p=paths[3]
rep(p,'  const deadline = Date.now() + 10_000;','  const ciOperation = ciId();\n  ciStage("lock.wait", { rootHash: ciHash(root), operation: ciOperation });\n  const deadline = Date.now() + 10_000;')
rep(p,'      await mkdir(lock);','      await mkdir(lock);\n      ciStage("lock.acquired", { rootHash: ciHash(root), operation: ciOperation });')
rep(p,'    await rm(lock, { recursive: true });','    ciStage("lock.release.begin", { rootHash: ciHash(root), operation: ciOperation });\n    await rm(lock, { recursive: true });\n    ciStage("lock.release.end", { rootHash: ciHash(root), operation: ciOperation });')
p=paths[4]
rep(p,'    const root = await mkdtemp(join(tmpdir(), "loom-dev-"));','    const root = await mkdtemp(join(tmpdir(), "loom-dev-"));\n    ciStage("dev.fixture.begin", { rootHash: ciHash(root) });')
rep(p,'      await entered.promise;','      ciStage("dev.obsolete.write", { rootHash: ciHash(root), candidateHash: ciHash(expanded.replace("description: s.text()", "description: s.text(), obsolete: s.text()")) });\n      await entered.promise;\n      ciStage("dev.provider.entered", { rootHash: ciHash(root) });')
rep(p,'\n        await writeFile(source, latest);\n      } finally {','\n        ciStage("dev.intermediate.write", { rootHash: ciHash(root), candidateHash: ciHash(expanded.replace("description: s.text()", "description: s.text(), intermediate: s.text()")) });\n        await writeFile(source, latest);\n        ciStage("dev.latest.write", { rootHash: ciHash(root), candidateHash: ciHash(latest) });\n      } finally {')
rep(p,'        resume.resolve();','        resume.resolve();\n        ciStage("dev.provider.resumed", { rootHash: ciHash(root) });')
rep(p,'      const expected = await prepareProject(root);\n      await until(() => running.active?.version === expected.version);','      ciStage("dev.expected.prepare.begin", { rootHash: ciHash(root) });\n      const expected = await prepareProject(root);\n      ciStage("dev.expected.prepare.end", { rootHash: ciHash(root), expectedHash: ciHash(expected.version) });\n      try {\n        await until(() => {\n          ciStage("dev.latest.poll", { rootHash: ciHash(root), expectedHash: ciHash(expected.version), activeHash: running.active ? ciHash(running.active.version) : undefined, failed: running.failure !== null, watchFailed: running.watchError !== null });\n          return running.active?.version === expected.version;\n        });\n      } finally {\n        ciStage("dev.latest.wait.end", { rootHash: ciHash(root), expectedHash: ciHash(expected.version), activeHash: running.active ? ciHash(running.active.version) : undefined, failed: running.failure !== null });\n      }')
# Exact cleanup anchors are selected from the original existing finally, no cleanup control flow changes.
rep(p,'      await development?.stop();','      ciStage("dev.cleanup.begin", { rootHash: ciHash(root) });\n      await development?.stop();')
rep(p,'      await rm(root, { recursive: true, force: true });','      await rm(root, { recursive: true, force: true });\n      ciStage("dev.cleanup.end", { rootHash: ciHash(root) });')
p=paths[5]
rep(p,'  const cli = fileURLToPath','  ciStage("provision.fixture.begin", { rootHash: ciHash(root) });\n  let ciCaseIndex = 0;\n  const cli = fileURLToPath')
rep(p,'    const child = Bun.spawn','    const caseIndex = ++ciCaseIndex;\n    ciStage("provision.child.start", { caseIndex });\n    const child = Bun.spawn')
rep(p,'    const [stdout, stderr, exit] = await Promise.all([','    ciStage("provision.child.spawned", { caseIndex, childPid: child.pid });\n    const [stdout, stderr, exit] = await Promise.all([')
rep(p,'      child.exited,','      child.exited.then((code) => { ciStage("provision.child.exit", { caseIndex, childPid: child.pid, childExit: code }); return code; }),')
rep(p,'    ]);\n    assert.equal(exit, code);','    ]).finally(() => ciStage("provision.child.await.end", { caseIndex, childPid: child.pid, childExit: child.exitCode }));\n    assert.equal(exit, code);')
rep(p,'    await rm(root, { recursive: true, force: true });','    ciStage("provision.cleanup.begin", { rootHash: ciHash(root) });\n    await rm(root, { recursive: true, force: true });\n    ciStage("provision.cleanup.end", { rootHash: ciHash(root) });')
helper='apps/loom/src/tooling/dev/ci-trace.ts';changed[helper]=(out/'trace-helper.ts').read_text();original[helper]=''
manifest={'base':'0dbb4387f615d6f8358f2eea1c3d886c6ae3184e','applied':False,'paths':{}}
patch=''
for p,data in changed.items():
 if p != helper:
  names=[name for name in ['ciStage','ciHash','ciId','ciScope'] if data.count(name)>1]
  data=data.replace('ciStage, ciHash, ciId, ciScope', ', '.join(names),1)
 dest=out/'overlay'/p;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(data)
 patch+=''.join(difflib.unified_diff(original[p].splitlines(True),data.splitlines(True),fromfile='a/'+p if original[p] else '/dev/null',tofile='b/'+p))
 manifest['paths'][p]={'before':hashlib.sha256(original[p].encode()).hexdigest() if original[p] else None,'after':hashlib.sha256(data.encode()).hexdigest()}
(out/'instrumentation.patch').write_text(patch);(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Prepared unapplied overlay for',len(changed),'paths')
