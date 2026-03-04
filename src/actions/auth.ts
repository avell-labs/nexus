import { ipc } from "@/ipc/manager";
import type { AuthStatus } from "@/types/auth";

export function getAuthStatus(): Promise<AuthStatus> {
  return ipc.client.auth.getStatus();
}

export function signInWithEntra(): Promise<AuthStatus> {
  return ipc.client.auth.signIn();
}

export function signOutFromEntra(): Promise<AuthStatus> {
  return ipc.client.auth.signOut();
}
