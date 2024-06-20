"use server";
import axios from "axios";

export interface FetchCBRCBalParams {
  address: string;
}

interface bal {
  tick: string;
  amt: number;
  lock: number;
  mint: number;
  total: number;
  total_usd_value: number;
  total_btc_value: number;
  total_sat_value: number;
}

interface BalResponse {
  tokenData: bal[];
  stats: {
    total_tokens: number;
    total_balance_in_usd: number;
    total_balance_in_sats: number;
    total_balance_in_btc: number;
  };
}

export async function FetchCBRCBalance(
  params: FetchCBRCBalParams
): Promise<{ data: BalResponse; error: string | null } | undefined> {
  const { address } = params;
  console.debug({ params });
  try {
    let url = `${process.env.NEXT_PUBLIC_URL}/api/v2/cbrc/get-balance?address=${address}&apikey=${process.env.API_KEY}`;
    const response = await axios.get(url);

    if (response.status === 200) {
      return { data: response.data || [], error: null };
    } else {
      return undefined;
    }
  } catch (error) {
    return undefined;
  }
}

// Objecttapleaf: "347a451fb8e7b0dfab3646ffe8e937842bd3cb1c508aa043fdef39e3a781b6b2"[[Prototype]]: Object
// Crafter-E3pY58e0.js:1 Objecttcblock: "c010ee8629a097ea8db334e0bb781a23ef1c423f08462b6f468bf3ae684af05590"tpubkey: "f7e1b19be31a074cb10898d4b023d5f41b30e69d4f33ec9525eb767f4c1961c7"[[Prototype]]: Object
// Crafter-E3pY58e0.js:1 Objecttpubkey: "f7e1b19be31a074cb10898d4b023d5f41b30e69d4f33ec9525eb767f4c1961c7"[[Prototype]]: Object 'main'
