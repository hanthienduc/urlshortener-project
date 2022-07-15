require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("database connected.");
  })
  .catch((err) => console.log(err.message));

const urlShortner = mongoose.model("urlShortner", {
  original_url: { type: String, unique: false },
  short_url: Number,
});

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  const regex = new RegExp(/^(ftp|http|https):\/\/[^ "]+$/);
  const originalUrl = req.body.url;
  if (!regex.test(originalUrl)) {
    return res.json({ error: "invalid url" });
  }
  const shortUrl = Math.ceil(Math.random() * 1000);
  const newData = {
    original_url: originalUrl,
    short_url: shortUrl,
  };

  var query = { original_url: originalUrl },
    update = { short_url: shortUrl },
    options = { upsert: true, new: true, setDefaultsOnInsert: true };

  urlShortner.findOneAndUpdate(
    query,
    update,
    options,
    function (error, result) {
      if (error) return;
      res.json(result);
    }
  );
});

app.get("/api/shorturl/:url", function (req, res) {
  const requestParamsUrl = parseInt(req.params.url);
  urlShortner.findOne({ short_url: requestParamsUrl }, function (err, result) {
    if (err) return res.json({ error: "invalid url" });
    if (!result) return res.json({ error: "invalid url" });
    return res.redirect(result.original_url);
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
