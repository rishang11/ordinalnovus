import Redis, { Callback, RedisKey } from "ioredis";

// Instantiate the Redis client
const redis = new Redis({
  // Redis connection options go here
  host: process.env.REDIS_URL,
  port: 6380,
});

// const getKeysAndValuesByPattern = async (pattern: string): Promise<void> => {
//   let cursor = "0";
//   const allData = [];
//   do {
//     const reply = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
//     console.log({ reply });
//     cursor = reply[0];
//     const keys = reply[1];
//     if (keys.length > 0) {
//       const values = await Promise.all(keys.map((key) => redis.get(key)));
//       keys.forEach((key, index) => allData.push({ key, value: values[index] }));
//     }
//   } while (cursor !== "0");

//   console.log(allData); // Displays all keys and their corresponding values
// };

// getKeysAndValuesByPattern("rune_utxo:*") // Adjust pattern as needed
//   .then(() => console.log("Data retrieval complete"))
//   .catch(console.error);

// const removeKeysByPattern = async (pattern: string) => {
//   let cursor = "0";
//   do {
//     const reply = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
//     // console.log({ reply });
//     cursor = reply[0];
//     const keys = reply[1];
//     if (keys.length > 0) {
//       await redis.del(keys);
//     }
//   } while (cursor !== "0");
// };

// removeKeysByPattern("rune_utxo:*")
//   .then(() => console.log("Cache cleared"))
//   .catch(console.error);

export async function setCache(
  key: RedisKey,
  value: any,
  expiryInSeconds: string | number
) {
  try {
    if (
      typeof key === "string" &&
      process.env.NEXT_PUBLIC_NETWORK === "testnet"
    )
      key = "testnet::" + key;
    // Store the value in Redis, set to expire after the given time (in seconds)
    await redis.set(key, JSON.stringify(value), "EX", expiryInSeconds);
  } catch (error) {
    console.error(`Error setting cache for key ${key}: ${error}`);
  }
}

export async function getCache(key: RedisKey) {
  try {
    // Fetch the value from Redis
    const value = await redis.get(key);

    if (value) {
      // If the value exists, parse it from JSON and return it
      return JSON.parse(value);
    } else {
      // If the value doesn't exist, return null
      return null;
    }
  } catch (error) {
    console.error(`Error getting cache for key ${key}: ${error}`);
    return null;
  }
}

export async function invalidateCache(key: RedisKey) {
  try {
    // Remove the value from Redis
    await redis.del(key);
  } catch (error) {
    console.error(`Error invalidating cache for key ${key}: ${error}`);
  }
}

export async function getCacheExpiry(key: RedisKey): Promise<number> {
  try {
    // Get the TTL (time to live) for the key in Redis
    const ttl = await redis.ttl(key);

    // If the TTL is -2, the key does not exist; if it's -1, the key exists but has no expiry
    // Otherwise, ttl is the remaining time in seconds
    return ttl;
  } catch (error) {
    console.error(`Error getting cache expiry for key ${key}: ${error}`);
    return -2; // Return -2 as an indication of an error
  }
}
