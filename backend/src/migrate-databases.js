import mongoose from "mongoose";

const mappings = [
  ["SUBJECTS_URI", "subjects", ["subjects"]],
  ["TEACHERS_URI", "teachers", ["teachers"]],
  ["SECTIONS_URI", "sections", ["sections"]],
  ["ROUTINES_URI", "routines", ["routines", "teacherassignmenthistories"]],
];

async function copyCollection(sourceDb, targetDb, collectionName) {
  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);
  const documents = await sourceCollection.find({}).toArray();

  if (documents.length === 0) {
    console.log(`Migrated ${collectionName}: 0 documents`);
    return;
  }

  const operations = documents.map((document) => ({
    replaceOne: {
      filter: { _id: document._id },
      replacement: document,
      upsert: true,
    },
  }));
  await targetCollection.bulkWrite(operations);
  console.log(`Migrated ${collectionName}: ${documents.length} documents`);
}

const sourceUri = process.env.MONGO_SOURCE_URI;
if (!sourceUri) {
  console.error("MONGO_SOURCE_URI is required");
  process.exit(1);
}

const source = await mongoose.createConnection(sourceUri).asPromise();

try {
  for (const [targetEnv, _targetName, collectionNames] of mappings) {
    const targetUri = process.env[targetEnv];
    if (!targetUri) throw new Error(`${targetEnv} is required`);

    const target = await mongoose.createConnection(targetUri).asPromise();
    for (const collectionName of collectionNames) {
      await copyCollection(source.db, target.db, collectionName);
    }
    await target.close();
  }
  console.log("Database-per-service migration complete");
} finally {
  await source.close();
}
