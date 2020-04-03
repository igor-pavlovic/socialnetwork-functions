const { db } = require("../util/admin");

// Validators
const { validateStoryData } = require("../util/validators");

/*
Controllers
*/

// "List" controller

exports.getAllStories = (req, res) => {
  db.collection("stories")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let stories = [];
      data.forEach(doc => {
        stories.push({
          ...doc.data(),
          storyId: doc.id
        });
      });
      return res.json(stories);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Get one story controller

exports.getStory = (req, res) => {
  let storyData = {};

  db.doc(`/stories/${req.params.storyId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Story not found." });
      }
      storyData = doc.data();
      storyData.storyId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("storyId", "==", req.params.storyId)
        .get();
    })
    .then(data => {
      storyData.comments = [];
      data.forEach(doc => {
        storyData.comments.push(doc.data());
      });
      return res.json(storyData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// "Create" controller

exports.postStory = (req, res) => {
  const newStory = {
    body: req.body.body,
    userHandle: req.user.userHandle,
    userImage: req.user.imageUrl,
    likeCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString()
  };

  // Validation
  const { valid, errors } = validateStoryData(newStory);
  if (!valid) return res.status(400).json(errors);

  // Adding to DB
  db.collection("stories")
    .add(newStory)
    .then(doc => {
      const returnedStory = newStory;
      returnedStory.storyId = doc.id;

      return res.json(returnedStory);
    })
    .catch(err => {
      console.error(err);
      res
        .status(500)
        .json({ error: `Something went wrong while saving new story.` });
    });
};

// Delete story controller

exports.deleteStory = (req, res) => {
  const document = db.doc(`/stories/${req.params.storyId}`);

  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        throw new Error("Story not found.");
      }
      if (doc.data().userHandle !== req.user.userHandle) {
        throw new Error("Unauthorized action.");
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: "Story deleted successfully." });
    })
    .catch(err => {
      console.error(err);
      if (err.message === "Story not found.") {
        return res.status(404).json({ error: "Story not found." });
      } else if (err.message === "Unauthorized action.") {
        return res.status(403).json({ error: "Unauthorized action." });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

// Add comment on a story

exports.postComment = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ comment: "Must not be empty." });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    storyId: req.params.storyId,
    userHandle: req.user.userHandle,
    userImage: req.user.imageUrl
  };

  db.doc(`/stories/${req.params.storyId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Story not found." });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      return res.json(newComment);
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};

// Like a story

exports.likeStory = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.userHandle)
    .where("storyId", "==", req.params.storyId)
    .limit(1);
  const storyDocument = db.doc(`/stories/${req.params.storyId}`);

  let storyData = {};

  storyDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        storyData = doc.data();
        storyData.storyId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Story not found." });
      }
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            storyId: req.params.storyId,
            userHandle: req.user.userHandle,
            createdAt: new Date().toISOString()
          })
          .then(() => {
            storyData.likeCount++;
            return storyDocument.update({ likeCount: storyData.likeCount });
          })
          .then(() => {
            return res.json(storyData);
          });
      } else {
        return res.status(400).json({ error: "Story already liked." });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Unlike a story

exports.unlikeStory = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", req.user.userHandle)
    .where("storyId", "==", req.params.storyId)
    .limit(1);
  const storyDocument = db.doc(`/stories/${req.params.storyId}`);

  let storyData = {};

  storyDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        storyData = doc.data();
        storyData.storyId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Story not found." });
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ error: "Story not liked." });
      } else {
        return db
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            storyData.likeCount--;
            return storyDocument.update({ likeCount: storyData.likeCount });
          })
          .then(() => {
            res.json(storyData);
          });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
