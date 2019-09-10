var aws = require("aws-sdk");
var sharp = require("sharp");
var express = require("express");
const uuidv1 = require('uuid/v1')

require("dotenv").config({
    path: process.env.NODE_PATH + '/.env'
})
var fs = require("fs");

aws.config.apiVersions = {
    s3: "2006-03-01"
};
aws.config.region = 'ap-southeast-1';

counter=0

const s3 = new aws.S3();
s3_main_bucket = "";
s3_main_region = "ap-southeast-1";

module.exports.showLandingPage = function(req,res){
	res.render("landingPage.ejs")
};

module.exports.uploadImage = function (req, res, next) {

    fs.access("out.json", error => {
    if (!error) {
        // let s3json=require("out.json")
        // s3_main_bucket=s3json["s3bucketname"]
        // s3_main_region=s3json["region"]
        fs.readFile(req.file.path, function (err, data) {
        if (err) {
            console.log(err);
            throw err;
        }

        var bucketName = s3_main_bucket;

        var raw_folder_name = "raw/";
        var date_filename = Date.now().toString() + "_" + req.file.originalname;
        var raw_upload_filename = raw_folder_name + date_filename;

        if (s3_main_bucket==""){
             res.render("settingsPage.ejs")
        }else{
            var params = {
            Bucket: bucketName,
            Key: raw_upload_filename,
            Body: data
        };

        s3.putObject(params, function (err, data) {
            if (err) {
                console.log("Error: ", err);
                res.redirect("/failed-upload");
            }
        });

        }

        var processed_folder_name = "processed/";
        var processed_filename = date_filename;
        var processed_upload_filename = processed_folder_name + processed_filename;
        // console.log("My processed file name: " + processed_upload_filename);

        var transformed_params = {
            Bucket: bucketName,
            Key: processed_upload_filename
        };

        var s1 = sharp(req.file.path)
            .resize(100) //TO-DO: You can change these dimensions
            // .rotate(180)
            .toBuffer()
            .then(buffer => {

                transformed_params.Body = buffer;

                s3.putObject(transformed_params, (error, data) => {
                    if (error) {
                        console.log("Error (after transformed): ", error);
                        res.redirect("/failed-upload");
                    } else {
                        res.redirect("/home");
                    }
                })
            });


    // ===================================================================
    var s = bucketName+raw_upload_filename
    var s3pathforDDB="s3://"+bucketName+"/"+"processed/"+processed_filename

    var uuid1 = uuidv1()

    var params = {
        TableName : 'awsbiopho',
        Item: {
        "id": uuid1,
        "S3Path": s3pathforDDB

        }
    };

var documentClient = new aws.DynamoDB.DocumentClient();

documentClient.put(params, function(err, data) {
  if (err) console.log(err);
  else {
    console.log("image uploaded")
    var fake=1000000
    if(counter==3){
        count=0
    }
  }
});
    // ====================================================
    });


    } else {
        res.redirect("/settings")
    }
    });

    var root = process.env.NODE_PATH; // ~/ELS_2019
    var tmp_raw_dir = root + "./tmp/raw-images/";
    var raw_tmp_image = tmp_raw_dir + Date.now().toString() + "_" + req.file.originalname;
    var processed_raw_dir = root + "./tmp/processed-images/";
    var processed_tmp_image = processed_raw_dir + Date.now().toString() + "_" + req.file.originalname;

};

module.exports.showUploadPage = function(req,res){
	res.render("homePage.ejs")
};

module.exports.showGalleryPage = function (req, res) {
    res.render("galleryPage.ejs")
};

module.exports.showSettingsPage = function (req, res) {
    res.render("settingsPage.ejs", {
        s3bucketname: s3_main_bucket,
        s3region: s3_main_region
    });
};

module.exports.updateSettingsPage = function (req, res) {
    console.log('old bucket name: ' + s3_main_bucket);
    console.log('old region name: ' + s3_main_region);
    s3_main_bucket = req.body.bucketname;
    s3_main_region = req.body.region;
    console.log('new bucket name: ' + s3_main_bucket);
    console.log('new region name: ' + s3_main_region);
    res.render("settingsPage.ejs", {
        s3bucketname: s3_main_bucket,
        s3region: s3_main_region
    }, function(req,err){
        let s3json = {
            "s3bucketname":s3_main_bucket ,
            "region": s3_main_region
        };

        fs.writeFile('out.json', JSON.stringify(s3json), 'utf8', function (err) {
        if (err)
        {
            return console.log(err);
        }

        console.log("The file was saved!");
        });

        res.redirect('/home')

    });
};

module.exports.showSuccessfulUploadPage = function (req, res) {
    res.render("successfulUploadPage.ejs")
};

module.exports.showFailedUploadPage = function (req, res) {
    res.render("failedUploadPage.ejs")
};
