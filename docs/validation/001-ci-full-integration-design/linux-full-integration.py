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

BASE = "43599002a0da6e5db887c35cf221d018e6975c77"
SOURCE_PATHS = {
    "apps/loom/src/tooling/dev/watcher.ts", "apps/loom/src/tooling/dev/coordinator.ts",
    "apps/loom/src/tooling/dev/development.ts", "apps/loom/src/tooling/codegen/lock.ts",
    "packages/e2e/integration/dev.test.ts", "packages/e2e/integration/provision-cli.test.ts",
    "apps/loom/src/tooling/dev/ci-trace.ts", "turbo.json",
}
ARTIFACT = Path(__file__).resolve().parent
ROOT = ARTIFACT.parents[2]
MIB = 1024 * 1024
HEX = re.compile(r"[0-9a-f]{64}\Z")
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\Z")
TRACE_NAME = re.compile(r"([1-9][0-9]*)-([0-9a-f-]{36})\.jsonl\Z")
CANCELLED = False
WORKLOAD = ["bun", "run", "test:integration"]
DIAGNOSTIC = "001-full-435-r1"
STAGES = set("""watch.create watch.event watch.stop.begin watch.stop.end coordinator.create
coordinator.invalidate coordinator.ready revision.cancel revision.begin revision.success
revision.failure revision.end update.begin candidate.ready sync.begin sync.end runtime.begin
runtime.ready active.installed lock.wait lock.acquired lock.release.begin lock.release.end
dev.fixture.begin dev.obsolete.write dev.provider.entered dev.intermediate.write dev.latest.write
dev.provider.resumed dev.expected.prepare.begin dev.expected.prepare.end dev.latest.poll
dev.latest.wait.end dev.cleanup.begin dev.cleanup.end provision.fixture.begin provision.child.start
provision.child.spawned provision.child.exit provision.child.await.end provision.cleanup.begin
provision.cleanup.end trace.truncated dev.credentials.restored dev.recovery.write.begin
dev.recovery.write.end dev.recovery.poll dev.recovery.wait.end dev.recovery.settled
watch.admitted watch.error revision.check candidate.unchanged admission.begin admission.install admission.end""".split())
HASH_FIELDS = {"rootHash", "candidateHash", "expectedHash", "activeHash", "filenameHash"}
ID_FIELDS = {"operation", "coordinator", "event"}
BOOL_FIELDS = {"aborted", "pending", "failed", "watchFailed", "stopped"}
INT_FIELDS = {"revision", "currentRevision", "childPid", "caseIndex"}
ENUM_FIELDS = {"filenameKind": {"missing", "schema", "generated", "internal", "other"},
               "eventKind": {"rename", "change", "other"}}
COMMON = {"schema", "diagnostic", "surface", "pid", "instance", "sequence", "ns", "stage"}
REQUIRED = {
    "watch.admitted": {"rootHash", "event"},
    "revision.check": {"coordinator", "revision", "currentRevision", "stopped", "aborted"},
    "dev.credentials.restored": {"rootHash", "expectedHash"},
    "dev.recovery.write.begin": {"rootHash", "candidateHash"},
    "dev.recovery.write.end": {"rootHash", "candidateHash"},
    "dev.recovery.poll": {"rootHash", "expectedHash", "failed", "watchFailed"},
    "dev.recovery.wait.end": {"rootHash", "expectedHash", "failed"},
    "dev.recovery.settled": {"rootHash", "failed"},
    "admission.begin": {"rootHash", "revision", "candidateHash", "aborted"},
    "admission.install": {"rootHash", "revision", "candidateHash", "aborted"},
    "admission.end": {"rootHash", "revision", "failed", "aborted"},
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


PREFLIGHT_FILE_IDS = {
    '.github/workflows/ci.yml': 'file_01',
    'apps/loom/package.json': 'file_02',
    'apps/loom/vite.config.ts': 'file_03',
    'docs/validation/001-ci-full-integration-design/author-overlays.py': 'file_04',
    'docs/validation/001-ci-full-integration-design/freeze-r1.json': 'file_05',
    'docs/validation/001-ci-full-integration-design/instrumentation.patch': 'file_06',
    'docs/validation/001-ci-full-integration-design/linux-full-integration-r1.py': 'file_07',
    'docs/validation/001-ci-full-integration-design/linux-full-integration-r2.py': 'file_08',
    'docs/validation/001-ci-full-integration-design/linux-full-integration.py': 'file_09',
    'docs/validation/001-ci-full-integration-design/manifest.json': 'file_10',
    'docs/validation/001-ci-full-integration-design/overlay/apps/loom/src/tooling/codegen/lock.ts': 'file_11',
    'docs/validation/001-ci-full-integration-design/overlay/apps/loom/src/tooling/dev/ci-trace.ts': 'file_12',
    'docs/validation/001-ci-full-integration-design/overlay/apps/loom/src/tooling/dev/coordinator.ts': 'file_13',
    'docs/validation/001-ci-full-integration-design/overlay/apps/loom/src/tooling/dev/development.ts': 'file_14',
    'docs/validation/001-ci-full-integration-design/overlay/apps/loom/src/tooling/dev/watcher.ts': 'file_15',
    'docs/validation/001-ci-full-integration-design/overlay/packages/e2e/integration/dev.test.ts': 'file_16',
    'docs/validation/001-ci-full-integration-design/overlay/packages/e2e/integration/provision-cli.test.ts': 'file_17',
    'docs/validation/001-ci-full-integration-design/overlay/turbo.json': 'file_18',
    'docs/validation/001-ci-full-integration-design/protocol.md': 'file_19',
    'docs/validation/001-ci-full-integration-design/review-r1.md': 'file_20',
    'docs/validation/001-ci-full-integration-design/supervisor-freeze-r1.json': 'file_21',
    'docs/validation/001-ci-full-integration-design/supervisor-freeze-r2.json': 'file_22',
    'docs/validation/001-ci-full-integration-design/supervisor-freeze-r3.json': 'file_23',
    'docs/validation/001-ci-full-integration-design/supervisor-r2.patch': 'file_24',
    'docs/validation/001-ci-full-integration-design/supervisor-r3.patch': 'file_25',
    'docs/validation/001-ci-full-integration-design/supervisor-responses-r2.md': 'file_26',
    'docs/validation/001-ci-full-integration-design/supervisor-responses-r3.md': 'file_27',
    'docs/validation/001-ci-full-integration-design/supervisor-review-r1.md': 'file_28',
    'docs/validation/001-ci-full-integration-design/supervisor-review-r2.md': 'file_29',
    'docs/validation/001-ci-full-integration-design/supervisor-source-r1.md': 'file_30',
    'docs/validation/001-ci-full-integration-design/supervisor-source-r2.md': 'file_31',
    'docs/validation/001-ci-full-integration-design/supervisor-source-r3.md': 'file_32',
    'docs/validation/001-ci-full-integration-design/supervisor-source-scope-r1.md': 'file_33',
    'docs/validation/001-ci-full-integration-design/workflow-proposal.patch': 'file_34',
    'node_modules/turbo/package.json': 'file_35',
    'package.json': 'file_36',
    'packages/e2e/package.json': 'file_37',
    'turbo.json': 'file_38',
}
PREFLIGHT_READ_STAGES = {"freeze", "supervisor", "design", "artifact", "input", "graph", "dependency", "manifest"}


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


def record_preflight_refusal(report: dict, stage: str, file_id: str,
                             info: os.stat_result, limit: int) -> None:
    # Optional metadata must never replace the original refusal or publish arbitrary values.
    try:
        if stage not in PREFLIGHT_READ_STAGES or file_id not in PREFLIGHT_FILE_IDS.values():
            return
        if not all(type(value) is int and 0 <= value <= (1 << 63) - 1
                   for value in (info.st_nlink, info.st_size, limit)):
            return
        regular = stat.S_ISREG(info.st_mode)
        failed = []
        if not regular:
            failed.append("not_regular")
        if stage == "dependency" and file_id == "file_35":
            if info.st_nlink < 1:
                failed.append("link_count_not_positive")
        elif info.st_nlink != 1:
            failed.append("link_count_not_one")
        if info.st_size > limit:
            failed.append("size_exceeds_bound")
        value = {"status": "observed", "stage": stage, "file": file_id,
                 "regular": regular, "nlink": info.st_nlink, "size": info.st_size,
                 "bound": limit, "failedPredicates": failed}
        if len(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()) <= 1024:
            report["preflightRefusal"] = value
    except Exception:
        # The caller marked its existing status container unavailable before this call.
        pass


def regular_bytes(path: Path, limit: int,
                  refusal: tuple[dict, str, str] | None = None) -> bytes:
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, "rb") as handle:
        info = os.fstat(handle.fileno())
        valid = stat.S_ISREG(info.st_mode) and info.st_nlink == 1 and info.st_size <= limit
        if not valid and refusal is not None:
            try:
                refusal[0]["preflightRefusal"]["status"] = "unavailable"
                record_preflight_refusal(*refusal, info, limit)
            except Exception:
                # Include argument assembly and function entry in optional containment.
                pass
        require(valid, "file_type_or_bound")
        data = handle.read(limit + 1)
    require(len(data) <= limit, "file_bound")
    return data


