import { createFileRoute } from "@tanstack/react-router";

function HomePage() {
  return <div className="from-background via-background to-primary/8 h-full w-full bg-gradient-to-br" />;
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
