"use server";

import {
  doesUtxoContainInscription,
  getUtxosByAddress,
} from "../Marketplace";
import { doesUtxoContainRunes } from "./doesUtxoContainRunes";

export async function countDummyUtxos(address: string): Promise<number> {
  let counter = 0;

  const utxos = await getUtxosByAddress(address);

  for (const utxo of utxos) {
    if (utxo.value >= 580 && utxo.value <= 1000) {
      if (await doesUtxoContainInscription(utxo)) {
        continue;
      }
      if (await doesUtxoContainRunes(utxo)) {
        continue;
      }

      counter++;

      if (counter === 20) {
        break;
      }
    }
  }
  return counter;
}