def installed_turbo_metadata(report: dict) -> bytes:
    # This fixed metadata read alone permits hardlinks; regular_bytes stays strict.
    path = ROOT / "node_modules/turbo/package.json"
    parent = path.parent.resolve(strict=True)
    require(parent.is_relative_to(ROOT / "node_modules"), "dependency_parent_invalid")
    named_before = path.lstat()
    require(not stat.S_ISLNK(named_before.st_mode), "dependency_symlink")
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, "rb") as handle:
        before = os.fstat(handle.fileno())
        valid = stat.S_ISREG(before.st_mode) and before.st_nlink >= 1 and 0 <= before.st_size <= MIB
        if not valid:
            try:
                report["preflightRefusal"]["status"] = "unavailable"
                record_preflight_refusal(report, "dependency", "file_35", before, MIB)
            except Exception:
                pass
        require(valid, "file_type_or_bound")
        def identity(info: os.stat_result) -> tuple:
            return (info.st_dev, info.st_ino, info.st_mode, info.st_nlink,
                    info.st_size, info.st_mtime_ns, info.st_ctime_ns)
        expected = identity(before)
        require(identity(named_before) == expected, "dependency_identity_changed")
        data = handle.read(MIB + 1)
        middle = os.fstat(handle.fileno())
        require(len(data) == before.st_size and len(data) <= MIB and
                identity(middle) == expected, "dependency_read_changed")
        first_hash = digest(data)
        handle.seek(0)
        second = handle.read(MIB + 1)
        after = os.fstat(handle.fileno())
        named_after = path.lstat()
        require(len(second) == before.st_size and len(second) <= MIB and
                identity(after) == expected and identity(named_after) == expected and
                path.parent.resolve(strict=True) == parent and
                digest(second) == first_hash, "dependency_read_changed")
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
    require(not path.exists() or path.stat().st_nlink == 1, "source_hardlink")
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


def proc_entry(pid: int) -> tuple[int, int, int, str] | None:
    try:
        data = (Path("/proc") / str(pid) / "stat").read_bytes()
        fields = data[data.rfind(b")") + 2:].split()
        return (int(fields[1]), int(fields[2]), int(fields[19]), fields[0].decode("ascii"))
    except (FileNotFoundError, ProcessLookupError):
        return None
    except (OSError, ValueError, IndexError, UnicodeError):
        raise Invalid("proc_snapshot_incomplete") from None


def proc_snapshot() -> dict[int, tuple[int, int, int, str]]:
    result = {}
    for entry in Path("/proc").iterdir():
        if not entry.name.isdigit():
            continue
        pid = int(entry.name)
        value = proc_entry(pid)
        if value is not None:
            result[pid] = value
    return result


class Journal:
    def __init__(self, path: Path):
        self.handle = path.open("xb")
        os.chmod(path, 0o600)
        self.count = 0
        self.overflow = False
        self.failed = False

    def emit(self, stage: str, **fields: object) -> None:
        # Telemetry failure must never prevent emergency signaling/reaping.
        if self.failed:
            return
        if self.count >= 4080:
            self.overflow = True
            return
        try:
            self.count += 1
            line = json.dumps({"schema": 1, "sequence": self.count, "ns": time.monotonic_ns(), "stage": stage, **fields}).encode() + b"\n"
            require(len(line) <= 4096, "supervisor_record_bound")
            self.handle.write(line)
            self.handle.flush()
        except Exception:
            self.failed = True

    def close(self) -> None:
        try:
            self.handle.flush()
            os.fsync(self.handle.fileno())
        except Exception:
            self.failed = True
        finally:
            try:
                self.handle.close()
            except Exception:
                self.failed = True


