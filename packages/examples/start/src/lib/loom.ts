"use client";
import { createLoomReact } from "loom/react";
import { createCookieSession } from "loom/client";
import { createClient } from "../../loom/_generated/api";
export const { LoomProvider, useLoom } = createLoomReact(createClient);
export const session = createCookieSession();
export type Notes = Awaited<ReturnType<ReturnType<typeof createClient>["client"]["examples"]["notes"]>>;
