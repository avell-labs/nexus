import { collection, getDocs } from "firebase/firestore";
import { z } from "zod";
import { getFirestoreDb } from "@/services/firebase-client";
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

let cachedContributorLists: ContributorLists | null = null;
let contributorPromise: Promise<ContributorLists> | null = null;

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

async function fetchContributorList(
  collectionName: string,
  fallback: Contributor[],
): Promise<Contributor[]> {
  const db = getFirestoreDb();
  if (!db) {
    return fallback;
  }

  try {
    const snapshot = await getDocs(collection(db, collectionName));
    if (snapshot.empty) {
      throw new Error("EMPTY_DATASET");
    }
    const items = snapshot.docs.map((doc) => doc.data());
    return contributorsSchema.parse(items);
  } catch (error) {
    console.warn(
      `Failed to load ${collectionName} from Firebase. Falling back to local JSON.`,
      error,
    );
    return fallback;
  }
}

export function getLocalContributorLists(): ContributorLists {
  return localContributorLists;
}

export async function getContributorLists(): Promise<ContributorLists> {
  if (cachedContributorLists) {
    return cachedContributorLists;
  }

  if (contributorPromise) {
    return contributorPromise;
  }

  contributorPromise = (async () => {
    const [betaTesters, bugBusters, developers] = await Promise.all([
      fetchContributorList("beta_testers", localContributorLists.betaTesters),
      fetchContributorList("bug_busters", localContributorLists.bugBusters),
      fetchContributorList("developers", localContributorLists.developers),
    ]);

    const lists: ContributorLists = {
      betaTesters,
      bugBusters,
      developers,
    };

    cachedContributorLists = lists;
    return lists;
  })();

  return contributorPromise;
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
