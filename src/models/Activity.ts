import mongoose, { Schema } from "mongoose";
const { ObjectId } = Schema.Types;
export const activitySchema = new mongoose.Schema(
  {
    inscription_id: {
      type: String,
    },
    inscription: { type: ObjectId, ref: "Inscription" },
    type: {
      type: String,
      enum: [
        "list",
        "delist",
        "update-listing",
        "inscribe",
        "reinscribe",
        "buy",
        "prepare",
        "mint-rune",
      ],
      require: true,
    },
    user: { type: ObjectId, ref: "Wallet", index: true },
    seller: {
      type: String,
    },
    buyer: {
      type: String,
    },
    price_usd: {
      type: Number,
    },
    price_sat: {
      type: Number,
    },
    txid: {
      type: String,
    },
    order_id: {
      type: String,
    },
    status: {
      type: String,
      required: false,
      enum: [
        "payment pending",
        "payment received",
        "tx pending",
        "inscribed",
        "cancelled",
      ],
    },
    tx_status: {
      type: String,
      required: false,
      enum: ["pending", "confirmed", "cancelled"],
    },
    added_to_sales: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({
  type: 1,
  status: 1,
  tx_status: 1,
  txid: 1,
  user: 1,
  added_to_sales: 1,
});
