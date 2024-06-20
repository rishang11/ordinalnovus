"use client";
import { useState } from "react";
import Hero from "./Hero";
import CBRCTrends from "./CBRCTrends";
import CustomTab from "@/components/elements/CustomTab";
import CBRCTokensList from "./CBRCTokensList";
import Sales from "./Sales";
import CBRCLatestListings from "./Listings";
import CollectionsSection from "./Collections";

export default function Homepage({ homepageData }: { homepageData: any }) {
  // const [tab, setTab] = useState("cbrc");
  const [tab, setTab] = useState("tokens");

  return (
    <div>
      <div className="min-h-[70vh] flex flex-col gap-[60px]">
        <Hero heroData={homepageData.featured} />
        <CBRCTrends token={homepageData.stats} />
        <CollectionsSection data={homepageData.collections} />
        <div>
          <div className="flex justify-center lg:justify-start">
            <CustomTab
              tabsData={[
                { label: "Tokens", value: "tokens" },
                { label: "Listings", value: "listings" },
                { label: "Sales", value: "sales" },
              ]}
              currentTab={tab}
              onTabChange={(_, newTab) => setTab(newTab)}
            />
          </div>{" "}
          {tab === "tokens" && (
            <CBRCTokensList defaultData={homepageData.cbrctokens} />
          )}
          {tab === "sales" && <Sales />}
          {tab === "listings" && <CBRCLatestListings />}
        </div>
      </div>
      {/* {<HomepageCBRCTab data={homepageData} />} */}
    </div>
  );
}
