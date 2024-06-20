import mongoose from "mongoose";

// Define the main schema
export const JobSchema = new mongoose.Schema(
  {
    height: { type: Number, required: true, unique: true, index: true },
    blockhash: {
      type: String,
      unique: true,
      required: true,
    },
    work: { type: Boolean, default: true },
    done: { type: Boolean, default: false, index: true },
    inscriptions: { type: [String] },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
