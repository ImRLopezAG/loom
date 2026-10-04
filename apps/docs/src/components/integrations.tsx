import { cn } from "@/lib/utils";
import { DecorIcon } from "@/components/decor-icon";

type Integration = {
  image: string;
  darkImage?: string;
  name: string;
  url: string;
  role: string;
  description: string;
};

export function Integrations({ integrations }: { integrations: readonly Integration[] }) {
  return (
    <div className="home-integrations relative border">
      <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
        {integrations.map((integration) => (
          <li key={integration.name} className="bg-background">
            <a
              href={integration.url}
              className="flex h-full flex-col items-start gap-4 p-6 text-start"
              aria-label={`${integration.name} official website`}
            >
              <img
                alt=""
                className={cn(
                  "size-9 shrink-0 object-contain",
                  integration.darkImage && "technology-light",
                  integration.name === "oRPC" && "technology-orpc",
                )}
                height={36}
                src={`/brand/technologies/${integration.image}`}
                width={36}
                loading="lazy"
              />
              {integration.darkImage && (
                <img
                  alt=""
                  className="technology-dark size-9 shrink-0 object-contain"
                  height={36}
                  src={`/brand/technologies/${integration.darkImage}`}
                  width={36}
                  loading="lazy"
                />
              )}
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold">{integration.name}</h3>
                <span className="text-primary text-xs">{integration.role}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{integration.description}</p>
            </a>
          </li>
        ))}
      </ul>
      <DecorIcon position="top-left" />
      <DecorIcon position="top-right" />
      <DecorIcon position="bottom-left" />
      <DecorIcon position="bottom-right" />
    </div>
  );
}
