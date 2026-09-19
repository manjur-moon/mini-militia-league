import mongoose from "mongoose";

import { env } from "../config/env.js";
import { MatchResult } from "../models/match-result.model.js";
import { Match } from "../models/match.model.js";
import { resolveLegacyLeagueDate } from "../utils/league-date.js";

const BATCH_SIZE = 500;
const VALIDATE_ONLY = process.argv.includes("--validate-only");

async function flushMatchBatch(batch) {
  if (!batch.length) return;
  await Match.bulkWrite(batch, { ordered: false });
  batch.length = 0;
}

async function backfillMatches() {
  const cursor = Match.find({
    $or: [{ leagueDate: null }, { leagueDate: { $exists: false } }],
  })
    .select({ _id: 1, matchDate: 1, timezone: 1 })
    .lean()
    .cursor();

  const batch = [];
  let updated = 0;

  for await (const match of cursor) {
    const leagueDate = resolveLegacyLeagueDate(
      match.matchDate,
      match.timezone ?? env.LEAGUE_TIMEZONE,
    );

    batch.push({
      updateOne: {
        filter: { _id: match._id },
        update: {
          $set: {
            leagueDate,
            leagueDateSource: "legacy_7am",
          },
        },
      },
    });

    updated += 1;

    if (batch.length >= BATCH_SIZE) {
      await flushMatchBatch(batch);
    }
  }

  await flushMatchBatch(batch);
  return updated;
}

async function backfillVerifiedResults() {
  const missingFilter = {
    status: "verified",
    $or: [
      { officialLeagueDate: null },
      { officialLeagueDate: { $exists: false } },
    ],
  };

  const matchIds = await MatchResult.distinct("matchId", missingFilter);
  let updated = 0;

  for (let index = 0; index < matchIds.length; index += BATCH_SIZE) {
    const ids = matchIds.slice(index, index + BATCH_SIZE);

    const matches = await Match.find({
      _id: { $in: ids },
    })
      .select({ _id: 1, leagueDate: 1 })
      .lean();

    const leagueDates = new Map(
      matches.map((match) => [String(match._id), match.leagueDate]),
    );

    const operations = ids.map((matchId) => {
      const leagueDate = leagueDates.get(String(matchId));

      if (!leagueDate) {
        throw new Error(`Missing leagueDate for match ${String(matchId)}.`);
      }

      return {
        updateMany: {
          filter: {
            matchId,
            ...missingFilter,
          },
          update: {
            $set: {
              officialLeagueDate: leagueDate,
            },
          },
        },
      };
    });

    if (operations.length) {
      const result = await MatchResult.bulkWrite(operations, { ordered: false });
      updated += result.modifiedCount ?? 0;
    }
  }

  return updated;
}

async function validateMigration() {
  const [missingMatches, missingVerifiedResults, mismatches] = await Promise.all([
    Match.countDocuments({
      $or: [{ leagueDate: null }, { leagueDate: { $exists: false } }],
    }),
    MatchResult.countDocuments({
      status: "verified",
      $or: [
        { officialLeagueDate: null },
        { officialLeagueDate: { $exists: false } },
      ],
    }),
    MatchResult.aggregate([
      { $match: { status: "verified" } },
      {
        $lookup: {
          from: "matches",
          localField: "matchId",
          foreignField: "_id",
          as: "match",
        },
      },
      { $unwind: "$match" },
      {
        $match: {
          $expr: { $ne: ["$officialLeagueDate", "$match.leagueDate"] },
        },
      },
      { $count: "count" },
    ]),
  ]);

  return {
    missingMatches,
    missingVerifiedResults,
    mismatchedVerifiedResults: mismatches[0]?.count ?? 0,
  };
}

async function main() {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10_000,
  });

  let updatedMatches = 0;
  let updatedVerifiedResults = 0;

  if (!VALIDATE_ONLY) {
    updatedMatches = await backfillMatches();
    updatedVerifiedResults = await backfillVerifiedResults();

    // Create missing schema indexes without dropping unrelated/manual indexes.
    await Promise.all([Match.createIndexes(), MatchResult.createIndexes()]);
  }

  const validation = await validateMigration();

  console.log(
    JSON.stringify(
      {
        mode: VALIDATE_ONLY ? "validate-only" : "migrate",
        updatedMatches,
        updatedVerifiedResults,
        validation,
      },
      null,
      2,
    ),
  );

  if (Object.values(validation).some((value) => value !== 0)) {
    throw new Error("League-date migration validation failed.");
  }
}

main()
  .catch((error) => {
    console.error("League-date migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
