process.env.USE_FIREBASE = "true";

import fs from "fs";
import { fileStore } from "./fileStore.js";

const files = [
  "data/cricket/players.json",
  "data/cricket/franchises.json",
  "data/cricket/auctions.json",
  "data/users.json"
];

for (const file of files) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    await fileStore.writeJSON(file, data);
    console.log("Migrated:", file);
  } catch (err) {
    console.log("Skipped:", file);
  }
}

process.exit();
