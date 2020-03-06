const admin = require("firebase-admin");

const adminConfig = {
  credential: admin.credential.cert(require("./FBAdmin_key"))
};

admin.initializeApp(adminConfig);
const db = admin.firestore();

module.exports = { admin, db };
