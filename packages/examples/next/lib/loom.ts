"use client";
import { createLoomNeonReact } from "loom/react/neon";
import { createClient } from "../loom/_generated/api";
export const serviceUrl = process.env.NEXT_PUBLIC_LOOM_SERVICE_URL!;
export const { LoomProvider, useLoom, auth } = createLoomNeonReact(createClient, { serviceUrl });
export type Notes = Awaited<ReturnType<ReturnType<typeof createClient>["client"]["examples"]["notes"]>>;
