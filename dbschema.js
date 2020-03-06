let db = {
  users: [
    {
      userId: "ahsjdk12h3hjsahj321as",
      email: "user@email.com",
      userHandle: "Username",
      createdAt: "2019-03-1T10:59:52.789Z",
      imageUrl: "image/31231273127318932.jpg",
      bio: "Hello! I am super nice person and I study CompSci!",
      website: "https://username.com",
      location: "Paris, France"
    }
  ],
  stories: [
    {
      userHandle: "Username",
      body: "Main content of the story",
      createdAt: new Date().toString(),
      likeCount: 0,
      commentCount: 0
    }
  ],
  comments: [
    {
      userHandle: "Username",
      storyId: "has12h34ksajh532h324kas",
      body: "Nice one mate!",
      createdAt: "2019-03-1T10:59:52.789Z"
    }
  ],
  notifications: [
    {
      recipient: "user",
      sender: "michael23",
      read: true | false,
      storyId: "213jhfh12j312k123",
      type: "like" | "comment",
      createdAt: "2019-03-1T10:59:52.789Z"
    }
  ]
};

// Redux data
const userDetails = {
  credentials: {
    userId: "ahsjdk12h3hjsahj321as",
    email: "user@email.com",
    userHandle: "Username",
    createdAt: "2019-03-1T10:59:52.789Z",
    imageUrl: "image/31231273127318932.jpg",
    bio: "Hello! I am super nice person and I study CompSci!",
    website: "https://username.com",
    location: "Paris, France"
  },
  likes: [
    {
      userHandle: "user",
      storyId: "hah23h13hahh12higk"
    },
    {
      userHandle: "user",
      storyId: "h12hshdh2hhdhsahd2"
    }
  ]
};
