// /api/new-homepage

import { getCache, setCache } from "@/lib/cache";
import dbConnect from "@/lib/dbConnect";
import { CBRCStats, CBRCToken, Collection } from "@/models";
import { IStats } from "@/types";
import { NextRequest, NextResponse } from "next/server";

async function fetchCBRCTokenHero() {
  try {
    const featuredTokens = await CBRCToken.find({
      allowed: true,
      deleted: false,
      featured: true,
      priority: { $gt: 0 },
    })
      .sort({ priority: -1, on_volume: -1 })
      .select("tick description icon")
      .lean()
      .exec();

    const featuredCollections = await Collection.find({
      featured: true,
      priority: { $gt: 0 },
    })
      .sort({ priority: -1, on_volume: -1 })
      .select("-holders")
      .lean()
      .exec();

    return {
      data: [...featuredCollections, ...featuredTokens],
      error: false,
      key: "homepage-featured-cbrctoken",
    };
  } catch (err) {
    console.log("Error while fetching featured CBRCTokens", err);
    throw new Error("Error while fetching featured CBRCTokens");
  }
}

async function fetchCollections() {
  try {
    const collections = await Collection.find({
      live: true,
      $or: [
        { fp: { $gt: 0 } },
        { listed: { $gt: 0 } },
        { in_mempool: { $gt: 0 } },
        { featured: true },
      ],
    })
      .sort({ featured: 1, priority: -1, volume: -1 })
      .select("-holders")
      .lean()
      .exec();

    return {
      data: collections,
      error: false,
      key: "homepage-collections",
    };
  } catch (err) {
    console.log("Error while fetching featured CBRCTokens", err);
    throw new Error("Error while fetching featured CBRCTokens");
  }
}

async function fetchStats() {
  try {
    const latestStats: IStats | null = await CBRCStats.findOne()
      .sort({ createdAt: -1 })
      .populate("tokensTrend")
      .populate("tokensHot")
      .lean();

    if (!latestStats) {
      return { data: null, error: true, message: "No stats data found" };
    }

    return { data: latestStats, error: false, key: "homepage-stats" };
  } catch (err) {
    console.log("Error fetching stats data", err);
    throw new Error("Error while fetching stats data");
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log("***** FETCH HOMEPAGE DATA *****");
    await dbConnect();
    const operationsArr = [
      {
        key: "homepage-featured-cbrctoken",
        operation: fetchCBRCTokenHero,
      },
      { key: "homepage-stats", operation: fetchStats },
      { key: "homepage-collections", operation: fetchCollections },
    ];

    const promises = [];
    const data: any = {};

    for (const { key, operation } of operationsArr) {
      const cachedData = await getCache(key);

      if (cachedData) {
        data[key] = cachedData;
      } else {
        promises.push(operation());
      }
    }

    const operationsResult: any = await Promise.allSettled(promises);

    for (const result of operationsResult) {
      const value = await result.value;
      const key = await result.value.key;
      if (result.status === "fulfilled" && key) {
        await setCache(key, value, 30);
      }
      data[key] = value;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("Error:", err.message || err);
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
