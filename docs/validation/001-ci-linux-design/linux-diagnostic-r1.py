#!/usr/bin/env python3
"""UNEXECUTED Linux diagnostic artifact. Requires separate workflow/execution authorization.

No import has side effects. main() accepts only the existing GitHub verify job;
this is not a local test runner. Private console/backup data never enters publish/.
"""
from __future__ import annotations

import ctypes
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import selectors
import shutil
import signal
import stat
import subprocess
import sys
import time
import tomllib
from urllib.parse import urlsplit

BASE = "0dbb4387f615d6f8358f2eea1c3d886c6ae3184e"
SOURCE_PATHS = {
    "apps/loom/src/tooling/dev/watcher.ts", "apps/loom/src/tooling/dev/coordinator.ts",
    "apps/loom/src/tooling/dev/development.ts", "apps/loom/src/tooling/codegen/lock.ts",
    "packages/e2e/integration/dev.test.ts", "packages/e2e/integration/provision-cli.test.ts",
    "apps/loom/src/tooling/dev/ci-trace.ts",
}
ARTIFACT = Path(__file__).resolve().parent
ROOT = ARTIFACT.parents[2]
MIB = 1024 * 1024
HEX = re.compile(r"[0-9a-f]{64}\Z")
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\Z")
TRACE_NAME = re.compile(r"([1-9][0-9]*)-([0-9a-f-]{36})\.jsonl\Z")
CANCELLED = False
CASES = (
    ("dev", "./integration/dev.test.ts", "development saves synchronize schema, references and serving runtime with failed-edit recovery", 120),
    ("provision", "./integration/provision-cli.test.ts", "branch provisioning CLI rejects unrelated options and redacts invalid declarations", 30),
)
STAGES = set("""watch.create watch.event watch.stop.begin watch.stop.end coordinator.create
coordinator.invalidate coordinator.ready revision.cancel revision.begin revision.success
revision.failure revision.end update.begin candidate.ready sync.begin sync.end runtime.begin
runtime.ready active.installed lock.wait lock.acquired lock.release.begin lock.release.end
dev.fixture.begin dev.obsolete.write dev.provider.entered dev.intermediate.write dev.latest.write
dev.provider.resumed dev.expected.prepare.begin dev.expected.prepare.end dev.latest.poll
dev.latest.wait.end dev.cleanup.begin dev.cleanup.end provision.fixture.begin provision.child.start
provision.child.spawned provision.child.exit provision.child.await.end provision.cleanup.begin
provision.cleanup.end trace.truncated""".split())
HASH_FIELDS = {"rootHash", "candidateHash", "expectedHash", "activeHash", "filenameHash"}
ID_FIELDS = {"operation", "coordinator", "event"}
BOOL_FIELDS = {"aborted", "pending", "failed", "watchFailed"}
INT_FIELDS = {"revision", "childPid", "caseIndex"}
ENUM_FIELDS = {"filenameKind": {"missing", "schema", "generated", "internal", "other"},
               "eventKind": {"rename", "change", "other"}}
COMMON = {"schema", "pid", "instance", "sequence", "ns", "stage"}
REQUIRED = {
    "watch.event": {"rootHash", "event", "filenameKind", "eventKind"},
    "candidate.ready": {"rootHash", "revision", "candidateHash", "aborted"},
    "active.installed": {"rootHash", "revision", "activeHash"},
    "dev.latest.poll": {"rootHash", "expectedHash", "failed", "watchFailed"},
    "dev.expected.prepare.end": {"rootHash", "expectedHash"},
    "provision.child.start": {"caseIndex"},
    "provision.child.spawned": {"caseIndex", "childPid"},
    "provision.child.exit": {"caseIndex", "childPid", "childExit"},
    "provision.child.await.end": {"caseIndex", "childPid", "childExit"},
}


class Invalid(Exception):
    """Only fixed, non-sensitive reason codes may be passed to this exception."""


