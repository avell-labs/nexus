import { z } from "zod";
import localBetaTesters from "@/data/beta-testers.json";
import localBugBusters from "@/data/bug-busters.json";
import localDevelopers from "@/data/developers.json";

export interface Contributor {
  name: string;
  nickname: string;
  email: string;
}

export interface ContributorLists {
  betaTesters: Contributor[];
  bugBusters: Contributor[];
  developers: Contributor[];
}

export interface UserBadge {
  key: "beta-tester" | "bug-hunter" | "active-developer";
  label: string;
  imageUrl: string;
  alt: string;
}

const contributorSchema = z.object({
  name: z.string().min(1),
  nickname: z.string().min(1),
  email: z.string().email(),
});

const contributorsSchema = z.array(contributorSchema);

const localContributorLists: ContributorLists = {
  betaTesters: contributorsSchema.parse(localBetaTesters),
  bugBusters: contributorsSchema.parse(localBugBusters),
  developers: contributorsSchema.parse(localDevelopers),
};

const badgeDefinitions = [
  {
    key: "beta-tester",
    label: "Beta Tester",
    alt: "Beta Tester Badge",
    imageUrl: "/images/badges/beta-tester-badge-48.png",
    listKey: "betaTesters",
  },
  {
    key: "bug-hunter",
    label: "Bug Hunter",
    alt: "Bug Hunter Badge",
    imageUrl: "/images/badges/bug-hunter-badge-48.png",
    listKey: "bugBusters",
  },
  {
    key: "active-developer",
    label: "Developer",
    alt: "Developer Badge",
    imageUrl: "/images/badges/active-developer-badge-48.png",
    listKey: "developers",
  },
] as const;

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function getLocalContributorLists(): ContributorLists {
  return localContributorLists;
}

export async function getContributorLists(): Promise<ContributorLists> {
  return localContributorLists;
}

export async function getUserBadges(user: {
  name?: string | null;
  username?: string | null;
  email?: string | null;
}): Promise<UserBadge[]> {
  const email = normalize(user.email ?? user.username);
  const name = normalize(user.name);

  if (!email && !name) {
    return [];
  }

  const lists = await getContributorLists();

  const matchesList = (contributors: Contributor[]) =>
    contributors.some((contributor) => {
      const contributorEmail = normalize(contributor.email);
      if (email && contributorEmail === email) {
        return true;
      }
      if (name && normalize(contributor.name) === name) {
        return true;
      }
      return false;
    });

  return badgeDefinitions.reduce<UserBadge[]>((acc, badge) => {
    const list = lists[badge.listKey];
    if (matchesList(list)) {
      acc.push({
        key: badge.key,
        label: badge.label,
        imageUrl: badge.imageUrl,
        alt: badge.alt,
      });
    }
    return acc;
  }, []);
}