class OwnedCommand:
    def __init__(self, label: str, argv: list[str], cwd: Path, env: dict[str, str], seconds: int, private: Path, journal: Journal, traces: Path):
        self.label, self.argv, self.cwd, self.env = label, argv, cwd, env
        self.seconds, self.private, self.journal, self.traces = seconds, private, journal, traces
        self.known: dict[tuple[int, int], tuple[int, int, int]] = {}  # (pid,start) -> pidfd,ppid,pgid
        self.current: dict[int, tuple[int, int]] = {}
        self.exited: set[tuple[int, int]] = set()
        self.reaped: set[tuple[int, int]] = set()
        self.process: subprocess.Popen | None = None
        self.root_fd: int | None = None
        self.root_identity: tuple[int, int] | None = None
        self.forced = False
        self.reason: str | None = None
        self.cleanup_errors: set[str] = set()
        self.ownership_overflow = False
        self.output_bytes = 0
        self.peak_observed = 0
        self.remaining: list | None = None
        self.remaining_count: int | None = None
        self.emergency_attempts = 0
        self.emergency_fds: dict[tuple[int, int], int] = {}

    def owned_snapshot(self) -> dict[tuple[int, int], tuple[int, int, int, str]]:
        snapshot = proc_snapshot()
        owned = {pid: info for pid, info in snapshot.items() if (pid, info[2]) in self.known or (pid, info[2]) in self.emergency_fds or info[0] == os.getpid()}
        changed = True
        while changed:
            changed = False
            for pid, info in snapshot.items():
                if pid not in owned and info[0] in owned:
                    owned[pid] = info
                    changed = True
        return {(pid, info[2]): info for pid, info in owned.items()}

    def verify_owned_identity(self, identity: tuple[int, int]) -> bool:
        # Read the child before its ancestry: a stale mixed-time /proc snapshot is not ownership proof.
        cursor = identity[0]
        visited = set()
        for depth in range(256):
            if cursor in visited or cursor == os.getpid():
                return False
            visited.add(cursor)
            info = proc_entry(cursor)
            if info is None or depth == 0 and info[2] != identity[1]:
                return False
            if (cursor, info[2]) in self.known or (cursor, info[2]) in self.emergency_fds or info[0] == os.getpid():
                return True
            cursor = info[0]
        return False

    def discover(self) -> dict:
        alive = self.owned_snapshot()
        self.current = {}
        for identity, (ppid, pgid, started, _state) in alive.items():
            pid = identity[0]
            if identity not in self.known:
                if len(self.known) >= 256:
                    self.ownership_overflow = True
                    continue
                try:
                    fd = os.pidfd_open(pid)
                except ProcessLookupError:
                    continue
                try:
                    current = proc_entry(pid)
                    if current is None or current[2] != started or not self.verify_owned_identity(identity):
                        os.close(fd)
                        continue
                except Exception:
                    os.close(fd)
                    raise
                self.known[identity] = (fd, ppid, pgid)
                self.journal.emit("process.observed", command=self.label, pid=pid, ppid=ppid, pgid=pgid, startTicks=started)
            self.current[pid] = identity
        self.peak_observed = max(self.peak_observed, len(alive))
        for identity in self.known:
            if identity not in alive and identity not in self.exited:
                self.exited.add(identity)
                self.journal.emit("process.no_longer_observed", command=self.label, pid=identity[0], startTicks=identity[1])
        # Normal monitoring stops on overflow. Emergency cleanup never calls this method.
        require(not self.ownership_overflow, "owned_identity_bound")
        return alive

    def unambiguous_pid(self, pid: int) -> bool:
        # Trace files have PID but no kernel start tick: reuse is explicitly ambiguous.
        return not self.ownership_overflow and sum(identity[0] == pid for identity in self.known) == 1

    def reap_fd(self, identity: tuple[int, int], fd: int) -> None:
        if self.process is not None and (identity == self.root_identity or
                identity[0] == self.process.pid and self.process.returncode is None):
            # Even if the initial /proc read failed, the unreaped direct child's
            # numeric PID cannot be reused. Never consume Popen's wait status.
            self.process.poll()  # Popen owns its unreaped direct child's wait status.
            return
        if identity in self.reaped:
            return
        try:
            result = os.waitid(os.P_PIDFD, fd, os.WEXITED | os.WNOHANG)
            if result is not None:
                self.reaped.add(identity)
                self.journal.emit("process.reaped", command=self.label, pid=identity[0], startTicks=identity[1], waitStatus=result.si_status, waitCode=result.si_code)
        except ChildProcessError:
            pass
        except OSError:
            self.cleanup_errors.add("pidfd_reap_failed")

    def reap(self) -> None:
        if self.process is not None:
            self.process.poll()
        for identity, (fd, _ppid, _pgid) in self.known.items():
            self.reap_fd(identity, fd)
        for identity, fd in self.emergency_fds.items():
            self.reap_fd(identity, fd)

    def send_fd(self, identity: tuple[int, int], fd: int, sig: int) -> None:
        try:
            signal.pidfd_send_signal(fd, sig)
            self.journal.emit("process.signal", command=self.label, pid=identity[0], startTicks=identity[1], signal=sig)
        except ProcessLookupError:
            pass
        except OSError:
            self.cleanup_errors.add("pidfd_signal_failed")

    def emergency_signal(self, sig: int) -> None:
        # Always attempt every retained pidfd first, even if /proc, limits, or the journal failed.
        if self.root_fd is not None:
            try:
                signal.pidfd_send_signal(self.root_fd, sig)
            except ProcessLookupError:
                pass
            except OSError:
                self.cleanup_errors.add("root_pidfd_signal_failed")
        elif self.process is not None and self.process.returncode is None:
            # No poll/reap can interleave here: an unreaped direct child PID cannot be reused.
            try:
                self.process.send_signal(sig)
            except ProcessLookupError:
                pass
            except OSError:
                self.cleanup_errors.add("root_signal_failed")
        for identity, (fd, _ppid, _pgid) in self.known.items():
            self.send_fd(identity, fd, sig)
        # These lifetime-pinned handles bypass acquisition budgets on EVERY
        # escalation/reap pass. Repeated TERM cannot exhaust their KILL capacity.
        for identity, fd in self.emergency_fds.items():
            self.send_fd(identity, fd, sig)
            self.reap_fd(identity, fd)
        try:
            alive = self.owned_snapshot()
        except Exception:
            self.cleanup_errors.add("emergency_inventory_unavailable")
            return
        for identity, _info in alive.items():
            if identity in self.known or identity in self.emergency_fds:
                continue
            if self.emergency_attempts >= 4096:
                self.cleanup_errors.add("emergency_identity_budget")
                break
            self.emergency_attempts += 1
            fd = None
            try:
                fd = os.pidfd_open(identity[0])
                current = proc_entry(identity[0])
                if current is None or current[2] != identity[1] or not self.verify_owned_identity(identity):
                    continue
                self.emergency_fds[identity] = fd
                # Ownership was established for this exact lifetime in the ancestry snapshot.
                self.send_fd(identity, fd, sig)
                self.reap_fd(identity, fd)
            except ProcessLookupError:
                pass
            except Exception:
                self.cleanup_errors.add("emergency_identity_unavailable")
            finally:
                if fd is not None and identity not in self.emergency_fds:
                    try:
                        os.close(fd)
                    except OSError:
                        self.cleanup_errors.add("emergency_fd_close_failed")

    def cleanup(self) -> bool:
        self.journal.emit("cleanup.begin", command=self.label)
        try:
            self.reap()
            alive = self.owned_snapshot()
        except Exception:
            alive = None
            self.cleanup_errors.add("initial_cleanup_inventory_unavailable")
        if alive is None or alive:
            self.forced = True
            for sig in (signal.SIGTERM, signal.SIGKILL):
                self.emergency_signal(sig)
                end = time.monotonic() + 2
                while time.monotonic() < end:
                    try:
                        self.reap()
                        alive = self.owned_snapshot()
                        if not alive:
                            break
                        # Includes newly adopted/overflow identities; never re-enters capped discovery.
                        self.emergency_signal(sig)
                    except Exception:
                        self.cleanup_errors.add("cleanup_inventory_unavailable")
                    time.sleep(0.05)
                if alive is not None and not alive:
                    break
        try:
            self.reap()
            alive = self.owned_snapshot()
            self.remaining_count = len(alive)
            self.remaining = [{"pid": identity[0], "startTicks": identity[1], "pgid": info[1]} for identity, info in list(alive.items())[:256]]
        except Exception:
            self.cleanup_errors.add("final_cleanup_inventory_unavailable")
            self.remaining_count = None
            self.remaining = None  # Unavailable evidence is never an empty/zero audit.
        clean = self.remaining_count == 0 and not self.cleanup_errors
        self.journal.emit("cleanup.end", command=self.label, remaining=self.remaining_count, forced=self.forced, established=clean)
        return clean

    def trace_bounds(self) -> None:
        trace_inventory(self.traces)

    def run(self) -> dict:
        clean = False
        output = self.private / (self.label + ".console")
        selector = selectors.DefaultSelector()
        started = time.monotonic()
        tee = self.label == "integration"
        pending_output = bytearray()
        stdout_blocking = None
        try:
            if tee:
                stdout_blocking = os.get_blocking(sys.stdout.fileno())
                os.set_blocking(sys.stdout.fileno(), False)
            self.process = subprocess.Popen(self.argv, cwd=self.cwd, env=self.env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
            self.root_fd = os.pidfd_open(self.process.pid)
            root_info = proc_entry(self.process.pid)
            require(root_info is not None, "root_identity_unavailable")
            self.root_identity = (self.process.pid, root_info[2])
            self.journal.emit("command.spawned", command=self.label, pid=self.process.pid)
            self.discover()
            require(self.process.stdout is not None, "stdout_pipe_missing")
            os.set_blocking(self.process.stdout.fileno(), False)
            selector.register(self.process.stdout, selectors.EVENT_READ, "read")
            with output.open("xb") as console:
                os.chmod(output, 0o600)
                while self.process.poll() is None or selector.get_map():
                    self.reap()
                    self.discover()
                    self.trace_bounds()
                    require(not self.journal.overflow and not self.journal.failed, "supervisor_journal_failed")
                    require(not CANCELLED, "cancelled")
                    require(time.monotonic() - started < self.seconds, "supervisor_ceiling")
                    for key, _mask in selector.select(0.05):
                        if key.data == "tee":
                            try:
                                written = os.write(sys.stdout.fileno(), pending_output[:65536])
                            except BlockingIOError:
                                continue
                            require(written > 0, "console_forward_failed")
                            del pending_output[:written]
                            if not pending_output:
                                selector.unregister(sys.stdout.fileno())
                            continue
                        data = os.read(key.fileobj.fileno(), 65536)
                        if not data:
                            selector.unregister(key.fileobj)
                            continue
                        self.output_bytes += len(data)
                        require(self.output_bytes <= (32 if tee else 8) * MIB, "console_bound")
                        console.write(data)
                        if tee:
                            was_empty = not pending_output
                            pending_output.extend(data)
                            if was_empty:
                                selector.register(sys.stdout.fileno(), selectors.EVENT_WRITE, "tee")
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
                self.cleanup_errors.add("ownership_cleanup_error")
                # Last-resort retained-fd signaling is independent of discovery and logging.
                for sig in (signal.SIGTERM, signal.SIGKILL):
                    self.emergency_signal(sig)
                clean = False
            selector.close()
            if stdout_blocking is not None:
                try:
                    os.set_blocking(sys.stdout.fileno(), stdout_blocking)
                except OSError:
                    self.cleanup_errors.add("console_mode_restore_failed")
                    clean = False
            if self.process is not None and self.process.stdout is not None:
                self.process.stdout.close()
            for fd, _ppid, _pgid in self.known.values():
                try:
                    os.close(fd)
                except OSError:
                    self.cleanup_errors.add("retained_fd_close_failed")
                    clean = False
            for fd in self.emergency_fds.values():
                try:
                    os.close(fd)
                except OSError:
                    self.cleanup_errors.add("emergency_retained_fd_close_failed")
                    clean = False
            if self.root_fd is not None:
                try:
                    os.close(self.root_fd)
                except OSError:
                    self.cleanup_errors.add("root_fd_close_failed")
                    clean = False
        result = {"label": self.label, "exit": None if self.process is None else self.process.poll(),
                  "reason": self.reason, "cleanupClean": clean, "forcedCleanup": self.forced,
                  "cleanupErrors": sorted(self.cleanup_errors), "ownershipOverflow": self.ownership_overflow,
                  "peakObservedProcesses": self.peak_observed, "observedProcessIdentities": len(self.known),
                  "consoleBytes": self.output_bytes, "elapsedMs": round((time.monotonic() - started) * 1000),
                  "remaining": self.remaining, "remainingCount": self.remaining_count,
                  "remainingTruncated": self.remaining_count is not None and self.remaining_count > 256}
        self.journal.emit("command.end", command=self.label, exit=result["exit"], reason=self.reason, cleanupClean=clean, forcedCleanup=self.forced, remaining=self.remaining_count)
        return result


def trace_inventory(directory: Path) -> list[tuple[str, Path, os.stat_result]]:
    """Bounded final and live inventory, including hard-link checks before any publication."""
    result = []
    total = 0
    for case in directory.iterdir():
        require(case.name == "full" and stat.S_ISDIR(case.lstat().st_mode), "trace_directory_type")
        for file in case.iterdir():
            info = file.lstat()
            require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1, "trace_file_type")
            require(info.st_size <= MIB, "trace_file_bound")
            total += info.st_size
            require(len(result) < 64 and total <= 8 * MIB, "trace_total_bound")
            result.append((case.name, file, info))
    return sorted(result, key=lambda item: (item[0], item[1].name))


