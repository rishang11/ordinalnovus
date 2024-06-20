"use server";
import { IRune } from "@/types/Runes";
// apiHelper/fetchRunes.ts
import axios from "axios";

export interface FetchRunesParams {
  page_size: number;
  page: number;
  sort?: string;
  name?: string;
  id?: string;
}

export interface InscriptionResponse {
  runes: IRune[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export async function fetchRunes(
  params: FetchRunesParams
): Promise<{ data: InscriptionResponse; error: string | null } | undefined> {
  const { sort, page_size, page, name, id } = params;
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/runes`,
      {
        params: {
          _sort: sort || "block:1",
          _limit: page_size,
          _start: (page - 1) * page_size,
          name,
          id,
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
