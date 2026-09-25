"use client";
import { createLoomReact } from "@loom/core/react";
import { createCookieSession } from "@loom/core/client";
import { createClient } from "../loom/_generated/api";
export const { LoomProvider, useLoom } = createLoomReact(createClient);
export const session = createCookieSession();
export type Notes = Awaited<ReturnType<ReturnType<typeof createClient>["client"]["examples"]["notes"]>>;