def valid_record(record: object, pid: int, instance: str) -> bool:
    if not isinstance(record, dict) or type(record.get("schema")) is not int or record.get("schema") != 1 or type(record.get("pid")) is not int or record.get("pid") != pid or record.get("instance") != instance:
        return False
    if record.get("diagnostic") != DIAGNOSTIC or record.get("surface") not in {"source", "built", "other"}:
        return False
    if type(record.get("sequence")) is not int or not 1 <= record["sequence"] <= 4097:
        return False
    if record.get("stage") == "trace.cost":
        return set(record) == {"schema", "diagnostic", "surface", "pid", "instance", "sequence", "stage", "elapsedNs"} and isinstance(record.get("elapsedNs"), str) and re.fullmatch(r"[0-9]{1,30}", record["elapsedNs"]) is not None
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


def inventory_signature(inventory: list) -> list:
    return [(owner, file.name, info.st_dev, info.st_ino, info.st_size, info.st_nlink)
            for owner, file, info in inventory]


def unique_json(data: bytes) -> object:
    def pairs(items: list) -> dict:
        result = {}
        for key, value in items:
            require(key not in result, "duplicate_json_key")
            result[key] = value
        return result
    return json.loads(data, object_pairs_hook=pairs)


def read_traces(command: OwnedCommand, staged: Path) -> tuple[list, dict]:
    require(command.remaining_count == 0 and not command.cleanup_errors, "trace_requires_clean_ownership")
    inventory = trace_inventory(command.traces)
    reasons = set()
    records = []
    read_total = reconstructed = 0
    for _owner, file, expected_info in inventory:
        match = TRACE_NAME.fullmatch(file.name)
        if match is None or UUID.fullmatch(match[2]) is None:
            reasons.add("trace_filename_invalid")
            continue
        pid, instance = int(match[1]), match[2]
        if not 1 <= pid < 2**31:
            reasons.add("trace_pid_invalid")
            continue
        if not command.unambiguous_pid(pid):
            reasons.add("trace_pid_not_observed")
        fd = os.open(file, os.O_RDONLY | os.O_NOFOLLOW)
        with os.fdopen(fd, "rb") as handle:
            actual = os.fstat(handle.fileno())
            require(stat.S_ISREG(actual.st_mode) and actual.st_nlink == 1 and
                    (actual.st_dev, actual.st_ino, actual.st_size) ==
                    (expected_info.st_dev, expected_info.st_ino, expected_info.st_size), "trace_inventory_changed")
            data = handle.read(MIB + 1)
            after = os.fstat(handle.fileno())
            require(len(data) == expected_info.st_size and after.st_size == actual.st_size and
                    after.st_nlink == 1, "trace_inventory_changed")
        read_total += len(data)
        require(read_total <= 8 * MIB, "trace_read_total_bound")
        expected = 1
        needs_cost = False
        safe = []
        surface = None
        for line in data.splitlines(keepends=True):
            if len(line) > 4096 or not line.endswith(b"\n"):
                reasons.add("trace_line_invalid")
                break
            try:
                record = unique_json(line)
                valid = valid_record(record, pid, instance)
            except Exception:
                valid = False
            if not valid:
                reasons.add("trace_schema_invalid")
                break
            if surface is not None and surface != record["surface"]:
                reasons.add("trace_surface_changed")
                break
            surface = record["surface"]
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
            # Never publish a stage without its validated cost partner.
            safe.pop()
        destination = staged / ("trace-" + file.name)
        fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        published = []
        file_bytes = 0
        with os.fdopen(fd, "wb") as handle:
            for offset in range(0, len(safe), 2):
                pair = safe[offset:offset + 2]
                lines = [json.dumps(record, sort_keys=True, separators=(",", ":")).encode() + b"\n"
                         for record in pair]
                size = sum(map(len, lines))
                # Reserve the other four 1 MiB publication slots (result, journal,
                # before/after manifests) within the unchanged 12 MiB aggregate.
                if any(len(line) > 4096 for line in lines) or file_bytes + size > MIB or reconstructed + size > 8 * MIB:
                    reasons.add("trace_publication_prefix_bounded")
                    break
                handle.write(b"".join(lines))
                file_bytes += size
                reconstructed += size
                published.append(pair[0])
        records.extend(published)
    if not inventory:
        reasons.add("trace_missing")
    require(inventory_signature(trace_inventory(command.traces)) == inventory_signature(inventory), "trace_inventory_changed")
    return records, {"syntaxComplete": not reasons, "reasons": sorted(reasons),
                     "files": len(inventory), "validatedRecords": len(records),
                     "inventorySha256": digest(json.dumps(inventory_signature(inventory)).encode())}


