require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine","ejs");

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

// SCHEMA
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});



// MODEL
const User = new mongoose.model("User", userSchema);

// MAIN ROUTE
app.get("/", function(req, res){
    res.render("home");
});
app.get("/login", function(req, res){
    res.render("login");
});
app.get("/register", function(req, res){
    res.render("register");
});


// REGISTER
app.post("/register", function(req, res){

    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)//hash with md5
    });

    newUser.save(function(err){
        if(!err) {
            console.log("Success");
            res.render("secrets");
        }else{
            console.log("Not Success" + err);
        }
    });
});

// LOGIN
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = md5(req.body.password);//hashed password

    User.findOne({email: username}, function(err, foundUser){
        if(err) {
            console.log(err);
        }else{
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }
            }
        }
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});