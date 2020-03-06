const { admin, db } = require("../util/admin");
const config = require("../util/config");
const firebase = require("firebase");

// Validators
const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails
} = require("../util/validators");

// Initialization
firebase.initializeApp(config);

/*
Controllers
*/

// "Create" controller

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userHandle: req.body.userHandle
  };
  let token, userId;

  // Validation of input
  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

  const noImg = "blank-avatar-transparent.png";

  // Creating user document
  db.doc(`/users/${newUser.userHandle}`)
    .get()
    // Validate if user exists in DB
    // If it's not there, add an user to AUTH app of firebase
    .then(doc => {
      if (doc.exists) {
        throw new Error("This handle is already taken.");
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    // Add user to DB too (expanded data) that connects it to AUTH app of firebase
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        userHandle: newUser.userHandle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId
      };
      return db.doc(`/users/${newUser.userHandle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({
          email: "The email address is already in use by another account."
        });
      } else if (err.message === "This handle is already taken.") {
        return res
          .status(400)
          .json({ userHandle: "Error: This handle is already taken." });
      } else {
        return res
          .status(500)
          .json({ general: "Something went wrong, please try again" });
      }
    });
};

// Login controller

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  // Validation of input
  const { valid, errors } = validateLoginData(user);
  if (!valid) return res.status(400).json(errors);

  // Auth
  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      return res.status(403).json({
        general: "Wrong credentials. Please try again."
      });
    });
};

// Get any user's details

exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.params.userHandle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.user = doc.data();
        return db
          .collection("stories")
          .where("userHandle", "==", req.params.userHandle)
          .orderBy("createdAt", "desc")
          .get();
      } else {
        return res.status(400).json({ error: "User not found." });
      }
    })
    .then(data => {
      userData.stories = [];
      data.forEach(doc => {
        userData.stories.push({
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          userImage: doc.data().userImage,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          storyId: doc.id
        });
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Get own user details controller

exports.getAuthenticatedUser = (req, res) => {
  let userData = {};

  db.doc(`/users/${req.user.userHandle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.credentials = doc.data();

        return db
          .collection("likes")
          .where("userHandle", "==", req.user.userHandle)
          .get();
      }
    })
    .then(data => {
      userData.likes = [];

      data.forEach(doc => {
        userData.likes.push(doc.data());
      });

      return db
        .collection("notifications")
        .where("recipient", "==", req.user.userHandle)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
    })
    .then(data => {
      userData.notifications = [];
      data.forEach(doc => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          storyId: doc.data().storyId,
          type: doc.data().type,
          read: doc.data().read,
          notificationId: doc.id
        });
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Add user details controller

exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.userHandle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details added successfully." });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// Image Upload controller

exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });
  let imageFileName;
  let imageToBeUploaded;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      errorMessage =
        "Wrong image type submitted. Please upload an image in .jpeg or .png format.";
      console.error(`Error: ${errorMessage}`);
      return res.status(400).json({ error: errorMessage });
    }
    const imageExtension = filename.split(".").pop();
    imageFileName = `${Math.round(
      Math.random() * 10000000000
    )}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket(config.storageBucket)
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.userHandle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "Image uploaded successfully." });
      })
      .catch(err => {
        console.error(err);
        if (err.message === "Wrong image type submitted.") {
          console.error(
            "Wrong image type submitted. Please upload an image in .jpeg or .png format."
          );
          return res.status(400).json({
            error:
              "Wrong image type submitted. Please upload an image in .jpeg or .png format."
          });
        } else {
          return res.status(500).json({ error: err.code });
        }
      });
  });
  busboy.end(req.rawBody);
};

// When user opens notifications UI, I want to mark those notification
// that the user has seen as "read" on the server.
// Using Firebase batch write
exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();

  // Request's body is an JSON array
  req.body.forEach(notificationId => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: "Notifications marked read." });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