def require(value: object, reason: str) -> None:
    if not value:
        raise Invalid(reason)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def save_json(path: Path, value: object) -> None:
    data = (json.dumps(value, sort_keys=True, indent=2) + "\n").encode()
    require(len(data) <= MIB, "metadata_bound")
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())


def regular_bytes(path: Path, limit: int) -> bytes:
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, "rb") as handle:
        info = os.fstat(handle.fileno())
        require(stat.S_ISREG(info.st_mode) and info.st_size <= limit, "file_type_or_bound")
        data = handle.read(limit + 1)
    require(len(data) <= limit, "file_bound")
    return data


def git(*args: str) -> bytes:
    # Only fixed read-only git arguments supplied below; no shell or credential operations.
    result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, timeout=10, check=False)
    require(result.returncode == 0 and len(result.stdout) <= 16 * MIB, "git_read_failed")
    return result.stdout


def source_path(relative: str) -> Path:
    path = ROOT / relative
    require(not Path(relative).is_absolute() and ".." not in Path(relative).parts, "unsafe_source_path")
    require(path.parent.resolve().is_relative_to(ROOT) and not path.is_symlink(), "source_symlink")
    return path


def tree_manifest(directory: Path) -> dict:
    require(directory.is_dir() and not directory.is_symlink(), "dist_missing_or_symlink")
    result = {}
    for parent, dirs, files in os.walk(directory, followlinks=False):
        for name in sorted(dirs + files):
            path = Path(parent) / name
            info = path.lstat()
            kind = "link" if stat.S_ISLNK(info.st_mode) else "directory" if stat.S_ISDIR(info.st_mode) else "file"
            require(kind != "file" or stat.S_ISREG(info.st_mode), "dist_special_file")
            payload = os.fsencode(os.readlink(path)) if kind == "link" else b"" if kind == "directory" else regular_bytes(path, 128 * MIB)
            # Publish only hashed relative names/targets, modes and content hashes.
            result[digest(os.fsencode(path.relative_to(directory)))] = {"kind": kind, "mode": stat.S_IMODE(info.st_mode), "sha256": digest(payload)}
            require(len(result) <= 20000, "dist_manifest_bound")
    return result


def proc_snapshot() -> dict[int, tuple[int, int, int, str]]:
    result = {}
    for entry in Path("/proc").iterdir():
        if not entry.name.isdigit():
            continue
        try:
            data = (entry / "stat").read_bytes()
            fields = data[data.rfind(b")") + 2:].split()
            # state, ppid, pgrp, ... starttime; never retain comm or cmdline.
            result[int(entry.name)] = (int(fields[1]), int(fields[2]), int(fields[19]), fields[0].decode("ascii"))
        except (OSError, ValueError, IndexError, UnicodeError):
            continue
    return result


class Journal:
    def __init__(self, path: Path):
        self.handle = path.open("xb")
        os.chmod(path, 0o600)
        self.count = 0
        self.overflow = False

    def emit(self, stage: str, **fields: object) -> None:
        if self.count >= 4080:
            self.overflow = True
            return  # Reserved final summary records disclose overflow; never invent complete evidence.
        self.count += 1
        line = json.dumps({"schema": 1, "sequence": self.count, "ns": time.monotonic_ns(), "stage": stage, **fields}).encode() + b"\n"
        require(len(line) <= 4096, "supervisor_record_bound")
        self.handle.write(line)
        self.handle.flush()

    def close(self) -> None:
        self.handle.flush()
        os.fsync(self.handle.fileno())
        self.handle.close()


