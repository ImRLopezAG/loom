import * as v from "valibot";

/** Return only structural log information and status counts, never provider bodies or URLs. */
export async function cloudLogDiagnostics(projectId: string, branchId: string) {
  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) return "unavailable";
  let stage = "request";
  try {
    const url = new URL(
      `https://console.neon.tech/telemetry/v1/projects/${projectId}/branches/${branchId}/loki/api/v1/query_range`,
    );
    url.searchParams.set("query", '{entity_type="function"}');
    url.searchParams.set("since", "10m");
    url.searchParams.set("limit", "1000");
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return `HTTP ${response.status}`;
    stage = "response schema";
    const logs = v.parse(
      v.object({
        data: v.object({
          result: v.array(
            v.object({
              stream: v.object({ severity_text: v.optional(v.string()), service_name: v.optional(v.string()) }),
              values: v.array(v.tuple([v.string(), v.string()])),
            }),
          ),
        }),
      }),
      await response.json(),
    );
    const counts: Record<string, number> = {};
    const fields = new Set<string>();
    let records = 0;
    let plainText = 0;
    for (const stream of logs.data.result)
      for (const [, line] of stream.values) {
        records++;
        if (line === "invoke end" && stream.stream.severity_text === "ERROR") {
          counts["platform invoke failure"] = (counts["platform invoke failure"] ?? 0) + 1;
        }
        try {
          const parsed: unknown = JSON.parse(line);
          const refusal = v.safeParse(
            v.object({
              event: v.literal("loom.trigger.refused"),
              reason: v.picklist(["attestation", "unknown-trigger", "trigger-name", "storage-binding"]),
              bindingCount: v.number(),
            }),
            parsed,
          );
          if (refusal.success) {
            const key = `${refusal.output.reason} bindings=${refusal.output.bindingCount}`;
            counts[key] = (counts[key] ?? 0) + 1;
          }
          const delivery = v.safeParse(
            v.object({ event: v.literal("loom.trigger.delivery"), status: v.number() }),
            parsed,
          );
          if (delivery.success) {
            const key = `worker HTTP ${delivery.output.status}`;
            counts[key] = (counts[key] ?? 0) + 1;
          }
          const entry = v.safeParse(v.record(v.string(), v.unknown()), parsed);
          if (entry.success)
            for (const key of Object.keys(entry.output)) if (/^[a-zA-Z_.]{1,80}$/.test(key)) fields.add(key);
        } catch {
          plainText++;
        }
        for (const status of line.match(/\b[1-5][0-9]{2}\b/g) ?? []) counts[status] = (counts[status] ?? 0) + 1;
        for (const marker of [
          "Trigger delivery refused",
          "Service unavailable",
          "permission denied",
          "Unbound storage event",
        ])
          if (line.includes(marker)) counts[marker] = (counts[marker] ?? 0) + 1;
      }
    return JSON.stringify({ records, plainText, fields: [...fields].sort(), numericMarkers: counts });
  } catch {
    return `unavailable during ${stage}`;
  }
}
