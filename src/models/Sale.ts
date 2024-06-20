import mongoose, { Schema } from "mongoose";

// Define the main schema
export const salesSchema = new mongoose.Schema(
  {
    inscriptions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Inscription",
        required: true,
      },
    ],
    inscription_ids: [
      {
        type: String,
        required: true,
        validate: {
          validator: (value: string) => /^[a-f0-9]+i\d+$/.test(value),
          message: () =>
            "inscription_id should be in the format: hexadecimalStringiIndex",
        },
      },
    ],
    type: {
      type: String,
      enum: ["normal", "cbrc"],
      default: "normal",
      require: true,
    },

    price_usd: { type: Number, required: true },
    price_sat: { type: Number, required: true },
    price_btc: { type: Number, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    txid: { type: String, required: true },
    timestamp: { type: Date, required: true },
    trade_id: { type: Number, required: true, unique: true },

    // Collection items
    official_collections: [
      {
        type: Schema.Types.ObjectId,
        ref: "Collection",
        required: true,
      },
    ],

    // tokens
    token: { type: String },
    amount: { type: Number },

    sat_per_token: { type: mongoose.Schema.Types.Decimal128, required: false },
    usd_per_token: { type: mongoose.Schema.Types.Decimal128, required: false },
    btc_per_token: { type: mongoose.Schema.Types.Decimal128, required: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

salesSchema.index({ to: 1, from: 1, timestamp: -1 });
salesSchema.index({ inscription_ids: 1 });
salesSchema.index({ type: 1, timestamp: -1 });
