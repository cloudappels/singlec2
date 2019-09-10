var aws = require("aws-sdk");
var multer = require("multer"); // https://www.npmjs.com/package/multer
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var fs = require("fs");

var imageroutes = require("./app/routes/image.server.routes");

app = express();

app.set('views', path.join(__dirname, "/app/views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var credentials = new aws.SharedIniFileCredentials({
    profile: "default" // TO-DO
});
aws.config.credentials = credentials;

const s3 = new aws.S3({
    apiVersion: "2006-03-01",
});

app.use(multer({
    dest: "/tmp/"
}).single("pic"));

app.use('/', imageroutes)

const PORT = 3001; // Pick an unused port

var server = app.listen(PORT, function () {
    var host = "0.0.0.0";
    console.log("App is now running at: http://%s:%s", host, PORT);
});

module.exports = app;