def lineage(records: list, command: OwnedCommand) -> dict:
    reasons = set()
    begins = [r for r in records if r["stage"] == "dev.fixture.begin" and r["surface"] == "source"]
    if len(begins) != 1 or "rootHash" not in begins[0]:
        return {"complete": False, "pipelineObserved": False,
                "reasons": ["target_fixture_ambiguous_or_missing"], "rootHash": None,
                "coordinators": [], "recovery": None, "latest": None}
    begin = begins[0]
    root = begin["rootHash"]
    target = [r for r in records if r.get("rootHash") == root]
    fixture = sorted((r for r in target if r["surface"] == "source" and
                      (r["pid"], r["instance"]) == (begin["pid"], begin["instance"]) and
                      r["sequence"] >= begin["sequence"]), key=lambda r: r["sequence"])
    builtin = [r for r in records if r["surface"] == "built" and command.unambiguous_pid(r["pid"])]
    creates = [r for r in builtin if r["stage"] == "coordinator.create" and r.get("rootHash") == root]
    coordinators, installs = [], []

    def one(rows: list, stage: str) -> dict | None:
        found = [r for r in rows if r["stage"] == stage]
        return found[0] if len(found) == 1 else None

    def ordered(*rows: dict | None) -> bool:
        return all(row is not None for row in rows) and all(
            left["sequence"] < right["sequence"] and int(left["ns"]) <= int(right["ns"])
            for left, right in zip(rows, rows[1:]))

    for create in creates:
        identity = (create["pid"], create["instance"], create["coordinator"])
        cohort = sorted((r for r in builtin if
                         (r["pid"], r["instance"], r.get("coordinator")) == identity),
                        key=lambda r: r["sequence"])
        # Construction anchors identity, not the async context of every later
        # entry point: flush() can legitimately emit rootless lifecycle rows.
        identity_errors = set()
        if one(cohort, "coordinator.create") is None:
            identity_errors.add("coordinator_identity_ambiguous")
        if any("rootHash" in r and r["rootHash"] != root for r in cohort):
            identity_errors.add("coordinator_explicit_root_conflict")
        watches = [r for r in builtin if r["stage"] == "watch.create" and r.get("rootHash") == root and
                   (r["pid"], r["instance"]) == identity[:2] and r["sequence"] < create["sequence"]]
        if not watches:
            identity_errors.add("target_built_watch_coordinator_missing")
        reasons.update(identity_errors)
        revision_rows = []
        installed_before = False
        revisions = sorted({r["revision"] for r in cohort if r["stage"] == "revision.begin" and "revision" in r})
        if not revisions:
            reasons.add("target_revision_missing")
        if any(r["stage"] in {"update.begin", "candidate.ready", "active.installed", "revision.success",
                              "revision.failure", "revision.end"} and r.get("revision") not in revisions for r in cohort):
            reasons.add("orphan_revision_evidence")
        for revision in revisions:
            rows = [r for r in cohort if r.get("revision") == revision]
            errors = set(identity_errors)
            start, update, end = (one(rows, stage) for stage in ("revision.begin", "update.begin", "revision.end"))
            terminals = [r for r in rows if r["stage"] in {"revision.success", "revision.failure"}]
            terminal = terminals[0] if len(terminals) == 1 else None
            if not ordered(create, start, update, terminal, end):
                errors.add("revision_lifecycle_incomplete")
            if terminal is not None and end is not None and (type(terminal.get("aborted")) is not bool or
                                                            end.get("aborted") != terminal.get("aborted")):
                errors.add("revision_terminal_state_incomplete")
            cancelled = terminal is not None and terminal.get("aborted") is True
            success = terminal is not None and terminal["stage"] == "revision.success" and terminal.get("aborted") is False
            outcome = "cancelled" if cancelled else "success" if success else "failure" if terminal else "unfinished"
            stage_names = ("candidate.ready", "candidate.unchanged", "sync.begin", "sync.end", "runtime.begin",
                           "runtime.ready", "admission.begin", "admission.install", "active.installed", "admission.end")
            points = {stage: one(rows, stage) for stage in stage_names}
            if any(sum(r["stage"] == stage for r in rows) > 1 for stage in stage_names):
                errors.add("revision_stage_ambiguous")
            candidate, unchanged, active = (points[stage] for stage in ("candidate.ready", "candidate.unchanged", "active.installed"))
            checks = [r for r in rows if r["stage"] == "revision.check"]
            def checked(left: dict | None, right: dict | None) -> bool:
                return any(ordered(left, check, right) and check.get("currentRevision") == revision and
                           check.get("aborted") is False and check.get("stopped") is False for check in checks)
            # Validate each observed prefix; early failure/cancellation does not owe later success stages.
            previous = update
            for stage in ("candidate.ready", "sync.begin", "sync.end", "runtime.begin", "runtime.ready",
                          "admission.begin", "admission.install", "active.installed", "admission.end"):
                point = points[stage]
                if point is not None:
                    if not ordered(previous, point, terminal, end):
                        errors.add("revision_stage_order_incomplete")
                    previous = point
            dependencies = (("sync.begin", "candidate.ready"), ("sync.end", "sync.begin"),
                            ("runtime.begin", "sync.end"), ("runtime.ready", "runtime.begin"),
                            ("admission.begin", "runtime.ready"), ("admission.install", "admission.begin"),
                            ("active.installed", "runtime.ready"), ("admission.end", "admission.begin"))
            for stage, prerequisite in dependencies:
                if points[stage] is not None and not ordered(points[prerequisite], points[stage]):
                    errors.add("revision_prefix_incomplete")
            for left, right in ((candidate, unchanged or points["sync.begin"]),
                                (points["sync.begin"], points["sync.end"]),
                                (points["runtime.ready"], points["admission.begin"] or active)):
                if right is not None and not checked(left, right):
                    errors.add("revision_check_incomplete")
            if unchanged is not None:
                if not ordered(candidate, unchanged, terminal, end) or any(points[stage] for stage in stage_names[2:]):
                    errors.add("unchanged_path_invalid")
                if not candidate or not candidate.get("candidateHash") or not (
                    candidate["candidateHash"] == unchanged.get("candidateHash") == unchanged.get("activeHash")):
                    errors.add("unchanged_version_incomplete")
            path = "unchanged" if unchanged else "replacement" if installed_before or points["admission.begin"] else "initial"
            version = candidate.get("candidateHash") if candidate else None
            if active is not None:
                if not version or active.get("activeHash") != version:
                    errors.add("installed_version_incomplete")
                if path == "replacement" and not ordered(points["admission.begin"], points["admission.install"], active):
                    errors.add("replacement_install_incomplete")
                if path == "initial" and any(points[stage] for stage in ("admission.begin", "admission.install", "admission.end")):
                    errors.add("initial_path_ambiguous")
                installed_before = True
            for stage in ("admission.begin", "admission.install"):
                point = points[stage]
                if point is not None and (not version or point.get("candidateHash") != version or point.get("aborted") is not False):
                    errors.add("admission_version_or_cancellation_invalid")
            if success and not unchanged:
                if active is None:
                    errors.add("successful_install_missing")
                if path == "replacement" and (not ordered(points["admission.begin"], points["admission.install"], active,
                                                          points["admission.end"], terminal, end) or
                                               points["admission.end"].get("failed") is not False):
                    errors.add("replacement_completion_incomplete")
            if success and any(check.get("aborted") is not False or check.get("stopped") is not False or
                               check.get("currentRevision") != revision for check in checks):
                errors.add("successful_revision_check_invalid")
            row = {"revision": revision, "outcome": outcome, "path": path, "complete": not errors,
                   "reasons": sorted(errors), "stages": sorted({r["stage"] for r in rows}),
                   "versionHash": version, "ended": end is not None}
            revision_rows.append(row)
            reasons.update(errors)
            if success and active is not None and not errors:
                installs.append({"pid": identity[0], "instance": identity[1], "coordinator": identity[2],
                                 "revision": revision, "path": path, "versionHash": version,
                                 "installNs": int(active["ns"]), "endNs": int(end["ns"])})
        coordinators.append({"pid": identity[0], "instance": identity[1], "coordinator": identity[2], "revisions": revision_rows})
    if not installs:
        reasons.add("target_built_pipeline_missing")
    if not ordered(one(fixture, "dev.cleanup.begin"), one(fixture, "dev.cleanup.end")):
        reasons.add("dev_fixture_cleanup_incomplete")

    def progression(name: str, stages: tuple) -> dict:
        points = [one(fixture, stage) for stage in stages]
        rows = [r for r in fixture if r["stage"].startswith("dev." + name + ".")]
        result = {"complete": False, "reached": bool(rows), "observedStages": sorted({r["stage"] for r in rows}),
                  "predicateObserved": False, "revisionSettlementObserved": False,
                  "settlementBoundary": "recovery_settled" if name == "recovery" else "fixture_cleanup_begin",
                  "fixtureAssertionsProved": False,
                  "revision": None, "coordinator": None, "builtInstance": None}
        if not ordered(*points):
            reasons.add(name + "_progression_incomplete")
            return result
        wait = one(fixture, "dev." + name + ".wait.end")
        polls = [r for r in rows if r["stage"] == "dev." + name + ".poll" and r["sequence"] < wait["sequence"]]
        poll = polls[-1] if polls else None
        version = wait.get("activeHash")
        expected = wait.get("expectedHash")
        # Finally alone proves neither predicate success nor settlement.
        predicate = version is not None and expected is not None and (version != expected if name == "recovery" else version == expected)
        if not poll or not predicate or poll.get("activeHash") != version or poll.get("expectedHash") != expected:
            reasons.add(name + "_predicate_unproved")
            return result
        result["predicateObserved"] = True
        # Latest's wait-end precedes the fixture's settled await. Retirement and
        # failure clearing may finish afterward. Require the same revision to
        # succeed before observed teardown, not before the predicate observation.
        upper = one(fixture, "dev.recovery.settled") if name == "recovery" else one(fixture, "dev.cleanup.begin")
        if not ordered(wait, upper):
            reasons.add(name + "_settlement_boundary_missing")
            return result
        lower = one(fixture, "dev.recovery.write.begin") if name == "recovery" else one(fixture, "dev.intermediate.write")
        if name == "recovery" and (upper.get("failed") is not False or upper.get("activeHash") != version):
            reasons.add("recovery_settlement_unproved")
            return result
        if name == "latest" and one(fixture, "dev.expected.prepare.end").get("expectedHash") != version:
            reasons.add("latest_expected_version_unproved")
            return result
        matches = [item for item in installs if item["pid"] == begin["pid"] and item["path"] == "replacement" and
                   item["versionHash"] == version and int(lower["ns"]) <= item["installNs"] <= int(poll["ns"]) and
                   item["endNs"] <= int(upper["ns"])]
        if len(matches) != 1:
            reasons.add(name + "_revision_join_incomplete")
            return result
        match = matches[0]
        result.update(complete=True, revisionSettlementObserved=True, revision=match["revision"],
                      coordinator=match["coordinator"], builtInstance=match["instance"])
        return result

    recovery = progression("recovery", ("dev.credentials.restored", "dev.recovery.write.begin", "dev.recovery.write.end",
                                         "dev.recovery.wait.end", "dev.recovery.settled"))
    latest = progression("latest", ("dev.obsolete.write", "dev.provider.entered", "dev.intermediate.write", "dev.latest.write",
                                     "dev.provider.resumed", "dev.expected.prepare.begin", "dev.expected.prepare.end", "dev.latest.wait.end"))
    # Missing later stages after an earlier red stay incomplete, not an assertion or lost prefix.
    return {"complete": not reasons, "pipelineObserved": bool(installs), "reasons": sorted(reasons), "rootHash": root,
            "coordinators": coordinators, "recovery": recovery, "latest": latest}


