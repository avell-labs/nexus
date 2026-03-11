import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  getContributorLists,
  getLocalContributorLists,
} from "@/services/contributors-service";
import { assetUrl } from "@/utils/assets";

function AboutPage() {
  const { t } = useTranslation();
  const [contributors, setContributors] = React.useState(() =>
    getLocalContributorLists(),
  );

  React.useEffect(() => {
    let active = true;
    void getContributorLists().then((lists) => {
      if (!active) return;
      setContributors(lists);
    });

    return () => {
      active = false;
    };
  }, []);

  const items = [
    {
      value: "contributing",
      trigger: t("faqContributingTrigger"),
      content: t("faqContributingContent"),
    },

    {
      value: "authentication",
      trigger: t("faqAuthenticationTrigger"),
      content: t("faqAuthenticationContent"),
    },
    {
      value: "updates",
      trigger: t("faqUpdatesTrigger"),
      content: t("faqUpdatesContent"),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center overflow-y-auto p-4 text-center">
      <div className="w-full max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
              {t("appName").toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h4 className="text-muted-foreground mb-4 scroll-m-20 text-lg tracking-tight italic">
              {t("aboutNexus")}
            </h4>
            <Separator />
            <section className="mb-4">
              <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-2">
                F.A.Q.
              </h2>
              <div className="mx-auto max-h-64 max-w-2xl overflow-y-auto text-center">
                <Accordion className="mx-auto max-w-lg">
                  {items.map((item) => (
                    <AccordionItem key={item.value} value={item.value}>
                      <AccordionTrigger>{item.trigger}</AccordionTrigger>
                      <AccordionContent>{item.content}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </section>
            <Separator />
            <section className="mb-4">
              <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-2">
                <span className="inline-flex items-center justify-center gap-3">
                  Beta Testers
                  <img
                    src={assetUrl("images/badges/beta-tester-badge-100.png")}
                    alt="Beta Tester Badge"
                    className="h-8 w-8"
                  />
                </span>
              </h2>
              <p className="text-muted-foreground [&:not(:first-child)]:mt-6">
                {t("betaTestersDescription")}
              </p>

              <div className="mx-auto my-6 w-full max-w-2xl overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="even:bg-muted m-0 border-t p-0">
                      <th className="border px-3 py-2 text-center font-bold">
                        {t("aboutTableName")}
                      </th>
                      <th className="border px-3 py-2 text-center font-bold">
                        {t("aboutTableNickname")}
                      </th>
                      <th className="border px-3 py-2 text-center font-bold">
                        {t("aboutTableEmail")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributors.betaTesters.map((tester) => (
                      <tr
                        key={tester.email}
                        className="even:bg-muted m-0 border-t p-0"
                      >
                        <td className="border px-3 py-2 text-center">
                          {tester.name}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {tester.nickname}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {tester.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <Separator />
            <section className="mb-4">
              <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-2">
                <span className="inline-flex items-center justify-center gap-3">
                  Bug Hunters
                  <img
                    src={assetUrl("images/badges/bug-hunter-badge-100.png")}
                    alt="Bug Hunter Badge"
                    className="h-8 w-8"
                  />
                </span>
              </h2>
              <p className="text-muted-foreground [&:not(:first-child)]:mt-6">
                {t("bugHuntersDescription")}
              </p>

              <div className="mx-auto my-6 w-full max-w-2xl overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="even:bg-muted m-0 border-t p-0">
                      <th className="border px-3 py-2 text-center font-bold">
                        {t("aboutTableName")}
                      </th>
                      <th className="border px-3 py-2 text-center font-bold">
                        {t("aboutTableNickname")}
                      </th>
                      <th className="border px-3 py-2 text-center font-bold">
                        {t("aboutTableEmail")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributors.bugBusters.map((hunter) => (
                      <tr
                        key={hunter.email}
                        className="even:bg-muted m-0 border-t p-0"
                      >
                        <td className="border px-3 py-2 text-center">
                          {hunter.name}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {hunter.nickname}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {hunter.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <Separator />
            <section className="mb-4">
              <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-2">
                <span className="inline-flex items-center justify-center gap-3">
                  Developers
                  <img
                    src={assetUrl("images/badges/active-developer-badge-100.png")}
                    alt="Developer Badge"
                    className="h-8 w-8"
                  />
                </span>
              </h2>
              <p className="text-muted-foreground [&:not(:first-child)]:mt-6">
                {t("developersDescription")}
              </p>

              <div className="mx-auto my-6 w-full max-w-2xl overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="even:bg-muted m-0 border-t p-0">
                      <th className="border px-3 py-2 text-center font-bold">
                        {t("aboutTableName")}
                      </th>
                      <th className="border px-3 py-2 text-center font-bold">
                        {t("aboutTableNickname")}
                      </th>
                      <th className="border px-3 py-2 text-center font-bold">
                        {t("aboutTableEmail")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributors.developers.map((developer) => (
                      <tr
                        key={developer.email}
                        className="even:bg-muted m-0 border-t p-0"
                      >
                        <td className="border px-3 py-2 text-center">
                          {developer.name}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {developer.nickname}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {developer.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/about")({
  component: AboutPage,
});
