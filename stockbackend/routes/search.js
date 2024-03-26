const express = require('express');
const axios = require('axios');
const router = express.Router();

const FINNHUB_API_BASE = 'https://finnhub.io/api/v1';
const POLYGON_API_BASE = 'https://api.polygon.io/v2/aggs';
const INSIDER_SENTIMENT_API = 'https://finnhub.io/api/v1/stock/insider-sentiment';

// Replace '<Your_API_Key>' with your actual Finnhub API key
const API_KEY = 'cnd8d7pr01qr85dtklc0cnd8d7pr01qr85dtklcg';
const YOUR_POLYGON_API_KEY= '8eNBWd5NQDNsPMt5eOKV0g66C_plgOd6';
router.get('/companyProfile', async (req, res) => {
    try {
        const { ticker } = req.query;
        const url = `${FINNHUB_API_BASE}/stock/profile2?symbol=${ticker}&token=${API_KEY}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching company profile', error });
    }
});
router.get('/checkTickerExists', async (req, res) => {
    try {
        const { ticker } = req.query;
        const url = `${FINNHUB_API_BASE}/stock/profile2?symbol=${ticker}&token=${API_KEY}`;
        const response = await axios.get(url);
        const exists = response.data?.name ? true : false; // Check if response contains data
        res.json(exists);
    } catch (error) {
        console.error("Error checking ticker existence:", error);
        res.status(500).json({ message: 'Error checking ticker existence', error });
    }
});

router.get('/companyPeers', async (req, res) => {
    try {

        const { ticker } = req.query; // Use 'ticker' instead of 'symbol'
        const url = `${FINNHUB_API_BASE}/stock/peers?symbol=${ticker}&token=${API_KEY}`;
        const response = await axios.get(url);
        console.log("URL: ", url);

        console.log("Finnhub Response:", response.data); // Log the full response
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching from Finnhub:", error);
        res.status(500).json({ message: 'Error fetching company peers', error });
    }
});

router.get('/quote', async (req, res) => {
    console.log('Request received for latest price');
    const symbol = req.query.symbol; // Corrected from ticker to symbol

    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;

    try {
        const response = await axios.get(url);
        const { c, d, dp, h, l, o, pc, t } = response.data;
        const localTimestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

      // Assuming you're using JavaScript's Date object and these times are in PST
    const marketOpenTime = new Date();
    marketOpenTime.setHours(6, 30, 0); // Market opens at 6:30 AM PST

    const marketCloseTime = new Date();
    marketCloseTime.setHours(13, 0, 0); // Market closes at 1:00 PM PST

    const currentTime = new Date();

// Convert current time to PST if your server is in a different timezone
// This can be done using libraries like moment-timezone if needed

const marketOpen = currentTime >= marketOpenTime && currentTime <= marketCloseTime;
console.log(marketOpen)
        res.json({
            currentPrice: c,
            change: d,
            changePercent: dp,
            high: h,
            low: l,
            open: o,
            previousClose: pc,
            timestamp: localTimestamp,
            marketOpen
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching stock quote');
    }
});
function getLastOpenDay(date) {
    // Assuming the market is closed on weekends
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek === 0) { // Sunday
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2); // Last open day was Friday
    } else if (dayOfWeek === 1) { // Monday
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 3); // Last open day was Friday
    } else {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1); // Previous day
    }
}

router.get('/historical-data', async (req, res) => {
    try {
        const { ticker } = req.query;
        const currentDate = new Date();

        // Get data starting from the last open day
        const toDate = getLastOpenDay(currentDate);
        
        // Set toDate to be one day after fromDate
        const fromDate = new Date(toDate.getTime() - (24 * 60 * 60 * 1000));

        const formattedFromDate = fromDate.toISOString().split('T')[0];
        const formattedToDate = toDate.toISOString().split('T')[0];
        console.log('From Date:', formattedFromDate);
        console.log('To Date:', formattedToDate);

        const url = `${POLYGON_API_BASE}/ticker/${ticker}/range/1/hour/${formattedFromDate}/${formattedToDate}?adjusted=true&sort=asc&apiKey=${YOUR_POLYGON_API_KEY}`;

        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching historical data', error });
    }
});

// Add this to your existing routes in Node.js

router.get('/companyNews', async (req, res) => {
    const { ticker } = req.query;
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    const formattedFromDate = fromDate.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${formattedFromDate}&to=${toDate}&token=${API_KEY}`;

    try {
        const response = await axios.get(url);
        // Filter news items with valid images and titles
        const filteredNews = response.data.filter(item => item.image && item.headline);
        // Limit the response to 20 news items
        const limitedResponse = filteredNews.slice(0, 20);
        res.json(limitedResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching company news', error });
    }
});


router.get('/aapl-ohlcv', async (req, res) => {
    try {
        const apiUrl = 'https://demo-live-data.highcharts.com/aapl-ohlcv.json';
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching AAPL OHLCV data:', error);
        res.status(500).json({ message: 'Error fetching AAPL OHLCV data', error });
    }
});


router.get('/insider-sentiment', async (req, res) => {
    const { symbol, from } = req.query; // Removed 'to' as per requirement

    try {
        const url = `${FINNHUB_API_BASE}/stock/insider-sentiment?symbol=${symbol}&from=${from}&token=${API_KEY}`;
        const response = await axios.get(url);

        let totalMspr = 0, positiveMspr = 0, negativeMspr = 0;
        let totalChange = 0, positiveChange = 0, negativeChange = 0;

        response.data.data.forEach(item => {
            totalMspr += item.mspr;
            totalChange += item.change;

            if (item.mspr > 0) positiveMspr += item.mspr;
            if (item.mspr < 0) negativeMspr += item.mspr;
            if (item.change > 0) positiveChange += item.change;
            if (item.change < 0) negativeChange += item.change;
        });

        res.json({ totalMspr, positiveMspr, negativeMspr, totalChange, positiveChange, negativeChange });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error fetching insider sentiment data');
    }
});

router.get('/recommendationTrends', async (req, res) => {
    try {
        const { ticker } = req.query;
        const url = `${FINNHUB_API_BASE}/stock/recommendation?symbol=${ticker}&token=${API_KEY}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recommendation trends', error });
    }
});


router.get('/companyEarnings', async (req, res) => {
    try {
        const { symbol } = req.query;
        const url = `${FINNHUB_API_BASE}/stock/earnings?symbol=${symbol}&token=${API_KEY}`;
        const response = await axios.get(url);
        
        // Replace null values with 0
        response.data.forEach(item => {
            Object.keys(item).forEach(key => {
                if (item[key] === null) {
                    item[key] = 0;
                }
            });
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching company earnings', error });
    }
});


// router.get('/six-month-historical-data', async (req, res) => {
//     try {
//         const { ticker } = req.query;
//         const currentDate = new Date();

//         // Get data starting from 6 months and 1 day ago
//         const fromDate = new Date(currentDate.setMonth(currentDate.getMonth() - 6));
//         fromDate.setDate(fromDate.getDate() - 1);

//         const toDate = new Date(); // Today's date

//         const formattedFromDate = fromDate.toISOString().split('T')[0];
//         const formattedToDate = toDate.toISOString().split('T')[0];

//         const url = `${POLYGON_API_BASE}/ticker/${ticker}/range/1/day/${formattedFromDate}/${formattedToDate}?adjusted=true&sort=asc&apiKey=${YOUR_POLYGON_API_KEY}`;

//         const response = await axios.get(url);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching six-month historical data', error });
//     }
// });


// router.get('/historicalData', async (req, res) => {
//     // Extract query parameters
//     const { stockTicker, from, to } = req.query;
//     const multiplier = 1;
//     const timespan = 'day';
//     const polygonUrl = `https://api.polygon.io/v2/aggs/ticker/${stockTicker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&apiKey=${YOUR_POLYGON_API_KEY}`;

//     try {
//         const response = await axios.get(polygonUrl);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching historical data', error });
//     }
// });

// router.get('/autocomplete', async (req, res) => {
//     const { query } = req.query;
//     const url = `${FINNHUB_API_BASE}/search?q=${query}&token=${API_KEY}`;

//     try {
//         const response = await axios.get(url);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching autocomplete suggestions', error });
//     }
// });
// router.get('/companyNews', async (req, res) => {
//     const { ticker, from, to } = req.query;
//     const url = `${FINNHUB_API_BASE}/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${API_KEY}`;

//     try {
//         const response = await axios.get(url);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching company news', error });
//     }
// });
// router.get('/recommendationTrends', async (req, res) => {
//     const { symbol } = req.query;
//     const url = `${FINNHUB_API_BASE}/stock/recommendation?symbol=${symbol}&token=${API_KEY}`;

//     try {
//         const response = await axios.get(url);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching recommendation trends', error });
//     }
// });
// router.get('/insiderSentiment', async (req, res) => {
//     const { symbol, from } = req.query;
//     const url = `${FINNHUB_API_BASE}/stock/insider-sentiment?symbol=${symbol}&from=${from}&token=${API_KEY}`;

//     try {
//         const response = await axios.get(url);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching insider sentiment', error });
//     }
// });
// router.get('/companyPeers', async (req, res) => {
//     const { ticker } = req.query;
//     const url = `${FINNHUB_API_BASE}/stock/peers?symbol=${ticker}&token=${API_KEY}`;

//     try {
//         const response = await axios.get(url);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching company peers', error });
//     }
// });
// router.get('/companyEarnings', async (req, res) => {
//     const { ticker } = req.query;
//     const url = `${FINNHUB_API_BASE}/stock/earnings?symbol=${ticker}&token=${API_KEY}`;

//     try {
//         const response = await axios.get(url);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching company earnings', error });
//     }
// });

// Add more routes as needed for other types of data

module.exports = router;
