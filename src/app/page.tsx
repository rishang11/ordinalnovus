import Homepage from "@/Views/Homepage";
import fetchHomepage from "@/apiHelper/fetchHomepage";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
export default async function Home() {
  const homepageApiData = await fetchHomepage();

  console.log({ homepageApiData });

  if (!homepageApiData || !homepageApiData.data) notFound();

  const homepageData = homepageApiData.data;

  return (
    <div>
      <Homepage homepageData={homepageData} />
    </div>
  );
}

export async function generateMetadata(
  parent: ResolvingMetadata
): Promise<Metadata> {
  return {
    title: "Ordinal Novus",
    description:
      "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
    keywords: [
      "OrdinalNovus",
      "NFT",
      "non-fungible tokens",
      "Bitcoin",
      "ordinals",
      "inscriptions",
      "marketplace",
      "explorer",
      "digital art",
      "blockchain",
      "NFT Trading",
      "NFT Collecting",
    ],
    openGraph: {
      title: "Ordinal Novus",
      description:
        "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
      url: "https://ordinalnovus.com",
      siteName: "Ordinal Novus",
      images: [
        {
          url: `${
            process.env.NEXT_PUBLIC_URL
          }/api/generate-image?url=${encodeURIComponent(
            "https://ordinalnovus.com"
          )}`,
        },
      ],
      locale: "en-US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Ordinal Novus",
      description:
        "Explore, trade, and showcase unique Bitcoin-based ordinals and inscriptions on OrdinalNovus, the ultimate platform for NFT enthusiasts, collectors, and creators.",
      creator: "@OrdinalNovus",
      images: [
        `${
          process.env.NEXT_PUBLIC_URL
        }/api/generate-image?url=${encodeURIComponent(
          "https://ordinalnovus.com"
        )}`,
      ],
    },
  };
}
