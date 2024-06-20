"use server";
import { IStats } from "@/types";
import axios from "axios";
const fetchStats = async (): Promise<IStats | null> => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/stats`
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
};

export default fetchStats;
