import { shell } from "electron";
import { app } from "electron";
import {
  PublicClientApplication,
  type AuthenticationResult,
} from "@azure/msal-node";
import type { AuthStatus, AuthUser } from "@/types/auth";
import fs from "node:fs";
import path from "node:path";

function normalizeEnv(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseScopes(rawValue?: string): string[] {
  if (!rawValue) return ["User.Read"];
  return rawValue
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

const msalConfig = {
  clientId: normalizeEnv(process.env.ENTRA_CLIENT_ID),
  tenantId: normalizeEnv(process.env.ENTRA_TENANT_ID),
  scopes: parseScopes(normalizeEnv(process.env.ENTRA_SCOPES)),
  authority:
    normalizeEnv(process.env.ENTRA_AUTHORITY) ||
    `https://login.microsoftonline.com/${normalizeEnv(process.env.ENTRA_TENANT_ID) || "common"}`,
};

const isConfigured = Boolean(msalConfig.clientId && msalConfig.tenantId);
const pca = isConfigured
  ? new PublicClientApplication({
      auth: {
        clientId: msalConfig.clientId,
        authority: msalConfig.authority,
      },
    })
  : null;
const tokenCacheFilePath = path.join(app.getPath("userData"), "msal-cache.json");

let authResult: AuthenticationResult | null = null;
let isAuthenticating = false;
let authError: string | null = null;
let isHydratingSession = false;
let hydrationPromise: Promise<void> | null = null;
let avatarUrl: string | null = null;

async function resolveAvatarFromEntra(accessToken?: string): Promise<string | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const mimeType = response.headers.get("content-type") ?? "image/jpeg";
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    return `data:${mimeType};base64,${base64Image}`;
  } catch {
    return null;
  }
}

async function persistTokenCache() {
  if (!pca) return;

  try {
    const serializedCache = await pca.getTokenCache().serialize();
    fs.writeFileSync(tokenCacheFilePath, serializedCache, "utf8");
  } catch {
    // No-op. Auth should still work even if cache persistence fails.
  }
}

async function hydrateSessionFromCache() {
  if (!pca || isHydratingSession) {
    return;
  }

  isHydratingSession = true;
  authError = null;

  try {
    if (fs.existsSync(tokenCacheFilePath)) {
      const serializedCache = fs.readFileSync(tokenCacheFilePath, "utf8");
      if (serializedCache.trim()) {
        await pca.getTokenCache().deserialize(serializedCache);
      }
    }

    const accounts = await pca.getTokenCache().getAllAccounts();
    const primaryAccount = accounts[0];
    if (!primaryAccount) {
      return;
    }

    try {
      authResult = await pca.acquireTokenSilent({
        account: primaryAccount,
        scopes: msalConfig.scopes,
      });
      avatarUrl = await resolveAvatarFromEntra(authResult.accessToken);
      await persistTokenCache();
    } catch {
      authResult = {
        account: primaryAccount,
      } as AuthenticationResult;
      avatarUrl = null;
    }
  } catch (error) {
    authResult = null;
    avatarUrl = null;
    authError = error instanceof Error ? error.message : String(error);
  } finally {
    isHydratingSession = false;
  }
}

function getAuthUser(): AuthUser | null {
  if (!authResult?.account) {
    return null;
  }

  return {
    name: authResult.account.name ?? null,
    username: authResult.account.username ?? null,
    avatarUrl,
  };
}

function getAuthStatus(): AuthStatus {
  return {
    isConfigured,
    isAuthenticated: Boolean(authResult?.account),
    isAuthenticating: isAuthenticating || isHydratingSession,
    user: getAuthUser(),
    error: authError,
  };
}

async function signInWithEntra(): Promise<AuthStatus> {
  if (!isConfigured || !pca) {
    authError =
      "MS Entra ID is not configured. Set ENTRA_CLIENT_ID and ENTRA_TENANT_ID.";
    return getAuthStatus();
  }

  if (isAuthenticating) {
    return getAuthStatus();
  }

  isAuthenticating = true;
  authError = null;

  try {
    const deviceCodeResult = await pca.acquireTokenByDeviceCode({
      scopes: msalConfig.scopes,
      deviceCodeCallback: (response) => {
        void shell.openExternal(response.verificationUri);
        authError = `Use code ${response.userCode} to complete sign-in in your browser.`;
      },
    });

    if (deviceCodeResult) {
      authResult = deviceCodeResult;
      avatarUrl = await resolveAvatarFromEntra(deviceCodeResult.accessToken);
      authError = null;
      await persistTokenCache();
    } else {
      authResult = null;
      avatarUrl = null;
      authError = "Device code authentication did not return a token.";
    }
  } catch (error) {
    authResult = null;
    avatarUrl = null;
    authError = error instanceof Error ? error.message : String(error);
  } finally {
    isAuthenticating = false;
  }

  return getAuthStatus();
}

async function signOutFromEntra(): Promise<AuthStatus> {
  if (pca && authResult?.account) {
    await pca.getTokenCache().removeAccount(authResult.account);
  }

  authResult = null;
  avatarUrl = null;
  isAuthenticating = false;
  authError = null;

  await persistTokenCache();

  return getAuthStatus();
}

function ensureAuthHydrationStarted() {
  if (!hydrationPromise) {
    hydrationPromise = hydrateSessionFromCache();
  }
}

ensureAuthHydrationStarted();

export { getAuthStatus, signInWithEntra, signOutFromEntra };
