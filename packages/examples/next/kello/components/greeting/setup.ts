import { defineComponent } from "./_generated/setup";
import { z } from "zod";
export default defineComponent({ name: "greeting", env: { PREFIX: z.string() } });
