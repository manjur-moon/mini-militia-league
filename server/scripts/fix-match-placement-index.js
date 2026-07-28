import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { MatchResult } from "../src/models/match-result.model.js";

const PLACEMENT_INDEX_NAME = "matchId_1_official.placement_1";

async function replacePlacementIndex() {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
  });

  const collection = MatchResult.collection;
  const indexes = await collection.indexes();

  const currentIndex = indexes.find((index) => index.name === PLACEMENT_INDEX_NAME);

  if (currentIndex) {
    console.log(`Dropping existing index: ${PLACEMENT_INDEX_NAME}`);

    await collection.dropIndex(PLACEMENT_INDEX_NAME);
  }

  console.log(`Creating non-unique index: ${PLACEMENT_INDEX_NAME}`);

  await collection.createIndex(
    {
      matchId: 1,
      "official.placement": 1,
    },
    {
      name: PLACEMENT_INDEX_NAME,
      partialFilterExpression: {
        status: "verified",
        "official.placement": {
          $type: "number",
        },
      },
    },
  );

  const updatedIndex = (await collection.indexes()).find(
    (index) => index.name === PLACEMENT_INDEX_NAME,
  );

  console.log("\nPlacement index updated:");

  console.dir(
    {
      name: updatedIndex?.name,
      key: updatedIndex?.key,
      unique: Boolean(updatedIndex?.unique),
      partialFilterExpression: updatedIndex?.partialFilterExpression ?? null,
    },
    {
      depth: null,
    },
  );
}

replacePlacementIndex()
  .catch((error) => {
    console.error("Failed to update MatchResult placement index.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
