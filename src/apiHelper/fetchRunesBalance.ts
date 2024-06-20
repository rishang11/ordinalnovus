"use server";

import axios from "axios";

export interface FetchBalParams {
  addresses: string[];
}

// Interface to describe the structure of each rune's aggregated data
interface RuneAggregation {
  totalAmount: number;
  occurrences: number;
  divisibility: number;
  symbol: string;
}

// Interface to describe the response for each address
interface AddressResponse {
  success: boolean;
  data: { [runeName: string]: RuneAggregation };
}

// Interface to describe the entire response structure
interface RunesResponse {
  [address: string]: AddressResponse;
}

export async function fetchRunesBalance(
  params: FetchBalParams
): Promise<{ data: RunesResponse; error: string | null } | undefined> {
  const { addresses } = params;
  try {
    const url = `${process.env.NEXT_PUBLIC_URL}/api/v2/runes/balance`;
    const response = await axios.get(url, {
      params: { addresses: addresses.join("|"), apikey: process.env.API_KEY },
    });

    if (response.status === 200) {
      return { data: response.data, error: null };
    } else {
      return undefined;
    }
  } catch (error) {
    console.log({ error }, "bal err");
    return undefined;
  }
}
