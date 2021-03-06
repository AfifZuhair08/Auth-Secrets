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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
    password: String,
    googleId: String,
    secret: String
});

// INSERT PASSPORT PLUGIN INTO SCHEMA
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// MODEL
const User = new mongoose.model("User", userSchema);

// MODEL AUTH STRATEGY AND SERIALIZATION
passport.use(User.createStrategy());

// LOCAL MONGOOSE SERIALIZE
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// GOOGLE SERIALIZE USER
passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    })
})


// GOOGLE AUTH STRATEGY
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // find and create if not found/exist
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// MAIN ROUTE
app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
    res.render("login");
});
app.get("/register", function(req, res){
    res.render("register");
});

// ATTEMPT TO SECRETS PAGE (VALIDATE AUTH)
app.get("/secrets", function(req, res){
    // $ne flag is means, (not equal) to null
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    });
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()) {
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
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