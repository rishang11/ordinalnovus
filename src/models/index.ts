import { model, models } from "mongoose";
import { collectionSchema } from "./Collection";
import { inscriptionSchema } from "./Inscription";
import { APIKeySchema } from "./APIKey";
import { TXCacheSchema } from "./tx";
import { BlocksSchema } from "./block";
import { InscribeOrderSchema } from "./InscribeOrder";
import { salesSchema } from "./Sale";
import { WalletSchema } from "./Wallets";
import { CbrcStatsSchema } from "./CBRCStats";
import { APIUsageLogSchema } from "./APIUsageLog";

import { CBRCTokenSchema } from "./CBRCTokens";
import { createInscriptionSchema } from "./createInscription";
import { cbrcSalesSchema } from "./CBRCSales";
import { CounterSchema } from "./Counter";
import { activitySchema } from "./Activity";
import { runeSchema } from "./Rune";
import { RuneOrderSchema } from "./RuneOrder";
import { executeRuneOrder } from "./ExecuteRuneOrder";
import { JobSchema } from "./InscriptionJob";
const Inscription =
  models.Inscription || model("Inscription", inscriptionSchema);

const Collection = models.Collection || model("Collection", collectionSchema);
const APIKey = models.APIKey || model("APIKey", APIKeySchema);
const Tx = models.Tx || model("Tx", TXCacheSchema);
const Counter = models.Counter || model("Counter", CounterSchema);
const Block = models.Block || model("Block", BlocksSchema);
const Inscribe = models.Inscribe || model("Inscribe", InscribeOrderSchema);
const CreateInscription =
  models.CreateInscription ||
  model("CreateInscription", createInscriptionSchema);
const Sale = models.Sale || model("Sale", salesSchema);
const CBRCSale = models.CBRCSale || model("CBRCSale", cbrcSalesSchema);
const Wallet = models.Wallet || model("Wallet", WalletSchema);

const Activity = models.Activity || model("Activity", activitySchema);
const APIKeyUsage =
  models.APIKeyUsage || model("APIKeyUsage", APIUsageLogSchema);

const CBRCToken = models.CBRCToken || model("CBRCToken", CBRCTokenSchema);
const CBRCStats = models.CBRCStats || model("CBRCStats", CbrcStatsSchema);
const Rune = models.Rune || model("Rune", runeSchema);
const TestnetRune = models.TestnetRune || model("TestnetRune", runeSchema);

const RuneOrder = models.RuneOrder || model("RuneOrder", RuneOrderSchema);
const InscriptionJob =
  models.InscriptionJob || model("InscriptionJob", JobSchema);
const ExecuteRuneOrder =
  models.ExecuteRuneOrder || model("ExecuteRuneOrder", executeRuneOrder);
export {
  Inscribe,
  CreateInscription,
  Inscription,
  Collection,
  APIKey,
  Tx,
  Block,
  Sale,
  Wallet,
  APIKeyUsage,
  CBRCToken,
  CBRCStats,
  CBRCSale,
  Counter,
  Activity,
  Rune,
  TestnetRune,
  RuneOrder,
  InscriptionJob,
  ExecuteRuneOrder,
};
