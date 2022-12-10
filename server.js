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

//change this depending on where you are running the app
const HOSTNAME = "fun-fact-generator.onrender.com";
//const HOSTNAME = "localhost";

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
  response.render("register", {hostname: HOSTNAME, port: portNumber});
});

app.post("/register", (request, response) => {
  let user = {name: request.body.name, email: request.body.email};
  addUser(user);
  response.render("registerConfirm");
});

app.get("/generate", (request, response) => {
    response.render("generate", {hostname: HOSTNAME, port: portNumber, facts: ">> Facts will appear here <<"});
});

app.post("/generate", (request, response) => {
    generateFacts(request.body.email, parseInt(request.body.number), response);
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

async function generateFacts(email, numFacts, response) {
    try {
        await client.connect();
        let applicant = await client.db(MONGO_DB_NAME).collection(MONGO_COLLECTION).findOne({email: email});

        let allFacts = "";

        if(!applicant) {
            response.render("generate", {port: portNumber, facts: "User doesn't exist"});
        }
        else {

            var limit = numFacts
                request.get({
                url: 'https://api.api-ninjas.com/v1/facts?limit=' + limit,
                headers: {
                    'X-API-Key': 'IGFgv3k1rqv2Ms/xL+Uuzw==uQB91LwQ7XLAwx7M',
                },
            }, function(error, resp, body) {
                if(error) return console.error('Request failed:', error);
                else if(resp.statusCode != 200) return console.error('Error:', resp.statusCode, body.toString('utf8'));
                else {
                    allFacts = body.toString('utf8');

                    let factsHTML = "";

                    var regex = /{(.*?)}/g;
                    match = regex.exec(allFacts);
                    let counter = 0;

                    while (match != null) {
                        factsHTML += "<p id=\"fact\">" + match[1].slice(9).slice(0, -1).replace(/\\/g, "") + "</p>\n";

                        counter += 1;
                        match = regex.exec(allFacts);
                    }

                    response.render("generate", {hostname: HOSTNAME, port: portNumber, facts: factsHTML});
                }
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

let server = http.createServer(app)

server.listen(portNumber);
console.log(`Web server started and running at http://${HOSTNAME}:${portNumber}`);

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