def provisioning(records: list, command: OwnedCommand) -> dict:
    starts = [r for r in records if r["stage"] == "provision.fixture.begin" and r["surface"] == "source"]
    if len(starts) != 1 or "rootHash" not in starts[0]:
        return {"complete": False, "reasons": ["provision_fixture_ambiguous_or_missing"], "children": []}
    start = starts[0]
    cohort = [r for r in records if (r["pid"], r["instance"]) == (start["pid"], start["instance"])
              and r["surface"] == "source" and r["sequence"] >= start["sequence"]]
    reasons = set()
    rows = []
    for index in range(1, 9):
        selected = [r for r in cohort if r.get("caseIndex") == index]
        stages = ("provision.child.start", "provision.child.spawned", "provision.child.exit", "provision.child.await.end")
        matches = {stage: [r for r in selected if r["stage"] == stage] for stage in stages}
        complete = all(len(value) == 1 for value in matches.values())
        pids = {r["childPid"] for r in selected if "childPid" in r}
        pid = next(iter(pids)) if len(pids) == 1 else None
        observed = pid is not None and command.unambiguous_pid(pid)
        if not complete:
            reasons.add("child_lifecycle_incomplete")
        if selected and not observed:
            reasons.add("child_pid_not_observed_or_ambiguous")
        if complete:
            order = [matches[stage][0]["sequence"] for stage in stages]
            if order != sorted(order) or len(set(order)) != 4:
                reasons.add("child_lifecycle_order_invalid")
        exit_rows = matches["provision.child.exit"]
        rows.append({"caseIndex": index, "pid": pid, "observedLifetime": observed,
                     "exit": exit_rows[0]["childExit"] if len(exit_rows) == 1 else None,
                     "observedStages": sorted({r["stage"] for r in selected}), "complete": complete and observed})
    for stage in ("provision.cleanup.begin", "provision.cleanup.end"):
        if sum(r["stage"] == stage and r.get("rootHash") == start["rootHash"] for r in cohort) != 1:
            reasons.add("provision_fixture_cleanup_incomplete")
    if any("caseIndex" in r and not 1 <= r["caseIndex"] <= 8 for r in cohort):
        reasons.add("provision_index_invalid")
    return {"complete": not reasons, "reasons": sorted(reasons), "rootHash": start["rootHash"], "children": rows}


ANSI = re.compile(rb"\x1b\[[0-?]*[ -/]*[@-~]")
TARGET_NAMES = {
    "development": "development saves synchronize schema, references and serving runtime with failed-edit recovery",
    "provisioning": "branch provisioning CLI rejects unrelated options and redacts invalid declarations",
}
SKIP_NAMES = {
    "baseline_adoption": "schema-only baseline adopts verified DDL without replay and preserves quarantine",
    "pooler_cancellation": "abort stops PostgreSQL statements and releases retained locks through pooler",
}


def report_console(console: bytes) -> dict:
    # Only accept one unambiguous exact Turbo task group, never the last nested summary.
    text = ANSI.sub(b"", console).decode("utf-8", errors="replace")
    lines = text.splitlines()
    def task_body(name: str) -> dict | None:
        # These are raw workflow commands, not GitHub's rendered ##[group] log.
        # A matching closed successful Turbo group proves its terminal status.
        starts = [i for i, line in enumerate(lines) if line in {name, "::group::" + name}]
        if len(starts) != 1:
            return None
        start = starts[0]
        grouped = lines[start].startswith("::group::")
        base_depth = 1 if grouped else 0
        depth = base_depth
        body, top = [], []
        closed = False
        for line in lines[start + 1:]:
            bare = line.removeprefix("::group::")
            if re.fullmatch(r"(?:@[^ /:]+/)?[^ /:]+:(?:build|test:integration)", bare) or re.match(r"^\s*Tasks:\s", line):
                break
            if line.startswith("::group::"):
                depth += 1
                continue
            if line == "::endgroup::":
                if depth == 0:
                    return None
                depth -= 1
                if grouped and depth == 0:
                    closed = True
                    break
                continue
            body.append(line)
            if depth == base_depth:
                top.append(line)
        if depth != (0 if closed else base_depth):
            return None
        return {"body": body, "top": top, "successfulTerminal": grouped and closed}
    report = {"summary": None, "summaryStatus": "unavailable", "targets": {}, "namedSkips": {},
              "dependencyBuild": {"observed": False, "successfulTerminal": False, "cache": None, "taskHash": None},
              "integrationExecutedNotReplayed": False}
    build = task_body("kello:build")
    if build is not None:
        cache = [re.fullmatch(r"cache (hit, replaying logs|miss, executing) ([0-9a-f]{16})", line) for line in build["top"]]
        cache = [m for m in cache if m]
        if len(cache) == 1:
            report["dependencyBuild"] = {"observed": build["successfulTerminal"], "successfulTerminal": build["successfulTerminal"], "cache": "hit" if cache[0][1].startswith("hit") else "miss", "taskHash": cache[0][2]}
    body = task_body("@kello/e2e:test:integration")
    if body is None:
        report["summaryStatus"] = "unavailable_or_ambiguous"
        return report
    section = "\n".join(body["body"])
    top_section = "\n".join(body["top"])
    report["integrationExecutedNotReplayed"] = bool(re.search(r"(?m)^cache bypass, force executing [0-9a-f]{16}$", top_section)) and "$ bun test ./integration" in body["top"]
    summary = re.findall(r"(?m)^\s*(\d+) pass\n\s*(\d+) skip\n\s*(\d+) fail\n\s*\d+ expect\(\) calls\nRan (\d+) tests across (\d+) files\. \[[0-9.]+[a-z]+\]$", top_section)
    if len(summary) == 1:
        p, s, f, total, files = map(int, summary[0])
        report["summary"] = {"pass": p, "skip": s, "fail": f, "total": total, "files": files}
        report["summaryStatus"] = "observed" if p + s + f == total else "inconsistent"
    elif len(summary) > 1:
        report["summaryStatus"] = "ambiguous"
    for key, name in TARGET_NAMES.items():
        found = set(re.findall(r"(?m)^\((pass|fail|skip)\) " + re.escape(name) + r"(?: \[[0-9.]+ms\])?$", section))
        report["targets"][key] = next(iter(found)) if len(found) == 1 else None
    for key, name in SKIP_NAMES.items():
        report["namedSkips"][key] = bool(re.search(r"(?m)^\(skip\) " + re.escape(name) + "$", section))
    return report


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



JOURNAL_STAGES = {"process.observed", "process.no_longer_observed", "process.reaped", "process.signal",
                  "cleanup.begin", "cleanup.end", "command.spawned", "command.end", "supervisor.end"}
JOURNAL_INTS = {"pid", "ppid", "pgid", "startTicks", "waitStatus", "waitCode", "signal"}
COMMAND_LABELS = {"integration", "bun-version", "node-version"}


def journal_receipt(path: Path, staged: Path) -> None:
    data = regular_bytes(path, MIB)
    lines = []
    for expected, line in enumerate(data.splitlines(keepends=True), 1):
        require(expected <= 4080 and len(line) <= 4096 and line.endswith(b"\n"), "journal_bound")
        record = unique_json(line)
        require(isinstance(record, dict) and record.get("schema") == 1 and
                record.get("sequence") == expected and record.get("stage") in JOURNAL_STAGES and
                type(record.get("ns")) is int and record["ns"] >= 0, "journal_schema")
        for key, value in record.items():
            if key in {"schema", "sequence", "stage", "ns"}:
                continue
            if key == "command":
                require(value in COMMAND_LABELS, "journal_command")
            elif key in JOURNAL_INTS:
                require(type(value) is int and 0 <= value < 2**63, "journal_integer")
            elif key in {"exit", "remaining"}:
                require(value is None or type(value) is int and -255 <= value < 2**31, "journal_optional_integer")
            elif key in {"forced", "established", "cleanupClean", "forcedCleanup", "restored", "cancelled", "complete"}:
                require(type(value) is bool, "journal_boolean")
            elif key == "reason":
                # Reasons originate solely from fixed supervisor literals; no exception messages are used.
                require(value is None or isinstance(value, str) and re.fullmatch(r"[a-z_]{1,80}", value), "journal_reason")
            else:
                raise Invalid("journal_unknown_field")
        lines.append(json.dumps(record, sort_keys=True).encode() + b"\n")
    content = b"".join(lines)
    require(len(content) <= MIB, "journal_receipt_bound")
    destination = staged / "supervisor.jsonl"
    fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(content)
        handle.flush()
        os.fsync(handle.fileno())


def result_receipt(path: Path, report: dict) -> None:
    data = (json.dumps(report, sort_keys=True, separators=(",", ":")) + "\n").encode()
    if len(data) > MIB:
        # Keep the actual exit and restoration disposition plus validated trace
        # files. Large derived indexes must not prevent partial publication.
        report["status"] = "incomplete"
        bounded = {"status": "incomplete", "reason": "result_detail_bound",
                   "originalExit": report["originalExit"], "restored": report["restored"],
                   "derivedDetailsOmitted": True,
                   "preflightRefusal": report.get("preflightRefusal", {"status": "unavailable"}),
                   "finalDirectChildCount": report.get("finalDirectChildCount"),
                   "supervisorEventOverflow": report.get("supervisorEventOverflow"),
                   "supervisorJournalFailed": report.get("supervisorJournalFailed")}
        data = (json.dumps(bounded, sort_keys=True, separators=(",", ":")) + "\n").encode()
    require(len(data) <= MIB, "result_receipt_bound")
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())


