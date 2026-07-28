import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { MatchResult } from "../src/models/match-result.model.js";

async function main() {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
  });

  const indexes = await MatchResult.collection.indexes();

  console.log("\nMatchResult collection indexes:\n");

  for (const index of indexes) {
    console.dir(
      {
        name: index.name,
        key: index.key,
        unique: Boolean(index.unique),
        partialFilterExpression: index.partialFilterExpression ?? null,
      },
      {
        depth: null,
      },
    );
  }
}

main()
  .catch((error) => {
    console.error("Unable to list MatchResult indexes.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
