"use server";
// api/fetchTxes.ts
import { ISale } from "@/types";
import axios from "axios";

export interface FetchTxParams {
  page_size: number;
  page: number;
  sort?: string;
  tick?: string;
  wallet?: string;
  official_collection?: string;
}

export interface TXResponse {
  sales: ISale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export async function fetchTxes(
  params: FetchTxParams
): Promise<{ data: TXResponse; error: string | null } | undefined> {
  const { sort, page_size, page, tick, wallet, official_collection } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/sales`,
      {
        params: {
          _sort: sort,
          _limit: page_size,
          _start: (page - 1) * page_size,
          token: tick,
          wallet,
          official_collections: official_collection,
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
    return undefined;
  }
}