class OwnedCommand:
    def __init__(self, label: str, argv: list[str], cwd: Path, env: dict[str, str], seconds: int, private: Path, journal: Journal, traces: Path):
        self.label, self.argv, self.cwd, self.env = label, argv, cwd, env
        self.seconds, self.private, self.journal, self.traces = seconds, private, journal, traces
        self.known: dict[int, tuple[int, int, int, int]] = {}  # pid -> starttick, pidfd, ppid, pgid
        self.exited: set[tuple[int, int]] = set()
        self.process: subprocess.Popen | None = None
        self.forced = False
        self.reason: str | None = None
        self.output_bytes = 0
        self.peak_observed = 0

    def discover(self) -> dict:
        snapshot = proc_snapshot()
        changed = True
        while changed:
            changed = False
            for pid, (ppid, pgid, started, state) in snapshot.items():
                if pid == os.getpid() or pid in self.known:
                    continue
                parent = self.known.get(ppid)
                parent_current = snapshot.get(ppid)
                child_of_owned = parent is not None and parent_current is not None and parent_current[2] == parent[0]
                root_child = self.process is not None and pid == self.process.pid and ppid == os.getpid()
                adopted = ppid == os.getpid() and self.process is not None
                if not (child_of_owned or root_child or adopted):
                    continue
                require(len(self.known) < 256, "owned_identity_bound")
                try:
                    fd = os.pidfd_open(pid)
                    current = proc_snapshot().get(pid)
                    if current is None or current[2] != started:
                        os.close(fd)
                        continue
                except ProcessLookupError:
                    continue
                self.known[pid] = (started, fd, ppid, pgid)
                self.journal.emit("process.observed", command=self.label, pid=pid, ppid=ppid, pgid=pgid, startTicks=started)
                changed = True
        alive = {pid: info for pid, info in snapshot.items() if pid in self.known and info[2] == self.known[pid][0]}
        self.peak_observed = max(self.peak_observed, len(alive))
        for pid, (started, _fd, _ppid, _pgid) in self.known.items():
            if pid not in alive and (pid, started) not in self.exited:
                self.exited.add((pid, started))
                self.journal.emit("process.no_longer_observed", command=self.label, pid=pid, startTicks=started)
        return alive

    def signal_owned(self, sig: int) -> None:
        for pid, info in self.discover().items():
            started, fd, _ppid, _pgid = self.known[pid]
            if info[3] == "Z":
                continue
            try:
                # pidfd targets this process instance even if the numeric PID is reused.
                signal.pidfd_send_signal(fd, sig)
                self.journal.emit("process.signal", command=self.label, pid=pid, startTicks=started, signal=sig)
            except ProcessLookupError:
                pass

    def reap(self) -> None:
        if self.process is not None:
            self.process.poll()
        for pid, item in list(self.known.items()):
            if self.process is not None and pid == self.process.pid:
                continue
            try:
                found, status = os.waitpid(pid, os.WNOHANG)
                if found:
                    self.journal.emit("process.reaped", command=self.label, pid=pid, startTicks=item[0], waitStatus=status)
            except ChildProcessError:
                pass

    def cleanup(self) -> bool:
        self.reap()
        alive = self.discover()
        self.journal.emit("cleanup.begin", command=self.label, remaining=len(alive))
        if alive:
            self.forced = True
            self.signal_owned(signal.SIGTERM)
            end = time.monotonic() + 2
            while time.monotonic() < end:
                self.reap()
                if not self.discover():
                    break
                time.sleep(0.05)
            if self.discover():
                self.signal_owned(signal.SIGKILL)
                end = time.monotonic() + 2
                while time.monotonic() < end:
                    self.reap()
                    if not self.discover():
                        break
                    time.sleep(0.05)
        remaining = self.discover()
        self.journal.emit("cleanup.end", command=self.label, remaining=len(remaining), forced=self.forced)
        self.remaining = [{"pid": pid, "startTicks": item[2], "pgid": item[1]} for pid, item in remaining.items()]
        return not remaining

    def trace_bounds(self) -> None:
        total = 0
        count = 0
        for directory in self.traces.iterdir():
            require(directory.is_dir() and not directory.is_symlink(), "trace_directory_type")
            for file in directory.iterdir():
                count += 1
                info = file.lstat()
                require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1, "trace_file_type")
                require(info.st_size <= MIB, "trace_file_bound")
                total += info.st_size
                require(count <= 64 and total <= 8 * MIB, "trace_total_bound")

    def run(self) -> dict:
        clean = False
        output = self.private / (self.label + ".console")
        selector = selectors.DefaultSelector()
        started = time.monotonic()
        try:
            self.process = subprocess.Popen(self.argv, cwd=self.cwd, env=self.env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
            self.journal.emit("command.spawned", command=self.label, pid=self.process.pid)
            self.discover()
            require(self.process.stdout is not None, "stdout_pipe_missing")
            os.set_blocking(self.process.stdout.fileno(), False)
            selector.register(self.process.stdout, selectors.EVENT_READ)
            with output.open("xb") as console:
                os.chmod(output, 0o600)
                while self.process.poll() is None or selector.get_map():
                    self.reap()
                    self.discover()
                    self.trace_bounds()
                    require(not self.journal.overflow, "supervisor_event_bound")
                    require(not CANCELLED, "cancelled")
                    require(time.monotonic() - started < self.seconds, "supervisor_ceiling")
                    for key, _mask in selector.select(0.05):
                        data = os.read(key.fileobj.fileno(), 65536)
                        if not data:
                            selector.unregister(key.fileobj)
                            continue
                        self.output_bytes += len(data)
                        require(self.output_bytes <= 8 * MIB, "console_bound")
                        console.write(data)
                console.flush()
                os.fsync(console.fileno())
        except Invalid as exc:
            self.reason = str(exc)
        except Exception:
            self.reason = "command_supervision_error"
        finally:
            try:
                if self.process is not None:
                    clean = self.cleanup()
            except Exception:
                self.reason = "ownership_cleanup_error"
                clean = False
            selector.close()
            if self.process is not None and self.process.stdout is not None:
                self.process.stdout.close()
            for _start, fd, _ppid, _pgid in self.known.values():
                os.close(fd)
        result = {"label": self.label, "exit": None if self.process is None else self.process.poll(),
                  "reason": self.reason, "cleanupClean": clean, "forcedCleanup": self.forced,
                  "peakObservedProcesses": self.peak_observed, "observedProcessIdentities": len(self.known),
                  "consoleBytes": self.output_bytes, "elapsedMs": round((time.monotonic() - started) * 1000),
                  "remaining": getattr(self, "remaining", [])}
        self.journal.emit("command.end", command=self.label, exit=result["exit"], reason=self.reason, cleanupClean=clean, forcedCleanup=self.forced, remaining=len(result["remaining"]))
        return result


def valid_record(record: object, pid: int, instance: str) -> bool:
    if not isinstance(record, dict) or type(record.get("schema")) is not int or record.get("schema") != 1 or type(record.get("pid")) is not int or record.get("pid") != pid or record.get("instance") != instance:
        return False
    if type(record.get("sequence")) is not int or not 1 <= record["sequence"] <= 4097:
        return False
    if record.get("stage") == "trace.cost":
        return set(record) == {"schema", "pid", "instance", "sequence", "stage", "elapsedNs"} and isinstance(record.get("elapsedNs"), str) and re.fullmatch(r"[0-9]{1,30}", record["elapsedNs"]) is not None
    if record.get("stage") not in STAGES or not isinstance(record.get("ns"), str) or re.fullmatch(r"[0-9]{1,30}", record["ns"]) is None:
        return False
    if not COMMON <= record.keys() or not REQUIRED.get(record["stage"], set()) <= record.keys():
        return False
    for key, value in record.items():
        if key in COMMON:
            continue
        if key in HASH_FIELDS:
            okay = isinstance(value, str) and HEX.fullmatch(value)
        elif key in ID_FIELDS:
            okay = isinstance(value, str) and UUID.fullmatch(value)
        elif key in BOOL_FIELDS:
            okay = type(value) is bool
        elif key in INT_FIELDS:
            okay = type(value) is int and 0 <= value <= 2**31 - 1
        elif key == "childExit":
            okay = value is None or type(value) is int and -255 <= value <= 255
        elif key in ENUM_FIELDS:
            okay = isinstance(value, str) and value in ENUM_FIELDS[key]
        else:
            okay = False
        if not okay:
            return False
    stage = record["stage"]
    if stage.startswith("lock.") and not {"rootHash", "operation"} <= record.keys():
        return False
    if stage.startswith(("revision.", "coordinator.")) and "coordinator" not in record:
        return False
    return True


def validate_trace(case: str, directory: Path, publish: Path, command: OwnedCommand) -> dict:
    reasons: set[str] = set()
    records = []
    files = sorted(directory.iterdir())
    for file in files:
        match = TRACE_NAME.fullmatch(file.name)
        if match is None or UUID.fullmatch(match[2]) is None:
            reasons.add("trace_filename_invalid")
            continue
        pid, instance = int(match[1]), match[2]
        if not 1 <= pid < 2**31:
            reasons.add("trace_pid_invalid")
            continue
        if pid not in command.known:
            reasons.add("trace_pid_not_observed")
        try:
            data = regular_bytes(file, MIB)
        except (OSError, Invalid):
            reasons.add("trace_read_invalid")
            continue
        expected = 1
        needs_cost = False
        safe = []
        for line in data.splitlines(keepends=True):
            if len(line) > 4096 or not line.endswith(b"\n"):
                reasons.add("trace_line_invalid")
                break
            try:
                record = json.loads(line)
            except (ValueError, UnicodeError):
                reasons.add("trace_json_invalid")
                break
            if not valid_record(record, pid, instance):
                reasons.add("trace_schema_invalid")
                break
            cost = record["stage"] == "trace.cost"
            if record["sequence"] != expected or cost != needs_cost:
                reasons.add("trace_sequence_invalid")
                break
            safe.append(record)
            if record["stage"] == "trace.truncated":
                reasons.add("trace_truncated")
            if cost:
                expected += 1
            needs_cost = not needs_cost
        if needs_cost:
            reasons.add("trace_cost_missing")
        # Publish only the validated synthetic prefix, explicitly marked incomplete by the receipt.
        path = publish / (case + "-" + file.name)
        with path.open("xb") as handle:
            os.chmod(path, 0o600)
            for item in safe:
                handle.write(json.dumps(item, sort_keys=True).encode() + b"\n")
        records.extend(item for item in safe if item["stage"] != "trace.cost")
    if not files:
        reasons.add("trace_missing")
    stages = {record["stage"] for record in records}
    required = {"dev.fixture.begin", "dev.obsolete.write", "dev.provider.entered", "dev.intermediate.write", "dev.latest.write", "dev.provider.resumed", "dev.expected.prepare.begin", "dev.expected.prepare.end", "dev.latest.poll", "dev.latest.wait.end", "dev.cleanup.begin", "dev.cleanup.end", "watch.create", "coordinator.invalidate", "revision.begin", "candidate.ready", "lock.wait", "lock.acquired", "lock.release.end"} if case == "dev" else {"provision.fixture.begin", "provision.cleanup.begin", "provision.cleanup.end"}
    if not required <= stages:
        reasons.add("required_stage_missing")
    if case == "provision":
        for index in range(1, 9):
            for stage in ("provision.child.start", "provision.child.spawned", "provision.child.exit", "provision.child.await.end"):
                matches = [item for item in records if item["stage"] == stage and item.get("caseIndex") == index]
                if len(matches) != 1:
                    reasons.add("child_lifecycle_incomplete")
                elif stage != "provision.child.start" and matches[0].get("childPid") not in command.known:
                    reasons.add("child_pid_not_observed")
    console = regular_bytes(command.private / (case + ".console"), 8 * MIB)
    if b"CI_TRACE_IO_FAILURE" in console or b"CI_TRACE_CLOSE_FAILURE" in console:
        reasons.add("trace_io_failure")
    # No raw assertion output or application payload is copied into publish/.
    counts = {name: [int(value) for value in re.findall(rb"(?m)^\s*([0-9]+) " + name.encode() + rb"\b", console)] for name in ("pass", "fail", "skip")}
    passes = counts["pass"][-1] if counts["pass"] else 0
    failures = counts["fail"][-1] if counts["fail"] else 0
    skips = counts["skip"][-1] if counts["skip"] else 0
    if passes + failures != 1 or skips:
        reasons.add("selected_case_count_unproven")
    return {"case": case, "traceComplete": not reasons, "reasons": sorted(reasons), "pass": passes, "fail": failures, "skip": skips, "validatedRecords": len(records), "files": len(files)}


def inspect_config() -> list[dict]:
    candidates = [("checkout", ROOT / "bunfig.toml"), ("e2e", ROOT / "packages/e2e/bunfig.toml"), ("app", ROOT / "apps/loom/bunfig.toml"), ("home", Path.home() / ".bunfig.toml")]
    xdg = os.environ.get("XDG_CONFIG_HOME")
    if xdg:
        require(Path(xdg).is_absolute(), "xdg_relative")
        candidates.append(("xdg", Path(xdg) / ".bunfig.toml"))
    receipts = []
    for label, path in candidates:
        if not path.exists() and not path.is_symlink():
            receipts.append({"location": label, "present": False})
            continue
        data = regular_bytes(path, 65536)
        try:
            config = tomllib.loads(data.decode())
        except (ValueError, UnicodeError):
            raise Invalid("bunfig_parse_failed") from None
        # Conservative: never attempt to normalize unknown test/runtime overrides.
        # Install-only settings are not published (they may contain registry credentials).
        require(set(config) <= {"install", "test"}, "bunfig_runtime_override")
        require(config.get("test", {}) == {}, "bunfig_test_override")
        receipts.append({"location": label, "present": True, "sha256": digest(data), "testSettings": "none", "globalTestApplicability": "not_assumed"})
    return receipts


def cancelled(_sig: int, _frame: object) -> None:
    global CANCELLED
    CANCELLED = True


def main() -> int:
    # No instrumentation can be applied by importing this module or invoking it locally.
    require(sys.platform == "linux" and os.environ.get("GITHUB_ACTIONS") == "true" and os.environ.get("GITHUB_JOB") == "verify", "github_linux_verify_required")
    require(hasattr(os, "pidfd_open") and hasattr(signal, "pidfd_send_signal"), "pidfd_required")
    require(ROOT == Path.cwd().resolve(), "checkout_cwd_required")
    address = urlsplit(os.environ.get("LOOM_TEST_DATABASE_URL", ""))
    require(address.scheme in {"postgres", "postgresql"} and address.hostname in {"127.0.0.1", "localhost"} and address.port == 5432 and address.path == "/loom_test" and address.username == "postgres", "existing_ci_database_required")
    require(not any(os.environ.get(key) for key in ("KELLO_CI_STAGE_DIRECTORY", "NODE_OPTIONS", "BUN_OPTIONS", "BUN_TEST_TIMEOUT", "BUN_TEST_PRELOAD")), "ambient_runtime_override")
    temp = Path(os.environ.get("RUNNER_TEMP", ""))
    require(temp.is_absolute() and temp.is_dir() and not temp.resolve().is_relative_to(ROOT), "runner_temp_required")
    output = temp / "kello-001-linux-stages"
    output.mkdir(mode=0o700, exist_ok=False)
    private, publish, traces = (output / name for name in ("private", "publish", "traces"))
    for directory in (private, publish, traces):
        directory.mkdir(mode=0o700)
    journal = Journal(publish / "supervisor.jsonl")
    report: dict = {"schema": 1, "base": BASE, "acceptance": False, "status": "incomplete", "cases": [], "restored": False}
    originals: dict[str, tuple[bytes, int]] = {}
    applied = False
    cleanup_safe = True
    backup_ready = False
    dist = ROOT / "apps/loom/dist"
    dist_before = None
    initial_diff = None
    prior_subreaper = ctypes.c_int()
    libc = ctypes.CDLL(None, use_errno=True)
    old_handlers = {}
    try:
        require(libc.prctl(37, ctypes.byref(prior_subreaper), 0, 0, 0) == 0, "subreaper_read_failed")
        require(libc.prctl(36, 1, 0, 0, 0) == 0, "subreaper_enable_failed")
        for sig in (signal.SIGTERM, signal.SIGINT):
            old_handlers[sig] = signal.signal(sig, cancelled)
        manifest = json.loads(regular_bytes(ARTIFACT / "manifest.json", MIB))
        require(manifest["base"] == BASE and set(manifest["paths"]) == SOURCE_PATHS, "manifest_invalid")
        freeze = json.loads(regular_bytes(ARTIFACT / "supervisor-freeze-r1.json", MIB))
        for relative, value in freeze.items():
            require(digest(regular_bytes(ARTIFACT / relative, 4 * MIB)) == value, "artifact_hash_mismatch")
        for relative, hashes in manifest["paths"].items():
            path = source_path(relative)
            if hashes["before"] is None:
                require(not path.exists(), "helper_already_exists")
            else:
                data = regular_bytes(path, MIB)
                require(digest(data) == hashes["before"], "source_preimage_mismatch")
                originals[relative] = (data, stat.S_IMODE(path.stat().st_mode))
            require(digest(regular_bytes(ARTIFACT / "overlay" / relative, MIB)) == hashes["after"], "overlay_hash_mismatch")
        require(len(originals) == 6, "source_count_invalid")
        initial_diff = git("diff", "--binary", "HEAD", "--", ".")
        report["head"] = git("rev-parse", "HEAD").decode().strip()
        report["tree"] = git("rev-parse", "HEAD^{tree}").decode().strip()
        report["config"] = inspect_config()
        report["runner"] = {"family": "bun-test", "reporterArgument": None, "concurrentArgument": False, "historicalResolvedReporter": "unavailable", "runtimeIntrospection": "unavailable", "vitestWorkerCapApplies": False, "kernelRelease": platform.release()}
        report["commands"] = [["bun", "test", file, "--test-name-pattern", "^" + name + "$"] for _case, file, name, _seconds in CASES]
        for label, argv, pattern in (("bun-version", ["bun", "--version"], r"1\.4\.2"), ("node-version", ["node", "--version"], r"v24\.[0-9]+\.[0-9]+")):
            command = OwnedCommand(label, argv, ROOT, os.environ.copy(), 10, private, journal, traces)
            cleanup_safe = False
            result = command.run()
            cleanup_safe = result["cleanupClean"]
            require(result["exit"] == 0 and result["cleanupClean"] and not result["forcedCleanup"] and result["reason"] is None, "version_probe_failed")
            value = regular_bytes(private / (label + ".console"), 1000).decode().strip()
            require(re.fullmatch(pattern, value), "runtime_version_mismatch")
            report[label] = value
        dist_before = tree_manifest(dist)
        require(len(json.dumps(dist_before).encode()) < MIB - 4096, "dist_receipt_bound")
        save_json(private / "dist-before.json", dist_before)
        shutil.copytree(dist, private / "dist", symlinks=True)
        require(tree_manifest(private / "dist") == dist_before, "backup_hash_mismatch")
        backup_ready = True
        for relative, (data, mode) in originals.items():
            destination = private / "sources" / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(data)
            os.chmod(destination, mode)
        applied = True  # Covers partial write failure: finally restores every offered source.
        for relative, hashes in manifest["paths"].items():
            path = source_path(relative)
            path.write_bytes(regular_bytes(ARTIFACT / "overlay" / relative, MIB))
            require(digest(regular_bytes(path, MIB)) == hashes["after"], "applied_hash_mismatch")
        cleanup_safe = False
        build = OwnedCommand("build", ["bun", "run", "--cwd", "apps/loom", "build"], ROOT, os.environ.copy(), 180, private, journal, traces).run()
        cleanup_safe = build["cleanupClean"]
        report["build"] = build
        require(build["exit"] == 0 and build["cleanupClean"] and not build["forcedCleanup"] and build["reason"] is None, "diagnostic_build_failed")
        for case, file, name, seconds in CASES:
            require(not CANCELLED, "cancelled")
            directory = traces / case
            directory.mkdir(mode=0o700)
            env = os.environ.copy()
            env["KELLO_CI_STAGE_DIRECTORY"] = str(directory)
            command = OwnedCommand(case, ["bun", "test", file, "--test-name-pattern", "^" + name + "$"], ROOT / "packages/e2e", env, seconds, private, journal, traces)
            cleanup_safe = False
            result = command.run()
            cleanup_safe = result["cleanupClean"]
            receipt = validate_trace(case, directory, publish, command)
            result["trace"] = receipt
            result["interpretation"] = "incomplete" if not receipt["traceComplete"] or result["reason"] or result["forcedCleanup"] or not result["cleanupClean"] else "pass_nonreproduction" if result["exit"] == 0 else "red_requires_stage_interpretation"
            report["cases"].append(result)
            require(result["cleanupClean"] and not result["forcedCleanup"] and result["reason"] is None, "case_ownership_incomplete")
            require(case != "dev" or "dev.cleanup.end" in {json.loads(line)["stage"] for path in publish.glob("dev-*.jsonl") for line in path.read_text().splitlines()}, "fixture_cleanup_incomplete")
        report["status"] = "diagnostic_complete" if len(report["cases"]) == 2 and all(item["interpretation"] != "incomplete" for item in report["cases"]) else "incomplete"
    except Invalid as exc:
        report["reason"] = str(exc)
    except Exception:
        report["reason"] = "supervisor_error"  # Never publish arbitrary exception text/traceback.
    finally:
        try:
            final_children = [{"pid": pid, "startTicks": info[2], "pgid": info[1]} for pid, info in proc_snapshot().items() if info[0] == os.getpid()]
            report["finalDirectChildAudit"] = final_children
            require(cleanup_safe and not final_children, "unsafe_restore_live_children")
            if applied:
                for relative, (data, mode) in originals.items():
                    path = source_path(relative)
                    path.write_bytes(data)
                    os.chmod(path, mode)
                helper = source_path("apps/loom/src/tooling/dev/ci-trace.ts")
                if helper.exists():
                    helper.unlink()
            if backup_ready and applied:
                if dist.is_symlink():
                    dist.unlink()
                elif dist.exists():
                    shutil.rmtree(dist)
                shutil.copytree(private / "dist", dist, symlinks=True)
            restored = not applied or all(digest(regular_bytes(source_path(path), MIB)) == digest(data) for path, (data, _mode) in originals.items()) and not source_path("apps/loom/src/tooling/dev/ci-trace.ts").exists() and tree_manifest(dist) == dist_before and git("diff", "--binary", "HEAD", "--", ".") == initial_diff
            report["restored"] = bool(restored)
            require(restored, "restoration_mismatch")
            if backup_ready:
                report["distManifestSha256"] = digest(json.dumps(dist_before, sort_keys=True).encode())
                save_json(publish / "dist-manifest.json", dist_before)
            report["sourceHashes"] = {path: digest(data) for path, (data, _mode) in originals.items()}
        except Exception:
            report["restored"] = False
            report["reason"] = "restoration_failed"
            report["status"] = "incomplete"
        report["supervisorEventOverflow"] = journal.overflow
        if journal.overflow or CANCELLED:
            report["status"] = "incomplete"
        journal.emit("supervisor.end", restored=report["restored"], cancelled=CANCELLED, complete=report["status"] == "diagnostic_complete")
        journal.close()
        save_json(publish / "result.json", report)
        for sig, old in old_handlers.items():
            signal.signal(sig, old)
        libc.prctl(36, prior_subreaper.value, 0, 0, 0)
    # A diagnostic red remains red; parent integration failure is never made green.
    return 0 if report["status"] == "diagnostic_complete" and report["restored"] and all(item["exit"] == 0 for item in report["cases"]) else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Invalid:
        print("CI_DIAGNOSTIC_PREFLIGHT_FAILURE", file=sys.stderr)
        raise SystemExit(2)
    except Exception:
        print("CI_DIAGNOSTIC_SUPERVISOR_FAILURE", file=sys.stderr)
        raise SystemExit(2)
