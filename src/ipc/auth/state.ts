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

function formatAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const details = error as Error & {
    errorCode?: string;
    subError?: string;
    correlationId?: string;
    statusCode?: number;
  };

  const baseMessage = error.message || "Authentication failed.";
  const extraParts = [
    details.errorCode ? `code=${details.errorCode}` : null,
    details.subError ? `subError=${details.subError}` : null,
    details.statusCode ? `status=${details.statusCode}` : null,
    details.correlationId ? `correlationId=${details.correlationId}` : null,
  ].filter(Boolean);

  return extraParts.length > 0
    ? `${baseMessage} (${extraParts.join(", ")})`
    : baseMessage;
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
const tokenCacheFilePath = path.join(
  app.getPath("userData"),
  "msal-cache.json",
);
const isE2E = process.env.CI === "e2e";

let authResult: AuthenticationResult | null = null;
let isAuthenticating = false;
let authError: string | null = null;
let isHydratingSession = false;
let hydrationPromise: Promise<void> | null = null;
let avatarUrl: string | null = null;
let department: string | null = null;
let position: string | null = null;
let manager: string | null = null;

async function resolveAvatarFromEntra(
  accessToken?: string,
): Promise<string | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/photo/$value",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

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

async function resolveUserProfileFromEntra(accessToken?: string): Promise<{
  department: string | null;
  position: string | null;
  manager: string | null;
}> {
  if (!accessToken) {
    return { department: null, position: null, manager: null };
  }

  try {
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch user profile:",
        response.status,
        response.statusText,
      );
      return { department: null, position: null, manager: null };
    }

    const data = await response.json();

    let managerName: string | null = null;
    // Fetch manager separately
    if (data.manager) {
      try {
        const managerResponse = await fetch(
          "https://graph.microsoft.com/v1.0/me/manager",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        if (managerResponse.ok) {
          const managerData = await managerResponse.json();
          managerName = managerData.displayName || null;
        } else {
          console.error(
            "Failed to fetch manager:",
            managerResponse.status,
            managerResponse.statusText,
          );
        }
      } catch (managerError) {
        console.error("Error fetching manager:", managerError);
      }
    }

    return {
      department: data.department || null,
      position: data.jobTitle || null,
      manager: managerName,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { department: null, position: null, manager: null };
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
      const profile = await resolveUserProfileFromEntra(authResult.accessToken);
      department = profile.department;
      position = profile.position;
      manager = profile.manager;
      await persistTokenCache();
    } catch {
      authResult = {
        account: primaryAccount,
      } as AuthenticationResult;
      avatarUrl = null;
      department = null;
      position = null;
      manager = null;
    }
  } catch (error) {
    authResult = null;
    avatarUrl = null;
    department = null;
    position = null;
    manager = null;
    authError = formatAuthError(error);
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
    department,
    position,
    manager,
  };
}

function getAuthStatus(): AuthStatus {
  if (isE2E) {
    return {
      isConfigured: true,
      isAuthenticated: true,
      isAuthenticating: false,
      user: {
        name: "E2E User",
        username: "e2e@nexus.local",
        avatarUrl: null,
        department: "Engineering",
        position: "Developer",
        manager: "E2E Manager",
      },
      error: null,
    };
  }

  return {
    isConfigured,
    isAuthenticated: Boolean(authResult?.account),
    isAuthenticating: isAuthenticating || isHydratingSession,
    user: getAuthUser(),
    error: authError,
  };
}

async function signInWithEntra(): Promise<AuthStatus> {
  if (isE2E) {
    return getAuthStatus();
  }

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
        const verificationUrl =
          (response as { verificationUriComplete?: string })
            .verificationUriComplete ?? response.verificationUri;

        if (verificationUrl) {
          void shell.openExternal(verificationUrl);
        }

        if (response.userCode) {
          authError = `Use code ${response.userCode} to complete sign-in in your browser.`;
        } else if (response.message) {
          authError = response.message;
        } else {
          authError = "Complete sign-in in your browser.";
        }
      },
    });

    if (deviceCodeResult) {
      authResult = deviceCodeResult;
      avatarUrl = await resolveAvatarFromEntra(deviceCodeResult.accessToken);
      const profile = await resolveUserProfileFromEntra(
        deviceCodeResult.accessToken,
      );
      department = profile.department;
      position = profile.position;
      manager = profile.manager;
      authError = null;
      await persistTokenCache();
    } else {
      authResult = null;
      avatarUrl = null;
      department = null;
      position = null;
      manager = null;
      authError = "Device code authentication did not return a token.";
    }
  } catch (error) {
    authResult = null;
    avatarUrl = null;
    department = null;
    position = null;
    manager = null;
    authError = formatAuthError(error);
  } finally {
    isAuthenticating = false;
  }

  return getAuthStatus();
}

async function signOutFromEntra(): Promise<AuthStatus> {
  if (isE2E) {
    return getAuthStatus();
  }

  if (pca && authResult?.account) {
    await pca.getTokenCache().removeAccount(authResult.account);
  }

  authResult = null;
  avatarUrl = null;
  department = null;
  position = null;
  manager = null;
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
