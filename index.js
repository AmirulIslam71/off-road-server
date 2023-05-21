const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kqqmxrw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const toysCollection = client.db("offRoadExplorer").collection("toys");

    // Creating index on two fields
    const indexKeys = { title: 1, "toys.name": 1 };
    const indexOptions = { name: "titleToysName" };

    try {
      const result = await toysCollection.createIndex(indexKeys, indexOptions);
      console.log("Index created successfully:", result);
    } catch (error) {
      console.error("Error creating index:", error);
    }

    app.get("/toySearch/:text", async (req, res) => {
      const searchText = req.params.text;
      try {
        const result = await toysCollection
          .find({
            $or: [
              { title: { $regex: searchText, $options: "i" } },
              { "toys.name": { $regex: searchText, $options: "i" } },
            ],
          })
          .toArray();
        console.log(result);
        res.json(result);
      } catch (error) {
        console.error("Error executing search query:", error);
        res.status(500).json({ error: "An error occurred during search." });
      }
    });

    // toys
    //     app.get("/toys", async (req, res) => {
    //   const { search } = req.query;
    //   const searchQuery = search ? { name: { $regex: search, $options: "i" } } : {};
    //   const cursor = toysCollection.find(searchQuery).limit(20).sort({ "price": 1 });
    //   const result = await cursor.toArray();
    //   res.json(result);
    // });

    app.get("/toys", async (req, res) => {
      const cursor = toysCollection.find().limit(3);
      const result = await cursor.toArray();
      res.json(result);
    });

    app.get("/allToys", async (req, res) => {
      const cursor = toysCollection.find();
      const result = await cursor.toArray();
      res.json(result);
    });

    app.get("/myToys/:email", async (req, res) => {
      const result = await toysCollection
        .find({ sellerEmail: req.params.email })
        .toArray();
      res.json(result);
    });

    app.post("/toys", async (req, res) => {
      const newToy = req.body;
      const result = await toysCollection.insertOne(newToy);
      res.json(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Off road server in running");
});

app.listen(port, () => {
  console.log(`Off road server is running port : ${port}`);
});
