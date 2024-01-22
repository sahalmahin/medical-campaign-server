const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://medicalCamp:HpnP5tcUU3fKdRuA@cluster0.dygd3dy.mongodb.net/?retryWrites=true&w=majority`;

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
    const paymentCollection = client.db("medicalDb").collection("payment");
    const reviewCollection = client.db("medicalDb").collection("reviews");

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




    // camps related api
    app.get('/camps', async (req, res) => {
      const filter = req.query;
      console.log(filter);
      let query = {};
      if (req.query.search) {
        query = { CampName: { $regex: filter.search, $options: 'i' } }
      }
      const result = await campCollection.find(query).toArray();
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

    app.put('/add-a-camp/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedCamp = req.body;
      const camp = {
        $set: {
          camp: updatedCamp.camp,
          fees: updatedCamp.fees,
          venue: updatedCamp.venue,
          service: updatedCamp.service,
          health: updatedCamp.health,
          audience: updatedCamp.audience,
          photo: updatedCamp.photo,
          description: updatedCamp.description,
        }
      }
      const result = await addCampCollection.updateOne(filter, camp, options);
      res.send(result);
    })

    app.delete('/add-a-camp/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await addCampCollection.deleteOne(query);
      res.send(result);
    });

    // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount, 'amount inside the intent')

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });

    app.get('/payments/:email', async (req, res) => {
      const query = { email: req.params.email }
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);

      //  carefully delete each item from the camp
      console.log('payment info', payment);
      const query = {
        _id: {
          $in: payment.campIds.map(id => new ObjectId(id))
        }
      };

      const deleteResult = await campCollection.deleteMany(query);

      res.send({ paymentResult, deleteResult });
    })

    // reviews
    app.get('/reviews', async (req, res) => {
      const query = req.query;
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    })


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
  console.log(`Camp is running on port ${port}`);
})