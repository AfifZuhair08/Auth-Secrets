// ENVIRONMENT SETUP 
require("dotenv").config();

// PACKAGE SETUP 
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// AUTH PACKAGE SETUP 
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// INITIALIZE EXPRESS (FOR USE & SET) 
const app = express();

// SERVER DEFAULT CONFIG 
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine","ejs");

// SESSION
app.use(session({
    secret: "My Secret Key.",
    resave: false,
    saveUninitialized: false
}));
// PASSPORT INITIALIZE & SESSION
app.use(passport.initialize());
app.use(passport.session());

// MONGODB SERVER CONFIG CONNECTION 
mongoose.connect(
    "mongodb://localhost:27017/userDB", 
    {
        useNewUrlParser: true, 
        useUnifiedTopology: true
    }
);
mongoose.set("useCreateIndex", true);

// SCHEMA
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// INSERT PASSPORT PLUGIN INTO SCHEMA
userSchema.plugin(passportLocalMongoose);

// MODEL
const User = new mongoose.model("User", userSchema);

// MODEL AUTH STRATEGY AND SERIALIZATION
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

// ATTEMPT TO SECRETS PAGE (VALIDATE AUTH)
app.get("/secrets", function(req, res){
    if(req.isAuthenticated()) {
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

// LOGOUT & REMOVE COOKIE
app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
})

// REGISTER & AUTHENTICATE
app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

// LOGIN & AUTHENTICATE
app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});