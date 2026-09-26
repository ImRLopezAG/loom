"use client";
import { createLoomNeonReact } from "loom/react/neon";
import { createClient } from "../loom/_generated/api";
export const { LoomProvider, useLoom, auth } = createLoomNeonReact(createClient, { proxy: true });
export type Notes = Awaited<ReturnType<ReturnType<typeof createClient>["client"]["examples"]["notes"]>>;
