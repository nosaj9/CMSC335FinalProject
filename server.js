const http = require("http");
const path = require("path");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })  
const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const MONGO_COLLECTION = process.env.MONGO_COLLECTION;

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${username}:${password}@cluster0.znsncma.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const request = require('request');
let currentFact = "";

var limit = 1
request.get({
  url: 'https://api.api-ninjas.com/v1/facts?limit=' + limit,
  headers: {
    'X-API-Key': 'IGFgv3k1rqv2Ms/xL+Uuzw==uQB91LwQ7XLAwx7M',
  },
}, function(error, response, body) {
  if(error) return console.error('Request failed:', error);
  else if(response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
  else {
    currentFact = body.toString('utf8').slice(11).slice(0, -3);
  }
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname));

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

let portNumber = process.argv[2];

app.get("/", (request, response) => {
    response.render("index", {fact: currentFact});
}); 

app.get("/register", (request, response) => {
  response.render("register", {port: portNumber});
});

app.post("/register", (request, response) => {
  let user = {name: request.body.name, email: request.body.email};
  addUser(user);
  response.render("registerConfirm");
});

app.get("/generate", (request, response) => {
    response.render("generate", {port: portNumber, facts: ">> Facts will appear here <<"});
});

app.post("/generate", (request, response) => {

    let factTable = "";

    

    response.render("generate", {port: portNumber, facts: factTable});
});

if(process.argv.length != 3) {
    process.stdout.write("Usage server.js port_number\n");
    process.exit(1);
}

async function addUser(user) {
  try {
      await client.connect();
      await client.db(MONGO_DB_NAME).collection(MONGO_COLLECTION).insertOne(user);
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

let server = http.createServer(app)

server.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);

process.stdin.setEncoding("utf8");
process.stdout.write("Stop to shutdown the server: ");

process.stdin.on("readable", function() {
  let input = process.stdin.read();
  
  if(input !== null) {
    let command = input.trim();

    if(command === "stop") {
        process.exit(0);
    } 
    else {
        process.stdout.write("Invalid command: " + command + "\n");
    }

    process.stdout.write("Stop to shutdown the server: ");
    process.stdin.resume();
  }
});