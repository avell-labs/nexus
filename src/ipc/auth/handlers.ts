import { os } from "@orpc/server";
import { getAuthStatus, signInWithEntra, signOutFromEntra } from "./state";

export const getStatus = os.handler(() => {
  return getAuthStatus();
});

export const signIn = os.handler(async () => {
  return signInWithEntra();
});

export const signOut = os.handler(async () => {
  return signOutFromEntra();
});
