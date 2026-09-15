const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");
const schemesData = require("./unnati_firebase_schemes.json");

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

// Connect to Firestore
const db = getFirestore();

async function importSchemes() {
  try {
    console.log("Starting Firebase import...");

    const schemes = schemesData.documents;
    const entries = Object.entries(schemes);

    console.log(`Found ${entries.length} schemes.`);

    let batch = db.batch();
    let count = 0;
    let uploaded = 0;

    for (const [id, scheme] of entries) {

      const docRef = db
        .collection("schemes")
        .doc(id);

      batch.set(docRef, {
        ...scheme,
        created_at: FieldValue.serverTimestamp()
      });

      count++;

      // Firestore allows maximum 500 operations per batch
      if (count === 500) {
        await batch.commit();

        uploaded += count;

        console.log(`Uploaded ${uploaded} schemes...`);

        batch = db.batch();
        count = 0;
      }
    }

    // Upload remaining documents
    if (count > 0) {
      await batch.commit();

      uploaded += count;
    }

    console.log("");
    console.log("====================================");
    console.log("IMPORT COMPLETED SUCCESSFULLY");
    console.log("====================================");
    console.log(`Total schemes imported: ${uploaded}`);
    console.log("Firestore collection: schemes");
    console.log("====================================");

  } catch (error) {

    console.error("");
    console.error("IMPORT FAILED");
    console.error("------------------------------------");
    console.error(error);
    console.error("------------------------------------");

    process.exit(1);
  }
}

importSchemes();