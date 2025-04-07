// Import required packages
const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const path = require("path");

// Initialize the app
const app = express();
const port = 3000;

// MongoDB connection URI
const uri = "mongodb://127.0.0.1:27017";

// Connect to MongoDB
let db;
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db("voting_db"); // Access your database
    console.log("Connected to MongoDB");
  })
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Set EJS as the view engine
app.set("view engine", "ejs");

// Serve static files like CSS and JS
app.use(express.static(path.join(__dirname, "public")));

// Route to display the matches data
app.get("/", (req, res) => {
  const collection = db.collection("matches");
  collection.find().toArray((err, matches) => {
    if (err) {
      res.status(500).send("Error fetching matches data");
    } else {
      // Render the data in the "index.ejs" file
      res.render("index", { matches: matches });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
