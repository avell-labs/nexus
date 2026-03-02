# Release {{TAG}} - {{DATE}}

## Highlights
- Theme-aware map tiles now switch correctly between light/dark mode.
- Release pipeline now supports sensitive assistance data injection via GitHub Secrets.
- Auto-update flow was validated through GitHub Releases publishing.

## Changes
{{CHANGES}}

## Operational Notes
- This release was built with Electron Forge and published as a GitHub Release draft.
- Assistance data file is injected during CI from `AUTHORIZED_ASSISTANCES_JSON` or `AUTHORIZED_ASSISTANCES_JSON_B64`.

## Validation Checklist
- [ ] Installer/executable opens successfully.
- [ ] Assistance search works with production data.
- [ ] Dark/light mode map tiles switch correctly.
- [ ] Auto-update check detects this version from a previous install.