def publication_inventory(directory: Path) -> list:
    result = []
    total = 0
    for path in sorted(directory.iterdir()):
        info = path.lstat()
        require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1 and not path.name.startswith("."), "publication_file_type")
        require(path.name in {"result.json", "supervisor.jsonl", "dist-before.json", "dist-after.json"} or
                path.name.startswith("trace-") and TRACE_NAME.fullmatch(path.name[6:]), "publication_filename")
        require(info.st_size <= MIB, "publication_file_bound")
        total += info.st_size
        require(len(result) < 80 and total <= 12 * MIB, "publication_total_bound")
        data = regular_bytes(path, MIB)
        after = path.lstat()
        require((info.st_dev, info.st_ino, info.st_size, info.st_nlink) ==
                (after.st_dev, after.st_ino, after.st_size, after.st_nlink), "publication_changed")
        result.append((path.name, info.st_dev, info.st_ino, info.st_size, digest(data)))
    return result


def static_marker(directory: Path) -> dict:
    count = 0
    total = 0
    present = False
    for path in directory.rglob("*.js"):
        count += 1
        require(count <= 20000, "dist_marker_count_bound")
        data = regular_bytes(path, 128 * MIB)
        total += len(data)
        require(total <= 256 * MIB, "dist_marker_read_bound")
        if DIAGNOSTIC.encode() in data:
            present = True
    return {"present": present, "filesRead": count, "bytesRead": total, "supportingOnly": True}


def check_pins(report: dict) -> tuple[dict, dict]:
    def read(path: Path, limit: int, stage: str) -> bytes:
        # Every caller below has a fixed, enumerated source identity; no path enters the receipt.
        file_id = PREFLIGHT_FILE_IDS.get(path.relative_to(ROOT).as_posix(), "unavailable")
        return regular_bytes(path, limit, (report, stage, file_id))

    freeze = unique_json(read(ARTIFACT / "supervisor-freeze-r3.json", MIB, "freeze"))
    require(freeze["base"] == BASE, "freeze_base_invalid")
    require(digest(read(Path(__file__), 4 * MIB, "supervisor")) == freeze["supervisorSha256"], "supervisor_hash_mismatch")
    design = unique_json(read(ARTIFACT / "freeze-r1.json", MIB, "design"))
    require(design["base"] == BASE and len(design["pins"]) == 13 and len(design["inputPins"]) == 6, "design_freeze_invalid")
    for relative, value in freeze["artifactPins"].items():
        path = source_path(relative)
        require(path.resolve().is_relative_to(ARTIFACT), "artifact_path_invalid")
        require(digest(read(path, 4 * MIB, "artifact")) == value, "artifact_hash_mismatch")
    for relative, value in design["pins"].items():
        require(freeze["artifactPins"].get(relative) == value, "design_pin_changed")
    for relative, value in design["inputPins"].items():
        # Shipping this exact reviewed workflow proposal necessarily changes its live preimage.
        # Both baseline bytes and exact proposed postimage are pinned independently.
        require(digest(git("show", BASE + ":" + relative)) == value, "base_input_mismatch")
        expected = freeze["workflowPostimageSha256"] if relative == ".github/workflows/ci.yml" else value
        require(digest(read(source_path(relative), MIB, "input")) == expected, "input_hash_mismatch")
    require(git("merge-base", "HEAD", BASE).decode().strip() == BASE, "base_ancestry_invalid")
    root_package = unique_json(read(ROOT / "package.json", MIB, "graph"))
    e2e_package = unique_json(read(ROOT / "packages/e2e/package.json", MIB, "graph"))
    require(root_package["scripts"]["test:integration"] == "turbo run test:integration" and
            e2e_package["scripts"]["test:integration"] == "bun test ./integration", "original_scripts_changed")
    original = unique_json(read(ROOT / "turbo.json", MIB, "graph"))
    overlay = unique_json(read(ARTIFACT / "overlay/turbo.json", MIB, "graph"))
    require(overlay["tasks"]["test:integration"]["passThroughEnv"] ==
            ["LOOM_TEST_DATABASE_URL", "KELLO_CI_STAGE_DIRECTORY"], "diagnostic_passthrough_invalid")
    overlay["tasks"]["test:integration"]["passThroughEnv"].remove("KELLO_CI_STAGE_DIRECTORY")
    require(overlay == original and original["tasks"]["test:integration"]["cache"] is False and
            original["tasks"]["test:integration"]["dependsOn"] == ["^build"], "original_graph_changed")
    turbo_package = unique_json(installed_turbo_metadata(report))
    require(isinstance(turbo_package, dict) and turbo_package.get("name") == "turbo" and
            turbo_package.get("version") == "2.11.6", "turbo_version_mismatch")
    manifest = unique_json(read(ARTIFACT / "manifest.json", MIB, "manifest"))
    require(manifest["base"] == BASE and set(manifest["paths"]) == SOURCE_PATHS, "manifest_invalid")
    return manifest, freeze


