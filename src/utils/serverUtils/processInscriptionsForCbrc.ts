"use server";

import { checkCbrcValidity } from "@/app/api/v2/search/inscription/route";
import { ICollection, IInscription } from "@/types";

export async function processInscriptionsForCbrc(
  inscriptions: IInscription[],
  collection: ICollection | null = null
) {
  const inscriptionPromises = inscriptions.map(async (ins: IInscription) => {
    if (ins?.parsed_metaprotocol && ins.valid !== false) {
      if (
        ins.parsed_metaprotocol.includes("cbrc-20") &&
        ins.parsed_metaprotocol.includes("transfer")
      ) {
        await processInscription(ins, collection);
      }
    }
  });

  await Promise.all(inscriptionPromises);
  return inscriptions;
}

async function processInscription(
  ins: IInscription,
  collection: ICollection | null
) {
  try {
    let valid = null; // true | false | undefined | null
    console.log("checking validity from api...");
    valid = await checkCbrcValidity(ins.inscription_id);

    if (valid !== undefined) {
      // Part of CBRC Collection
      if (true) {
        // Just CBRC Token
        ins.cbrc_valid = valid; // true | false
      }
    } else {
      console.debug(
        "checkCbrcValidity returned undefined for inscription_id:",
        ins.inscription_id
      );
      // await setCache(cacheKey, valid, 120); // Cache the undefined value to recheck later
    }
  } catch (error) {
    console.error(
      "Error in processInscription for inscription_id:",
      ins.inscription_id,
      error
    );
  }
}
