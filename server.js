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

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname));

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

let portNumber = process.argv[2];

app.get("/", (request, response) => {
    response.render("index");
}); 

app.get("/register", (request, response) => {
  response.render("register", {port: portNumber});
});

app.post("/register", (request, response) => {
  let user = {name: request.body.name, email: request.body.email};
  addUser(user);
  reseponse.render("registerConfirm");
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