import { promises as fs } from "fs";
import path from "path";
import { firestoreStore } from "./firestoreStore.js";

const USE_FIREBASE = process.env.USE_FIREBASE === "true";
console.log("USE_FIREBASE =", process.env.USE_FIREBASE);

const jsonFileStore = {
  async readJSON(filePath) {
    try {
      const absolutePath = path.join(process.cwd(), filePath);
      const data = await fs.readFile(absolutePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  },

  async writeJSON(filePath, data) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dirPath = path.dirname(absolutePath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(
      absolutePath,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
    return { success: true };
  }
};

export const fileStore = USE_FIREBASE
  ? firestoreStore
  : jsonFileStore;
