const express = require('express')
const cors =require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5001;

// midle ware 
app.use(cors());
app.use(express.json())



const uri = "mongodb+srv://coffee-master:yrsim4pQkblWGNb0@cluster0.8dssgfd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

console.log(uri)

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
    await client.connect();
    const coffeeCollection = client.db("coffeeDB").collection("coffee");
    const sortCollection = client.db("coffeeDB").collection("sort");
    const roomsCollection = client.db("coffeeDb2").collection("rooms");
    const usersCollection = client.db("coffeeDb2").collection("users");
    


// save user 
app.put('/user', async (req, res) => {
  const user = req.body

  const query = { email: user?.email }
  // check if user already exists in db
  const isExist = await usersCollection.findOne(query)
  if (isExist) {
    if (user.status === 'Requested') {
      // if existing user try to change his role
      const result = await usersCollection.updateOne(query, {
        $set: { status: user?.status },
      })
      return res.send(result)
    } else {
      // if existing user login again
      return res.send(isExist)
    }
  }

  // save user for the first time
  const options = { upsert: true }
  const updateDoc = {
    $set: {
      ...user,
      timestamp: Date.now(),
    },
  }
  const result = await usersCollection.updateOne(query, updateDoc, options)
  res.send(result)
})



  // get admin role 
  app.get('/users/admin/:email', async (req, res) => {
    const email = req.params.email;
    console.log(email);

    try {
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        
        let admin = false;
        if (user) {
            admin = user.role === 'admin';
        }
        
        res.send({ admin });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send({ error: 'An error occurred while fetching the user' });
    }
});



    app.get('/coffee', async(req,res)=>{
      const cursor = coffeeCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })



   app.get('/rooms', async (req,res)=>{
    const category = req.query.category
    console.log(category)
    let query = {category}
    // if (category && category !== 'null') query = { category }
    const result = await roomsCollection.find(query).toArray()
    res.send(result)
   })

  //  sort and filter 

  app.get('/RoomsPage', async(req,res)=>{

    const filter = req.query.filter
    console.log(filter)
    const sort = req.query.sort
    const search = req.query.search
    const size =parseInt(req.query.size)
    const page = parseInt(req.query.page)-1
    console.log(size,page)

    let query = {
      category : {$regex : search ,}

    };
    if (filter) {
        query = {...query, category: filter };
    }
    let option = {}
    if(sort){
      option = {sort : {price :  sort === 'asc'? 1 : -1 }}
    }
    const result = await sortCollection.find(query,option).skip(page*size ).limit(size).toArray()
    res.send(result)
  })


  app.get('/coffeepage', async(req,res)=>{
    const count = await sortCollection.countDocuments();
    res.send({count})
  })

  app.get('/users', async(req,res)=>{
    const user = req.body
    const result = await usersCollection.find().toArray()
    res.send(result)
  })


   
   
  

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('coffee server is being running now ')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})