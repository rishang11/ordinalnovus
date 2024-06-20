import mongoose from "mongoose";

export const runeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    id: {
      type: String,
      required: true,
      unique: true,
    },
    block: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    start: {
      type: Number,
      required: false,
    },
    end: {
      type: Number,
      required: false,
    },
    amount: {
      type: Number,
      required: false,
    },
    cap: {
      type: Number,
      required: false,
    },
    premine: {
      type: Number,
      required: true,
    },
    burned: {
      type: Number,
      required: true,
    },
    mints: {
      type: Number,
      required: true,
    },
    divisibility: {
      type: Number,
      required: true,
    },
    symbol: {
      type: String,
      required: false,
    },
    etching: {
      type: String,
      required: true,
    },
    parent: {
      type: String,
      required: false,
    },
    remaining: {
      type: Number,
      required: false,
    },
    mintable: {
      type: Boolean,
      required: true,
    },
    turbo: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

runeSchema.index({ block: 1, name: 1, id: 1 });
runeSchema.index({ name: "text" });
