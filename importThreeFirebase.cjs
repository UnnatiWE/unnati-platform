const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');
const skills = require('./unnati_skill_development.json');
const shgs = require('./maharashtra_women_shg_directory.json');
const helplines = require('./unnati_helplines.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function writeCollection(collectionName, items, idField) {
  let batch = db.batch();
  let count = 0;
  let uploaded = 0;

  for (const item of items) {
    const rawId = idField ? item[idField] : null;
    const id = rawId ? String(rawId) : String(uploaded + count + 1);
    const ref = db.collection(collectionName).doc(id);

    batch.set(ref, {
      ...item,
      importedAt: FieldValue.serverTimestamp()
    });

    count++;
    if (count === 500) {
      await batch.commit();
      uploaded += count;
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    uploaded += count;
  }

  console.log(`✓ ${collectionName}: ${uploaded} documents`);
}

async function main() {
  console.log('Starting UNNATI Firebase import...');
  console.log('');

  await writeCollection('skills', skills, 'skill_name');
  await writeCollection('shgs', shgs, 'id');
  await writeCollection('helplines', helplines, null);

  console.log('');
  console.log('======================================');
  console.log('IMPORT COMPLETED SUCCESSFULLY');
  console.log('======================================');
  console.log(`Skills: ${skills.length}`);
  console.log(`SHGs: ${shgs.length}`);
  console.log(`Helplines: ${helplines.length}`);
  console.log('Collections: skills, shgs, helplines');
}

main().catch((error) => {
  console.error('IMPORT FAILED');
  console.error(error);
  process.exit(1);
});
