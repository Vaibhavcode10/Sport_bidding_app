import { db } from "./firebase.js";

function getCollectionName(filePath) {
  return filePath
    .replace("data/", "")
    .replace(".json", "")
    .replace(/\//g, "_");
}

export const firestoreStore = {
async readJSON(filePath) {
  try {
    const collection = getCollectionName(filePath);

    // Special case: users.json
    if (filePath === "data/users.json") {
      const doc = await db.collection(collection).doc("root").get();
      return doc.exists ? doc.data() : {
        admins: [],
        players: {},
        auctioneers: {}
      };
    }

    const snapshot = await db.collection(collection).get();

    if (!snapshot || snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error("Firestore read error:", err);
    return [];
  }
},


async writeJSON(filePath, data) {
  try {
    const collection = getCollectionName(filePath);

    // Special case: users.json
    if (filePath === "data/users.json") {
      await db.collection(collection).doc("root").set(data);
      return { success: true };
    }

    const batch = db.batch();
    const snapshot = await db.collection(collection).get();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    for (const item of data || []) {
      const ref = db.collection(collection).doc(item.id || undefined);
      batch.set(ref, item);
    }

    await batch.commit();

    return { success: true };
  } catch (err) {
    console.error("Firestore write error:", err);
    return { success: false };
  }
}

};
