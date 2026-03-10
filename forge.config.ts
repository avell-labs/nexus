import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const isE2EBuild = process.env.CI === "e2e" || process.env.E2E === "true";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: "images/ico/avell.ico",
    appUserModelId: "com.squirrel.nexus.nexus",
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "nexus",
      authors: "Marcelo Machado",
      description: "App for Avell's technical support team",
      setupIcon: "images/ico/avell.ico",
      // loadingGif: "images/installer.gif",
    }),
    new MakerZIP({}, ["darwin"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  publishers: [
    {
      /*
       * Publish release on GitHub as draft.
       * Remember to manually publish it on GitHub website after verifying everything is correct.
       */
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "avell-labs",
          name: "nexus",
        },
        draft: true,
        authToken: process.env.GITHUB_TOKEN,
        prerelease: false,
      },
    },
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.mts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.mts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
        },
      ],
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: isE2EBuild,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
