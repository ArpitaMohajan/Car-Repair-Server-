const express = require('express')
const app = express();
const cors = require('cors')
require('dotenv').config()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const fileUpload = require("express-fileupload");






const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())
app.use(fileUpload())
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kvbsf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();
        const database = client.db("repair_mech");

        const servicesCollection = database.collection('services');
        const productsCollection = database.collection('products');
        const orderCollection = database.collection('orders')
        const usersCollection = database.collection('users')
        const reviewCollection = database.collection('review')
        // console.log('Connected to Database')


        // get
        // app.get('/services', async (req, res) => {
        //     const cursor = servicesCollection.find({})
        //     const services = await cursor.toArray()
        //     res.send(services)
        // })

        // get
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.json(products)
        })
        // post product 
        // app.post('/products', async (req, res) => {
        //     const product = req.body
        //     // console.log('hit the post', product)
        //     const result = await productsCollection.insertOne(product)
        //     // console.log(result)
        //     res.json(result)
        // })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const product = await productsCollection.findOne(query)
            res.json(product)
        });


        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const service = await servicesCollection.findOne(query)
            res.json(service)
        })
        // post
        // app.post('/services', async (req, res) => {
        //     const service = req.body
        //     console.log('hit', service)
        //     const result = await servicesCollection.insertOne(service);
        //     console.log(result);
        //     res.json(result)
        // })




        app.get("/services", async (req, res) => {
            console.log('jj')
            const cursor = servicesCollection.find({});
            const result = await cursor.toArray();

            res.json(result);
        })



        app.post('/services', async (req, res) => {
            console.log("hit the post")
            const name = req.body.name;
            const pic = req.files.img;
            const price = req.body.price;
            const desc = req.body.desc;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            // const imageBuffer = Buffer.from(encodedPic, 'base64');
            const service = {
                name,
                pic,
                price,
                desc,
                image: imageBuffer
            }
            console.log(service)
            const result = await servicesCollection.insertOne(service);
            // console.log(result)
            res.json(result)
        })
        app.delete('/dltProducts/:orderId', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query)
            console.log(result)
            res.json(result)
        });
        // orders
        app.get('/orders', async (req, res) => {
            const email = req.query.email
            let query = {}
            if (email) {
                query = { email: email }
            }
            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray()
            res.send(orders)
        })
        app.post('/orders', async (req, res) => {
            const order = req.body
            // console.log('jkjk', order)
            order.createdAt = new Date()
            const result = await orderCollection.insertOne(order)
            console.log(result)
            res.json(result)
        })
        app.delete('/dltOrders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            console.log(result)
            res.json(result)
        })
        // users
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin })
        })





        app.post('/users', async (req, res) => {
            const user = req.body;
            user.role = "user";
            const result = await usersCollection.insertOne(user)
            console.log(result)
            res.json(result)
        })
        app.put('/users', async (req, res) => {
            const user = req.body.user;

            const filter = { email: user.email }
            const options = { upsert: true }
            const updateDoc = { $set: user }

            const result = await usersCollection.updateOne(filter, updateDoc, options);
            console.log(result)
            res.json(result)

        })

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            console.log('put', user.email)
            const filter = { email: user.email }
            const updateDoc = { $set: { role: 'admin' } }
            const result = await usersCollection.updateOne(filter, updateDoc)
            console.log(result)
            res.json(result)
        })

        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        })

        app.get('/review', async (req, res) => {
            const cursor = reviewCollection.find({})
            const reviews = await cursor.toArray()
            res.send(reviews)
        })
        app.post('/review', async (req, res) => {
            const review = req.body
            console.log('hit the post', review)
            const result = await reviewCollection.insertOne(review)
            console.log(result)
            res.json(result)
        })

        // manage Order
        app.get("/allOrders", async (req, res) => {
            // console.log("hello");
            const result = await orderCollection.find({}).toArray();
            res.send(result);
        });
        app.delete('/dltOrders/:orderId', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            console.log(result)
            res.json(result)
        })

        // status update
        app.put("/statusUpdate/:id", async (req, res) => {
            const filter = { _id: ObjectId(req.params.id) };
            console.log(req.params.id);
            const result = await orderCollection.updateOne(filter, {
                $set: {
                    status: req.body.status,
                },
            });
            res.send(result);
            console.log(result);

        });




    } finally {
        // await client.close();
    }
}
run().catch(console.dir);




























































app.get('/', (req, res) => {
    res.send('Hello Repire Man')
})
app.listen(port, () => {
    console.log('Listening to port', port)
})