"use server";
import { Activity } from "@/models";
/**
 * Creates a new activity document in the database.
 * @param {Object} data - The activity data.
 * @returns {Promise<mongoose.Document>} The promise to return the created activity document.
 */
export async function createActivity(data: any) {
  try {
    if (data.txid) {
      data.tx_status = "pending";
    }
    // Create a new activity instance
    const activity = new Activity(data);
    console.log({ activity });

    // Validate and save the activity to the database
    await activity.validate();
    const result = await activity.save();

    return result;
  } catch (error) {
    console.error("Error creating activity document:", error);
    throw error; // Rethrow the error after logging it
  }
}
