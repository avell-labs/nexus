# Nexus

## MS Entra ID Setup

This app requires MS Entra ID authentication to access routes.

### Local development

Create a `.env` in the project root with:

```bash
ENTRA_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ENTRA_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ENTRA_SCOPES=User.Read
ENTRA_AUTHORITY=https://login.microsoftonline.com/<tenant-id>
```

### GitHub release pipeline

Configure these repository secrets:

- `ENTRA_CLIENT_ID`
- `ENTRA_TENANT_ID`
- `ENTRA_SCOPES` (optional)
- `ENTRA_AUTHORITY` (optional)

The `publish.yaml` workflow injects these secrets into the build/publish steps so releases are generated with Entra auth configured.
