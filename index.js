const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    app.post("/toys", async (req, res) => {
      const newToy = req.body;
      const result = await toysCollection.insertOne(newToy);
      res.json(result);
    });

    app.get("/toys", async (req, res) => {
      const cursor = toysCollection.find().limit(3);
      const result = await cursor.toArray();
      res.json(result);
    });

    app.get("/allToys", async (req, res) => {
      const cursor = toysCollection.find();
      const result = await cursor.toArray();

      // Extract the first 20 toys from the result
      const limitedResult = result.map((category) => ({
        ...category,
        toys: category.toys.slice(0, 20),
      }));

      res.json(limitedResult);
    });

    app.get("/allToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.json(result);
    });

    app.get("/allToys/:email", async (req, res) => {
      const result = await toysCollection
        .find({ sellerEmail: req.params.email })
        .toArray();
      res.json(result);
    });

    app.put("/allToys/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedToy = req.body;
      const toys = {
        $set: {
          title: updatedToy.title,
          "toys.0.name": updatedToy.toys[0].name,
          "toys.0.price": updatedToy.toys[0].price,
          "toys.0.quantity": updatedToy.toys[0].quantity,
          "toys.0.details": updatedToy.toys[0].details,
        },
      };
      const result = await toysCollection.updateOne(filter, toys, options);
      res.json(result);
    });

    app.delete("/allToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
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
