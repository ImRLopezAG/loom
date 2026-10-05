"use client";
import { createKelloNeonReact } from "kello/react/neon";
import { createClient } from "../kello/_generated/api";
export const serviceUrl = process.env.NEXT_PUBLIC_LOOM_SERVICE_URL!;
export const { KelloProvider, useKello, auth } = createKelloNeonReact(createClient, { serviceUrl });
export type Notes = Awaited<ReturnType<ReturnType<typeof createClient>["client"]["examples"]["notes"]>>;
