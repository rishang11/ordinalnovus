import { Document } from "mongoose";

export interface IRune extends Document {
  name: string;
  id: string;
  block: number;
  timestamp: Date;
  start?: number;
  end?: number;
  amount?: number;
  cap?: number;
  premine: number;
  burned: number;
  mints: number;
  divisibility: number;
  symbol?: string;
  etching: string;
  parent?: string;
  remaining?: number;
  mintable: boolean;
  turbo: boolean;
}
