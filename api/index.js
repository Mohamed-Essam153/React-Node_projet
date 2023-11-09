const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User.js");
const Place = require("./models/Place.js");
const Booking = require("./models/Booking.js");
const imageDownloader = require("image-downloader");
const cookieParser = require("cookie-parser");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const fs = require("fs");
const mime = require("mime-types");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

require("dotenv").config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "aaafahreere";
const bucket = "dawid-booking-app";

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "uploads")));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// async function uploadToS3(path, originalFilename, mimetype) {
//     const client = new S3Client({
//       region: "us-east-1",
//       credentials: {
//         accessKeyId: process.env.S3_ACCESS_KEY,
//         secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
//       },
//     });
//     const parts = originalFilename.split('.');
//     const ext = parts[parts.length - 1];
//     const newFilename = Date.now() + '.' + ext;
//     await client.send(new PutObjectCommand({
//       Bucket: bucket,
//       Body: fs.readFileSync(path),
//       Key: newFilename,
//       ContentType: mimetype,
//       ACL: 'public-read',
//     }));
//     return `https://${bucket}.s3.amazonaws.com/${newFilename}`;
//   }

mongoose
  .connect(process.env.MONGO_URL)
  .then((conn) => {
    console.log("Connected to mongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to mongoDB");
    process.exit(1);
  });

const storage = multer.memoryStorage();

const upload = multer({ storage });

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign(
        {
          email: userDoc.email,
          id: userDoc._id,
        },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(userDoc);
        }
      );
    } else {
      res.status(422).json("password or email was wrong");
    }
  } else {
    res.json("not found");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post("/api/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

// app.post('/api/upload-by-link', async (req,res) => {
//   const {link} = req.body;
//   const newName = 'photo' + Date.now() + '.jpg';
//   await imageDownloader.image({
//     url: link,
//     dest: '/tmp/' +newName,
//   });
//   const url = await uploadToS3('/tmp/' +newName, newName, mime.lookup('/tmp/' +newName));
//   res.json(url);
// });

// const photosMiddleware = multer({ dest: "/tmp" });

// app.post(
//   "/api/upload",
//   photosMiddleware.array("photos", 100),
//   async (req, res) => {
//     const uploadedFiles = [];
//     for (let i = 0; i < req.files.length; i++) {
//       const { path, originalname, mimetype } = req.files[i];
//       const url = await uploadToS3(path, originalname, mimetype);
//       uploadedFiles.push(url);
//     }
//     res.json(uploadedFiles);
//   }
// );

// Handle single file upload
// app.post(
//   "/api/upload-by-link",
//   upload.single("image"),
//   async (req, res, next) => {
//     const fileName = `places-${uuidv4()}-${Date.now()}.jpeg`;
//     await sharp(req.file.buffer)
//       .resize(500, 500)
//       .toFormat("jpeg")
//       .jpeg({ quality: 95 })
//       .toFile(`uploads/${fileName}`);
//     req.body.image = fileName;
//     res.json({ fileName });
//   }
// );

// Handle array of files upload

// app.post(
//   "/api/upload",
//   upload.any("photos"),
//   async (req, res, next) => {
//     req.body.photos = [];
//     await Promise.all(
//       //if we did't use await, array of images will be empty
//       req.files.map(async (img, index) => {
//         const imageName = `Places-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
//         await sharp(img.buffer)
//           .toFormat("jpeg")
//           .jpeg({ quality: 95 })
//           .toFile(`uploads/${imageName}`);
//         req.body.photos.push(imageName);
//       })
//     );
//     res.json({ url: req.body.photos });
//     next();
//   }
// );

app.post(
  "/api/places",
  upload.any("photos"),
  async (req, res, next) => {
    req.body.photos = [];
    if (req.files) {
      await Promise.all(
        //if we did't use await, array of images will be empty

        req.files.map(async (img, index) => {
          const imageName = `Places-${uuidv4()}-${Date.now()}-${
            index + 1
          }.jpeg`;
          await sharp(img.buffer)
            .toFormat("jpeg")
            .jpeg({ quality: 95 })
            .toFile(`uploads/${imageName}`);
          req.body.photos.push(imageName);
        })
      );
    }
    next();
  },
  (req, res) => {
    //  mongoose.connect(process.env.MONGO_URL);
    const { token } = req.cookies;
    const {
      title,
      address,
      photos,
      description,
      price,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
    } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.create({
        owner: userData.id,
        price,
        title,
        address,
        photos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
      });
      res.json(placeDoc);
    });
  }
);

app.get("/api/user-places", (req, res) => {
  // mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

app.get("/api/places/:id", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { id } = req.params;
  res.json(await Place.findById(id));
});

app.put(
  "/api/places",
  upload.any("photos"),
  async (req, res, next) => {
    req.body.photos = [];
    if (req.files) {
      await Promise.all(
        //if we did't use await, array of images will be empty

        req.files.map(async (img, index) => {
          const imageName = `Places-${uuidv4()}-${Date.now()}-${
            index + 1
          }.jpeg`;
          await sharp(img.buffer)
            .toFormat("jpeg")
            .jpeg({ quality: 95 })
            .toFile(`uploads/${imageName}`);
          req.body.photos.push(imageName);
        })
      );
    }
    next();
  },
  async (req, res) => {
    const { token } = req.cookies;
    const {
      id,
      title,
      address,
      photos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Place.findById(id);
      if (userData.id === placeDoc.owner.toString()) {
        placeDoc.set({
          title,
          address,
          photos,
          description,
          perks,
          extraInfo,
          checkIn,
          checkOut,
          maxGuests,
          price,
        });
        await placeDoc.save();
        res.json("ok");
      }
    });
  }
);

app.get("/api/places", async (req, res) => {
  //   mongoose.connect(process.env.MONGO_URL);
  res.json(await Place.find());
});

app.post("/api/bookings", async (req, res) => {
  const userData = await getUserDataFromReq(req);
  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } =
    req.body;
  Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user: userData.id,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      throw err;
    });
});

app.get("/api/bookings", async (req, res) => {
  const userData = await getUserDataFromReq(req);
  res.json(await Booking.find({ user: userData.id }).populate("place"));
});

app.listen(4000, () => {
  console.log("server started on port 3000");
});
