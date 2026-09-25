import { Context } from "effect";
export class Greeting extends Context.Service<Greeting, { readonly prefix: string }>()("example/Greeting") {}
