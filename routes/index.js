var express = require('express');
var router = express.Router();

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = 'mongodb://louisokezie:a5ixXgirtjafniGd9zhJkuaoJiCShlKON2YViWWhgPMzpeOTebkgp3h8QWbZMV0NImmjsmb8OWj7nrAbmBGoJw==@louisokezie.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&replicaSet=globaldb&maxIdleTimeMS=120000&appName=@louisokezie@';

var db;

MongoClient.connect(url, function (err, client) {
  db = client.db('bookingsDB');
  console.log("DB connected");
});

/* Handle the Form */
router.post('/bookings', async function (req, res) {

  //  The below codes are commented out so that the request is not sent to the user

  // var response = {
  //     headers: req.headers,
  //     body: req.body
  // };

  // res.json(response);    
  req.body.Salary = parseInt(req.body.Salary);

  let result = await db.collection("bookings").insertOne(req.body);
  res.status(201).json({ id: result.insertedId });
});

// "use strict";

// const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
// const key = '<paste-your-key-here>';
// const endpoint = '<paste-your-endpoint-here>';
// // Authenticate the client with your key and endpoint
// const textAnalyticsClient = new TextAnalyticsClient(endpoint,  new AzureKeyCredential(key));

// // Example method for detecting sentiment in text
// async function sentimentAnalysis(client){

//     const sentimentInput = [
//         // "I had the best day of my life. I wish you were there with me."
//         Comment
//     ];
//     const sentimentResult = await client.analyzeSentiment(sentimentInput);

//     sentimentResult.forEach(document => {
//         console.log(`ID: ${document.id}`);
//         console.log(`\tDocument Sentiment: ${document.sentiment}`);
//         console.log(`\tDocument Scores:`);
//         console.log(`\t\tPositive: ${document.confidenceScores.positive.toFixed(2)} \tNegative: ${document.confidenceScores.negative.toFixed(2)} \tNeutral: ${document.confidenceScores.neutral.toFixed(2)}`);
//         console.log(`\tSentences Sentiment(${document.sentences.length}):`);
//         document.sentences.forEach(sentence => {
//             console.log(`\t\tSentence sentiment: ${sentence.sentiment}`)
//             console.log(`\t\tSentences Scores:`);
//             console.log(`\t\tPositive: ${sentence.confidenceScores.positive.toFixed(2)} \tNegative: ${sentence.confidenceScores.negative.toFixed(2)} \tNeutral: ${sentence.confidenceScores.neutral.toFixed(2)}`);
//         });
//     });
//     return sentimentResult;
// }
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});



//  The below codes are commented out so that the request is not sent to the user
router.post('/bookings', async function (req, res) {

  req.body.Salary = parseInt(req.body.Salary);

  let result = await db.collection("bookings").insertOne(req.body);

  for (var i = 0; i < req.body.Salary; i++) {

    await db.collection("tickets").insertOne({ bookingId: result.insertedId, uuid: uuidv4() });
  }

  res.status(201).json({ id: result.insertedId });

});


router.get("/api/bookings/:id/tickets", async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  var pipelines = [
    { $match: { _id: req.params.id } },
    {
      $lookup:
      {
        from: "tickets",
        localField: "_id",
        foreignField: "bookingId",
        as: "tickets"
      }
    }
  ]

  let results = await db.collection("bookings").aggregate(pipelines).toArray();

  if (results.length > 0)
    return res.json(results[0]);
  else
    return res.status(404).send("Not Found");

});




/* Display all Bookings */
router.get('/bookings', async function (req, res) {

  let results = await db.collection("bookings").find().toArray();

  res.render('bookings', { bookings: results });

});


/* Display a single Booking */
router.get('/bookings/read/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOne({ _id: ObjectId(req.params.id) })

  if (result)
    res.render('booking', { booking: result });
  else
    res.status(404).send('Unable to find the requested resource!');

});

// Delete a single Booking
router.post('/bookings/delete/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOneAndDelete({ _id: ObjectId(req.params.id) })

  if (!result.value) return res.status(404).send('Unable to find the requested resource!');

  res.send("Booking deleted.");

});

// Form for updating a single Booking 
router.get('/bookings/update/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOne({ _id: ObjectId(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.render("update", { booking: result })

});
// Updating a single Booking 
router.post('/bookings/update/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  req.body.Salary = parseInt(req.body.Salary);

  var result = await db.collection("bookings").findOneAndReplace({ _id: ObjectId(req.params.id) },
    req.body
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("Booking updated.");

});


// /* Searching */
router.get('/bookings/search', async function (req, res) {

  var whereClause = {};

  if (req.query.email) whereClause.email = { $regex: req.query.email };

  var parsedNumTickets = parseInt(req.query.numTickets);
  if (!isNaN(parsedNumTickets)) whereClause.numTickets = parsedNumTickets;

  let results = await db.collection("bookings").find(whereClause).toArray();

  return res.render('bookings', { bookings: results });

});

/* Pagination */
router.get('/bookings/paginate', async function (req, res) {

  var perPage = Math.max(req.query.perPage, 2) || 2;

  var results = await db.collection("bookings").find({}, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();

  var pages = Math.ceil(await db.collection("bookings").count() / perPage);

  return res.render('paginate', { bookings: results, pages: pages, perPage: perPage });

});
/* Ajax-Pagination */
router.get('/api/bookings', async function (req, res) {
  var perPage = Math.max(req.query.perPage, 2) || 2;
  var results = await db.collection("bookings").find({}, {
    limit: perPage,
    skip: perPage * (Math.max(req.query.page - 1, 0) || 0)
  }).toArray();
  var pages = Math.ceil(await db.collection("bookings").count() / perPage);
  // return res.render('paginate', { bookings: results, pages: pages, perPage: perPage });
  return res.json({ bookings: results, pages: pages })

});

// Form for updating a single Booking 
router.get('/api/bookings/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOne({ _id: ObjectId(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.json(result);

});
// Updating a single Booking - Ajax
router.put('/api/bookings/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  req.body.Salary = parseInt(req.body.numTickets);

  var result = await db.collection("bookings").findOneAndReplace(
    { _id: ObjectId(req.params.id) }, req.body
  );

  if (!result.value)
    return res.status(404).send('Unable to find the requested resource!');

  res.send("Booking updated.");

});

// Delete a single Booking
router.delete('/api/bookings/:id', async function (req, res) {

  if (!ObjectId.isValid(req.params.id))
    return res.status(404).send('Unable to find the requested resource!');

  let result = await db.collection("bookings").findOneAndDelete({ _id: ObjectId(req.params.id) })

  if (!result.value) return res.status(404).send('Unable to find the requested resource!');

  return res.status(204).send();

});

// GroupBy
router.get('/api/bookings/aggregate/groupby', async function (req, res) {

  const pipeline = [
    { $match: {Year: "2011" } },
    { $group: { _id: "Level", count: { $sum: 1 } } }
  ];

    // { $match: { superhero: { $ne: null } } },
  //   db..aggregate([
  //     { $match: { } }
  // ])
  

  const results = await db.collection("bookings").aggregate(pipeline).toArray();

  return res.json(results);

});
module.exports = router;
