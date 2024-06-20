"use server";
import { IActivity } from "@/types";
// apiHelper/fetchActivity.ts
import axios from "axios";

export interface FetchActivityParams {
  page_size: number;
  page: number;
  addresses: string[];
  sort?: string;
  search?: string;
  type?: string;
  inscription_number?: number;
  inscription_id?: string;
}

export interface ActivityResponse {
  activities: IActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export async function fetchActivities(
  params: FetchActivityParams
): Promise<{ data: ActivityResponse; error: string | null } | undefined> {
  let {
    sort,
    search,
    page_size,
    page,
    addresses,
    type,
    inscription_number,
    inscription_id,
  } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/activity`,
      {
        params: {
          addresses: addresses.join("|"),
          _sort: sort || "createdAt:1",
          ...(search && { q: search }),
          ...(type && { type }),
          _limit: page_size,
          _start: (page - 1) * page_size,
          ...(inscription_id && { inscription_id }),
          ...(inscription_number && { inscription_number }),
          apikey: process.env.API_KEY,
        },
      }
    );

    if (response.status === 200) {
      return { data: response.data || [], error: null };
    } else {
      return undefined;
    }
  } catch (error) {
    console.log({ ERROR: error });
    return undefined;
  }
}
