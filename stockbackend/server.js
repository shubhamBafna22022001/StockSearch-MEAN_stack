const express = require('express');
const cors = require('cors'); // Import cors package
const app = express();
const port = 3000;
const uri = "mongodb+srv://shubhamd:Shubham16.@clustershubham.hn1eqmb.mongodb.net/?retryWrites=true&w=majority&appName=Clustershubham";
const { MongoClient } = require('mongodb');

// Create a new MongoClient
const client = new MongoClient(uri);


async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        // Additional MongoDB operations
    } catch (e) {
        console.error(e);
    }
}
run().catch(console.dir);

app.use(cors());
app.use(express.json());

// Endpoint to add to watchlist
app.post('/api/watchlist', async (req, res) => {
    try {
        const collection = client.db("stock").collection("watchlist");
        await collection.insertOne(req.body);
        res.status(201).send(req.body);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Endpoint to get watchlist
app.get('/api/watchlist', async (req, res) => {
    try {
        const collection = client.db("stock").collection("watchlist");
        const watchlist = await collection.find({}).toArray();
        res.status(200).json(watchlist);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Endpoint to remove from watchlist
app.delete('/api/watchlist/:ticker', async (req, res) => {
    try {
        const collection = client.db("stock").collection("watchlist");
        await collection.deleteOne({ ticker: req.params.ticker });
        res.status(200).send({ ticker: req.params.ticker });
    } catch (error) {
        res.status(500).send(error);
    }
});
// Add this endpoint in your server.js

// Endpoint to buy stock or update existing stock in the portfolio
app.post('/api/portfolio/buy', async (req, res) => {
    try {
        const collection = client.db("stock").collection("portfolio");
        const { ticker, quantity, price } = req.body;
        const existingStock = await collection.findOne({ ticker: ticker });

        if (existingStock) {
            // Update the existing stock entry with new quantity and price
            const newTotalPrice = existingStock.totalPrice + (quantity * price);
            const newQuantity = existingStock.quantity + quantity;
            await collection.updateOne({ ticker: ticker }, { $set: { quantity: newQuantity, totalPrice: newTotalPrice } });
        } else {
            // Insert a new stock entry
            await collection.insertOne({ ticker: ticker, quantity: quantity, totalPrice: quantity * price });
        }
        res.status(200).send("Portfolio updated successfully");
    } catch (error) {
        console.error("Error in /api/portfolio/buy", error);
        res.status(500).send("Error updating portfolio");
    }
});

app.get('/api/portfolio/quantity', async (req, res) => {
    try {
        const ticker = req.query.ticker;
        const collection = client.db("stock").collection("portfolio");
        const stock = await collection.findOne({ ticker: ticker });

        if (stock) {
            res.status(200).json({ quantity: stock.quantity });
        } else {
            res.status(404).send('Stock not found');
        }
    } catch (error) {
        console.error("Error in /api/portfolio/quantity", error);
        res.status(500).send("Error retrieving quantity");
    }
});
app.post('/api/portfolio/sell', async (req, res) => {
    try {
        const { ticker, quantity, sellValue } = req.body;
        const collection = client.db("stock").collection("portfolio");
        const stock = await collection.findOne({ ticker: ticker });

        if (stock && quantity <= stock.quantity) {
            const newQuantity = stock.quantity - quantity;
            if (newQuantity > 0) {
                const newTotalPrice = stock.totalPrice - sellValue;
                await collection.updateOne({ ticker: ticker }, { $set: { quantity: newQuantity, totalPrice: newTotalPrice } });
                res.status(200).json({ message: "Stock sold successfully" });
            } else {
                await collection.deleteOne({ ticker: ticker });
                res.status(200).json({ message: "All shares sold and stock removed from portfolio" });
            }
        } else {
            res.status(400).send('Invalid sell operation');
        }
    } catch (error) {
        console.error("Error in /api/portfolio/sell", error);
        res.status(500).send("Error selling stock");
    }
});

// Enable All CORS Requests for development purpose
app.use(cors());

// Require the search routes
const searchRoutes = require('./routes/search');

app.use(express.json()); // for parsing application/json

// Use the search routes
app.use('/api', searchRoutes);

app.get('/', (req, res) => {
  res.send('Stock Search Backend Running');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
