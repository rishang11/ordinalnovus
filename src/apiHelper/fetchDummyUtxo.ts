"use server";

import axios from "axios";

export interface FetchDummyUtxoParams {
  address: string;
}

export interface DummyUtxoRes {
  dummyUtxos: number;
}

export async function FetchDummyUtxo(
  params: FetchDummyUtxoParams
): Promise<{ data: DummyUtxoRes; error: string | null } | undefined> {
  const { address } = params;
  try {
    const url = `${process.env.NEXT_PUBLIC_URL}/api/utils/dummy-utxo`;
    const response = await axios.get(url, {
      params: { address, apikey: process.env.API_KEY },
    });

    if (response.status === 200) {
      return { data: response.data, error: null };
    } else {
      return undefined;
    }
  } catch (error) {
    console.log({ error }, "error while fetching dummy utxos");
    return undefined;
  }
}
