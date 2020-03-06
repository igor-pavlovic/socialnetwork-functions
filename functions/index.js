const firebase = require("firebase");
const functions = require("firebase-functions");
const app = require("express")();
const { db } = require("./util/admin");

// Middleware
const FBAuth = require("./util/FBAuth");

// Controllers
const {
  getAllStories,
  getStory,
  postStory,
  deleteStory,
  postComment,
  likeStory,
  unlikeStory
} = require("./handlers/stories");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require("./handlers/users");

/* 
Story routes
*/
app.get("/stories", getAllStories);
app.get("/story/:storyId", getStory);
app.post("/story", FBAuth, postStory);
app.delete("/story/:storyId", FBAuth, deleteStory);
app.post("/story/:storyId/comment", FBAuth, postComment);
app.get("/story/:storyId/like", FBAuth, likeStory);
app.get("/story/:storyId/unlike", FBAuth, unlikeStory);

/*
User routes
*/
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:userHandle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

/*
Export API
*/
exports.api = functions.region("europe-west1").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/story/${snapshot.data().storyId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            storyId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
      });
  });

exports.deleteNotificationOnUnlike = functions
  .region("europe-west1")
  .firestore.document("comments/{id}")
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("europe-west1")
  .firestore.document("comments/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/story/${snapshot.data().storyId}`)
      .get()
      .then(doc => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            storyId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("europe-west1")
  .firestore.document("/users/{userId}")
  .onUpdate(change => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("Image has changed.");
      const batch = db.batch();
      return db
        .collection("stories")
        .where("userHandle", "==", change.before.data().userHandle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const story = db.doc(`/stories/${doc.id}`);
            batch.update(story, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onStoryDelete = functions
  .region("europe-west1")
  .firestore.document("/stories/{storyId}")
  .onDelete((snapshot, context) => {
    const storyId = context.params.storyId;
    const batch = db.batch();

    return db
      .collection("comments")
      .where("storyId", "==", storyId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection("likes")
          .where("storyId", "==", storyId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("storyId", "==", storyId)
          .get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => console.error(err));
  });

  