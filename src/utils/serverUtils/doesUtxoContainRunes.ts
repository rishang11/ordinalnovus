"use server";

import { getCache, setCache } from "@/lib/cache";
import axios from "axios";
import { AddressTxsUtxo } from "bitcoin-wallet-adapter/dist/types/types";

export async function doesUtxoContainRunes(
  utxo: AddressTxsUtxo
): Promise<boolean> {
  const cacheKey = `rune_utxo:${utxo.txid}:${utxo.vout}`;
  try {
    // First, try to retrieve data from cache
    const cachedRunes = await getCache(cacheKey);
    if (cachedRunes !== null) {
      console.log(
        "Returning runes data from cache...",
        // cachedRunes,
        typeof cachedRunes
      );
      return cachedRunes; // Ensure the string from the cache is converted back to boolean
    }

    const apiUrl = process.env.NEXT_PUBLIC_NETWORK?.includes("testnet")
      ? "http://64.20.33.102:56018/"
      : `${process.env.NEXT_PUBLIC_PROVIDER}/`;

    if (!apiUrl) {
      console.warn("API provider URL is not defined in environment variables");
      return true; // Defaulting to true if the API URL isn't set
    }

    const response = await axios.get(
      `${apiUrl}output/${utxo.txid}:${utxo.vout}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    // Store result in cache if no runes are found
    if (response.data.runes?.length) {
      await setCache(cacheKey, response.data.runes, 172800);
      return response.data.runes;
    } else {
      await setCache(cacheKey, false, 172800); // Store the information for 2 days (172800 seconds)
      return false;
    }
  } catch (error) {
    console.error("Error in doesUtxoContainRunes:", error);
    return true; // Defaulting to true in case of an error
  }
}
