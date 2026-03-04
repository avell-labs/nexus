import { cn } from "@/utils/tailwind"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import {
  FieldGroup,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

interface LoginFormProps extends React.ComponentProps<"form"> {
  onMicrosoftLogin: () => void
  isAuthenticating?: boolean
  error?: string | null
  isConfigured?: boolean
}

export function LoginForm({
  onMicrosoftLogin,
  isAuthenticating = false,
  error = null,
  isConfigured = true,
  className,
  ...props
}: LoginFormProps) {
  const { t } = useTranslation()

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {t("loginSubtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          type="button"
          disabled={!isConfigured || isAuthenticating}
          onClick={onMicrosoftLogin}>
          {isAuthenticating ? <Spinner /> : null}
          {isAuthenticating ? (
            <span>{t("loginAuthenticating")}</span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span>{t("loginContinueWith")}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4"
                xmlns="http://www.w3.org/2000/svg">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#7FBA00" d="M13 1h10v10H13z" />
                <path fill="#00A4EF" d="M1 13h10v10H1z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
              <span>{t("microsoftProvider")}</span>
            </span>
          )}
        </Button>

        {!isConfigured && (
          <p className="text-destructive text-center text-sm">
            {t("loginNotConfigured")}
          </p>
        )}

        {error && (
          <p className="text-destructive text-center text-sm">{error}</p>
        )}

        <div className="flex items-center justify-center">
          <Button variant="ghost" type="button" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            {t("loginCorporateOnly")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