def main() -> int:
    require(sys.platform == "linux" and os.environ.get("GITHUB_ACTIONS") == "true" and
            os.environ.get("GITHUB_JOB") == "verify", "github_linux_verify_required")
    require(hasattr(os, "pidfd_open") and hasattr(signal, "pidfd_send_signal") and hasattr(os, "P_PIDFD"), "pidfd_required")
    require(ROOT == Path.cwd().resolve(), "checkout_cwd_required")
    address = urlsplit(os.environ.get("LOOM_TEST_DATABASE_URL", ""))
    require(address.scheme in {"postgres", "postgresql"} and address.hostname in {"127.0.0.1", "localhost"} and
            address.port == 5432 and address.path == "/loom_test" and address.username == "postgres", "existing_ci_database_required")
    require(not any(os.environ.get(key) for key in ("KELLO_CI_STAGE_DIRECTORY", "NODE_OPTIONS", "BUN_OPTIONS",
                "BUN_TEST_TIMEOUT", "BUN_TEST_PRELOAD", "TURBO_FORCE", "TURBO_ENV_MODE", "TURBO_CONCURRENCY")), "ambient_runtime_override")
    temp = Path(os.environ.get("RUNNER_TEMP", ""))
    require(temp.is_absolute() and temp.is_dir() and not temp.resolve().is_relative_to(ROOT), "runner_temp_required")
    output = temp / "kello-001-full-integration"
    output.mkdir(mode=0o700, exist_ok=False)
    private, staged, traces = (output / name for name in ("private", "validated", "traces"))
    for directory in (private, staged, traces):
        directory.mkdir(mode=0o700)
    journal = Journal(private / "supervisor.jsonl")
    report = {"schema": 1, "base": BASE, "acceptance": False, "status": "incomplete", "workload": None,
              "restored": False, "originalExit": None, "finalDirectChildAudit": None,
              "reporterResolved": None, "trace": None, "lineage": None, "provisioning": None,
              "preflightRefusal": {"status": "not_observed"}}
    originals = {}
    applied = False
    cleanup_safe = True
    backup_ready = False
    dist = ROOT / "apps/loom/dist"
    dist_before = None
    initial_diff = None
    command = None
    trace_signature = None
    prior_subreaper = ctypes.c_int()
    subreaper_set = False
    libc = ctypes.CDLL(None, use_errno=True)
    old_handlers = {}
    try:
        require(libc.prctl(37, ctypes.byref(prior_subreaper), 0, 0, 0) == 0, "subreaper_read_failed")
        require(libc.prctl(36, 1, 0, 0, 0) == 0, "subreaper_enable_failed")
        subreaper_set = True
        for sig in (signal.SIGTERM, signal.SIGINT):
            old_handlers[sig] = signal.signal(sig, cancelled)
        manifest, freeze = check_pins(report)
        report["head"] = git("rev-parse", "HEAD").decode().strip()
        report["tree"] = git("rev-parse", "HEAD^{tree}").decode().strip()
        report["supervisorSha256"] = freeze["supervisorSha256"]
        report["config"] = inspect_config()
        report["runner"] = {"family": "bun-test", "reporterArgument": None, "concurrentArgument": False,
                            "historicalResolvedReporter": None, "vitestWorkerCapApplies": False,
                            "turboVersion": "2.11.6", "workloadArgv": WORKLOAD}
        initial_diff = git("diff", "--binary", "HEAD", "--", ".")
        for relative, hashes in manifest["paths"].items():
            path = source_path(relative)
            if hashes["before"] is None:
                require(not path.exists(), "helper_already_exists")
            else:
                data = regular_bytes(path, MIB)
                require(digest(data) == hashes["before"], "source_preimage_mismatch")
                originals[relative] = (data, stat.S_IMODE(path.stat().st_mode))
            overlay = ARTIFACT / "overlay" / relative
            require(overlay.resolve().is_relative_to(ARTIFACT), "overlay_path_invalid")
            require(digest(regular_bytes(overlay, MIB)) == hashes["after"], "overlay_hash_mismatch")
        require(len(originals) == 7, "source_count_invalid")
        for label, argv, pattern in (("bun-version", ["bun", "--version"], r"1\.4\.2"),
                                     ("node-version", ["node", "--version"], r"v24\.[0-9]+\.[0-9]+")):
            probe = OwnedCommand(label, argv, ROOT, os.environ.copy(), 10, private, journal, traces)
            cleanup_safe = False
            result = probe.run()
            cleanup_safe = result["cleanupClean"]
            report[label + "-ownership"] = result
            require(result["exit"] == 0 and cleanup_safe and not result["forcedCleanup"] and
                    result["reason"] is None, "version_probe_failed")
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
        applied = True
        for relative, hashes in manifest["paths"].items():
            path = source_path(relative)
            path.write_bytes(regular_bytes(ARTIFACT / "overlay" / relative, MIB))
            require(digest(regular_bytes(path, MIB)) == hashes["after"], "applied_hash_mismatch")
        directory = traces / "full"
        directory.mkdir(mode=0o700)
        env = os.environ.copy()
        env["KELLO_CI_STAGE_DIRECTORY"] = str(directory)
        require(not CANCELLED, "cancelled")
        command = OwnedCommand("integration", WORKLOAD, ROOT, env, 1800, private, journal, traces)
        cleanup_safe = False
        result = command.run()
        # Preserve the direct root's outcome before any validation/restoration can throw.
        report["workload"] = result
        report["originalExit"] = result["exit"]
        cleanup_safe = result["cleanupClean"]
        require(cleanup_safe, "workload_ownership_incomplete")
        trace_signature = inventory_signature(trace_inventory(traces))
        records, trace_result = read_traces(command, staged)
        report["trace"] = trace_result
        report["lineage"] = lineage(records, command)
        report["provisioning"] = provisioning(records, command)
        console = regular_bytes(private / "integration.console", 32 * MIB)
        report["console"] = report_console(console)
        report["traceIOFailure"] = b"CI_TRACE_IO_FAILURE" in console or b"CI_TRACE_CLOSE_FAILURE" in console
        dist_after = tree_manifest(dist)
        save_json(staged / "dist-after.json", dist_after)
        report["builtStaticMarker"] = static_marker(dist)
        summary = report["console"]["summary"]
        report["expectedCountsReconciled"] = bool(report["console"]["summaryStatus"] == "observed" and summary and
                    summary["total"] == 279 and summary["files"] == 124 and summary["skip"] == 2 and
                    all(report["console"]["namedSkips"].get(key) for key in SKIP_NAMES))
        report["buildProvenanceObserved"] = bool(report["console"]["dependencyBuild"]["observed"] and
                    report["console"]["integrationExecutedNotReplayed"] and report["lineage"]["pipelineObserved"] and
                    "target_built_watch_coordinator_missing" not in report["lineage"]["reasons"])
        complete = (trace_result["syntaxComplete"] and report["lineage"]["complete"] and
                    report["provisioning"]["complete"] and report["expectedCountsReconciled"] and
                    report["buildProvenanceObserved"] and report["builtStaticMarker"]["present"] and
                    not report["traceIOFailure"] and not result["forcedCleanup"] and result["reason"] is None)
        report["status"] = "diagnostic_complete" if complete else "incomplete"
    except Invalid as exc:
        report["reason"] = str(exc)
    except Exception:
        report["reason"] = "supervisor_error"
    finally:
        try:
            direct = [{"pid": pid, "startTicks": info[2], "pgid": info[1]} for pid, info in proc_snapshot().items()
                      if info[0] == os.getpid()]
            report["finalDirectChildAudit"] = direct[:256]
            report["finalDirectChildCount"] = len(direct)
            require(cleanup_safe and not direct, "unsafe_restore_live_children")
            if command is not None:
                # Re-audit retained identities/ancestry even though pidfds closed after command cleanup.
                require(not command.owned_snapshot(), "unsafe_restore_owned_descendants")
            if applied:
                # Do not restore from an altered backup; in-memory source preimages are authoritative.
                require(backup_ready and tree_manifest(private / "dist") == dist_before, "backup_restore_mismatch")
                for relative, (data, mode) in originals.items():
                    path = source_path(relative)
                    path.write_bytes(data)
                    os.chmod(path, mode)
                helper = source_path("apps/loom/src/tooling/dev/ci-trace.ts")
                if helper.exists():
                    helper.unlink()
                if dist.is_symlink():
                    dist.unlink()
                elif dist.exists():
                    shutil.rmtree(dist)
                shutil.copytree(private / "dist", dist, symlinks=True)
                require(all(digest(regular_bytes(source_path(path), MIB)) == digest(data) and
                            stat.S_IMODE(source_path(path).stat().st_mode) == mode
                            for path, (data, mode) in originals.items()), "source_restore_mismatch")
                require(not source_path("apps/loom/src/tooling/dev/ci-trace.ts").exists() and
                        tree_manifest(dist) == dist_before, "dist_or_helper_restore_mismatch")
                # Never reset unexpected ordinary workload changes; record their hashed inventory and fail.
                final_diff = git("diff", "--binary", "HEAD", "--", ".")
                report["trackedDiffBeforeSha256"] = digest(initial_diff)
                report["trackedDiffAfterSha256"] = digest(final_diff)
                report["changedTrackedPathHashes"] = [digest(line) for line in git("diff", "--name-only", "HEAD").splitlines()]
                require(final_diff == initial_diff, "unexpected_tracked_drift")
            report["restored"] = True
            report["sourceBeforeHashes"] = {path: digest(data) for path, (data, _mode) in originals.items()}
            report["sourceAfterHashes"] = {path: digest(regular_bytes(source_path(path), MIB)) for path in originals}
            if backup_ready:
                save_json(staged / "dist-before.json", dist_before)
                report["restoredDistManifestSha256"] = digest(json.dumps(tree_manifest(dist), sort_keys=True).encode())
        except Exception:
            report["restored"] = False
            report["restorationFailure"] = "restoration_failed_or_withheld"
            report["status"] = "incomplete"
        journal.emit("supervisor.end", restored=report["restored"], cancelled=CANCELLED,
                     complete=report["status"] == "diagnostic_complete")
        journal.close()
        report["supervisorEventOverflow"] = journal.overflow
        report["supervisorJournalFailed"] = journal.failed
        if journal.overflow or journal.failed or CANCELLED:
            report["status"] = "incomplete"
        if report["originalExit"] is None or "reason" in report:
            report["status"] = "incomplete"
        try:
            # Publication is atomic and unavailable if live/unknown processes can still mutate evidence.
            require(cleanup_safe and report.get("finalDirectChildCount") == 0, "unsafe_publish_ownership")
            if command is not None:
                require(not command.owned_snapshot(), "unsafe_publish_descendants")
            if trace_signature is not None:
                require(inventory_signature(trace_inventory(traces)) == trace_signature, "trace_inventory_changed")
            journal_receipt(private / "supervisor.jsonl", staged)
            result_receipt(staged / "result.json", report)
            first = publication_inventory(staged)
            require(first == publication_inventory(staged), "publication_changed")
            require(not (output / "publish").exists(), "publication_collision")
            staged.rename(output / "publish")
        except Exception:
            report["status"] = "incomplete"
            print("CI_FULL_DIAGNOSTIC_PUBLICATION_INCOMPLETE", file=sys.stderr)
        for sig, old in old_handlers.items():
            signal.signal(sig, old)
        if subreaper_set:
            libc.prctl(36, prior_subreaper.value, 0, 0, 0)
    # Original nonzero remains nonzero; unavailable original status cannot become green.
    original_exit = report["originalExit"]
    if type(original_exit) is int and original_exit != 0:
        return original_exit if 1 <= original_exit <= 255 else 1
    return 0 if original_exit == 0 and report["status"] == "diagnostic_complete" and report["restored"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Invalid:
        print("CI_FULL_DIAGNOSTIC_PREFLIGHT_FAILURE", file=sys.stderr)
        raise SystemExit(2)
    except Exception:
        print("CI_FULL_DIAGNOSTIC_SUPERVISOR_FAILURE", file=sys.stderr)
        raise SystemExit(2)
