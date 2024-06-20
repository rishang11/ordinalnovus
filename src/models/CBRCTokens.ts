import mongoose, { Schema } from "mongoose";

export const CBRCTokenSchema = new Schema(
  {
    tick: { type: String, index: true, unique: true },
    // new for apis
    ticker_id: { type: String },
    base_currency: { type: String },
    target_currency: { type: String }, // BTC
    last_price: { type: mongoose.Schema.Types.Decimal128 },
    last_qty: { type: Number },
    base_volume: { type: Number },
    target_volume: { type: Number },
    bid_price: { type: Number },
    ask_price: { type: Number },
    ask_qty: { type: Number },
    high_price: { type: Number }, // 24H
    low_price: { type: Number }, // 24H
    // end
    checksum: { type: String, index: true },
    allowed: { type: Boolean, default: false, index: true },
    supply: { type: Number, default: 0 },
    max: Number,
    lim: Number,
    dec: Number,
    number: Number,
    mint: { type: Boolean },
    mintops: [
      { type: Number, default: 0 },
      { type: Number, default: 0 },
    ],
    deleted: { type: Boolean },
    price: { type: Number, index: true },
    marketcap: { type: Number, index: true },
    in_mempool: { type: Number, index: true },
    volume: { type: Number, index: true },
    on_volume: { type: Number, index: true },
    _24h_vol_change: { type: Number, index: true },
    _24h_on_vol_change: { type: Number, index: true },
    _24h_price_change: { type: Number, index: true },
    _7d_price_change: { type: Number },
    last_updated: { type: Date, index: true },
    icon: { type: String },
    x_link: { type: String },
    discord_link: { type: String },
    website_link: { type: String },
    description: { type: String },
  },
  {
    timestamps: true, // Enable timestamps
  }
);

// Compound index for sorting by multiple fields
CBRCTokenSchema.index({ price: 1, volume: 1, on_volume: 1, last_updated: 1 });
CBRCTokenSchema.index({ tick: "text" });
CBRCTokenSchema.index({ featured: 1, priority: -1, on_volume: -1 });
