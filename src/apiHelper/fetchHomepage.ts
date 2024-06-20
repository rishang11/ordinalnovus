import axios from "axios";

export default async function () {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/homepage`
    );

    const page_size = 20;
    const page = 1;
    const tokenData = await axios.get(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/cbrc`,
      {
        params: {
          _limit: page_size,
          _start: (page - 1) * page_size,
          apikey: process.env.API_KEY,
        },
      }
    );

    if (response.status === 200 && tokenData && tokenData.data) {
      const responseData = response.data.data;
      return {
        success: true,
        data: {
          featured: responseData["homepage-featured-cbrctoken"].data,
          stats: responseData["homepage-stats"].data,
          cbrctokens: tokenData.data,
          collections: responseData["homepage-collections"].data,
        },
        error: null,
      };
    } else {
      return undefined;
    }
  } catch (err: any) {
    console.log("Error while fetching new homepage data", err.message || err);
    return undefined;
  }
}
