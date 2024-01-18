const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_Pass}@cluster0.dygd3dy.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const campCollection = client.db("medicalDb").collection("camps");
    const addCollection = client.db("medicalDb").collection("addCamp");
    const addCampCollection = client.db("medicalDb").collection("add-a-camp");

    // users related api
    app.get('/camps', async (req, res) => {
      const result = await campCollection.find().toArray();
      res.send(result);
    })

    app.get('/camps/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await campCollection.findOne(query);
      res.send(result);
    })

    // addCamp
    app.get('/addCamp', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await addCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/addCamp', async (req, res) => {
      const addCamp = req.body;
      const result = await addCollection.insertOne(addCamp);
      res.send(result);
    })

    // add a camp
    app.post('/add-a-camp', async (req, res) => {
      const camp = req.body;
      const result = await addCampCollection.insertOne(camp);
      res.send(result);
    })

    app.get('/add-a-camp', async (req, res) => {
      const result = await addCampCollection.find().toArray();
      res.send(result);
    })

    app.get('/add-a-camp/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await addCampCollection.findOne(query);
      res.send(result);
    })

    // app.patch('/menu/:id', async (req, res) => {
    //   const item = req.body;
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) }
    //   const updatedDoc = {
    //     $set: {
    //       name: item.name,
    //       category: item.category,
    //       price: item.price,
    //       recipe: item.recipe,
    //       image: item.image
    //     }
    //   }

    //   const result = await menuCollection.updateOne(filter, updatedDoc)
    //   res.send(result);
    // })

    app.delete('/add-a-camp/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await addCampCollection.deleteOne(query);
      res.send(result);
    });



    // jwt related api
    // app.post('/jwt', async (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    //   res.send({ token });
    // })
    // middlewares 
    // const verifyToken = (req, res, next) => {
    //   // console.log('inside verify token', req.headers.authorization);
    //   if (!req.headers.authorization) {
    //     return res.status(401).send({ message: 'unauthorized access' });
    //   }
    //   const token = req.headers.authorization.split(' ')[1];
    //   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    //     if (err) {
    //       return res.status(401).send({ message: 'unauthorized access' })
    //     }
    //     req.decoded = decoded;
    //     next();
    //   })
    // }
    // // use verify admin after verifyToken
    // const verifyAdmin = async (req, res, next) => {
    //   const email = req.decoded.email;
    //   const query = { email: email };
    //   const user = await userCollection.findOne(query);
    //   const isAdmin = user?.role === 'admin';
    //   if (!isAdmin) {
    //     return res.status(403).send({ message: 'forbidden access' });
    //   }
    //   next();
    // }



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('camp is running');
})

app.listen(port, () => {
  console.log(`Bistro boss is sitting on port ${port}`);
})