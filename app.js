require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2');
const findOrCreate = require('mongoose-findorcreate');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.use(session({
    secret: 'OnePiece@LuffyZoroSanji',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String,
    googleId: String,
    facebookId: String,
    githubId: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const userData = mongoose.model('User', userSchema);

passport.use(userData.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/secrets',
  },
  function(accessToken, refreshToken, profile, cb) {
    userData.findOrCreate({ googleId: profile.id, username: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/facebook/secrets'
  },
  function(accessToken, refreshToken, profile, cb) {
    userData.findOrCreate({ facebookId: profile.id, username: profile.id}, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GIT_CLIENT_ID,
    clientSecret: process.env.GIT_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/github/secrets'
  },
  function(accessToken, refreshToken, profile, done) {
    userData.findOrCreate({ githubId: profile.id, username: profile.id}, function (err, user) {
      return done(err, user);
    });
  }
));


app.get('/', function(req, res){
    res.render('home');
});

app.route('/login')
    .get(function(req, res){
        res.render('login');
    })
    .post(function(req, res){
        const user = new userData({
            username: req.body.username,
            password: req.body.password
        });
        req.logIn(user, function(err){
            if(err){
                console.log(err);
                res.redirect('/login');
            }else{
                passport.authenticate('local')(req, res, function(){
                    res.redirect('/secrets');
                });
            }
        });
    })
    
app.route('/register')
    .get(function(req, res){
        res.render('register');
    })
    .post(function(req, res){
        userData.register({username: req.body.username}, req.body.password, function(err, user){
            if(err){
                console.log(err);
                res.redirect('/register');
            }else{
                passport.authenticate('local')(req, res, function(){
                    res.redirect('/secrets');
                });
            }
        });
    })

app.route('/secrets')
    .get(function(req, res){
        if(req.isAuthenticated()){
            res.render('secrets');
        }else{
            res.redirect('/login');
        }
    })    

app.route('/logout')
    .get(function(req, res){
        req.logout(function(err){
            if(err){
                console.log(err);
                res.redirect('/secrets');
            }else{
                res.redirect('/');
            }
        });
    })

app.route('/submit')
    .get(function(req, res){
        if(req.isAuthenticated()){
            res.render('submit');
        }else{
            res.redirect('/login');
        }
    })   
    .post(function(req, res){
        const secret = req.body.secret;
        console.log(req);
        userData.findById(req.user.id, function(err, founduser){
            if(err){
                console.log(err);
                res.redirect('/submit');
            }else{
                if(founduser){
                    founduser.secret = secret;
                    founduser.save(function(err){
                        if(!err){
                            res.redirect('/secrets');
                        }
                    });
                }
            }
        });
    }) 

app.route('/auth/google')
    .get(passport.authenticate('google', {scope: ['profile']}));    

app.route('/auth/google/secrets')
    .get(passport.authenticate('google', { failureRedirect: '/login' }), function(req, res) {
        res.redirect('/secrets');
    })

app.route('/auth/facebook')
    .get(passport.authenticate('facebook'));

app.route('/auth/facebook/secrets')
    .get(passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
        res.redirect('/secrets');
    })

app.route('/auth/github')
    .get(passport.authenticate('github', { scope: [ 'user:email' ] }))

app.route('/auth/github/secrets')
    .get(passport.authenticate('github', { failureRedirect: '/login' }), function(req, res) {
      res.redirect('/secrets');
    })

app.listen(3000, function(){
    console.log('Server started running');
});