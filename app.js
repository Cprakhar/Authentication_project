require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const userData = mongoose.model('User', userSchema);

app.get('/', function(req, res){
    res.render('home');
});

app.route('/login')
    .get(function(req, res){
        res.render('login');
    })
    .post(function(req, res){
        const loginEmail = req.body.username;
        const loginPassword = req.body.password;

        userData.findOne({email: loginEmail}, function(err, founduser){
            if(err){
                console.log(err);
            }else{
                if(founduser){
                    if(founduser.password === loginPassword){
                        res.render('secrets');
                    }
                }
            }
        });
    })
    
app.route('/register')
    .get(function(req, res){
        res.render('register');
    })
    .post(function(req, res){
        const email = req.body.username;
        const password = req.body.password;

        const newUser = new userData({
            email: email,
            password: password
        });
        newUser.save(function(err){
            if(!err){
                res.render('secrets');
            }else{
                console.log(err);
            }
        });
    })







app.listen(3000, function(){
    console.log('Server started running');
});