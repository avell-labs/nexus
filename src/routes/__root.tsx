import BaseLayout from "@/layouts/base-layout";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { getAuthStatus, signInWithEntra } from "@/actions/auth";
import type { AuthStatus } from "@/types/auth";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const authBypassEnabled =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === "true";

function LoginGate() {
  const [status, setStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      const authStatus = await getAuthStatus();
      if (!active) return;
      setStatus(authStatus);
    };

    void loadStatus();
    const intervalId = window.setInterval(() => {
      void loadStatus();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  async function handleSignIn() {
    const nextStatus = await signInWithEntra();
    setStatus(nextStatus);
  }

  if (authBypassEnabled) {
    return <Outlet />;
  }

  if (!status) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (status.isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="flex h-full items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <LoginForm
            onSubmit={(event) => event.preventDefault()}
            onMicrosoftLogin={() => void handleSignIn()}
            isAuthenticating={status.isAuthenticating}
            error={status.error}
            isConfigured={status.isConfigured}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Root() {
  return (
    <BaseLayout>
      <LoginGate />
      <TanStackRouterDevtools />
    </BaseLayout>
  );
}

export const Route = createRootRoute({
  component: Root,
});
