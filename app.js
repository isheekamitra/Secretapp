require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const md5=require("md5");
const bcrypt=require("bcrypt");
const saltrounds=10;

const app = express();
//console.log(process.env.API_KEY);
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true})
app.use(express.static("public"));
const userschema= new mongoose.Schema({
   email:String,
   password:String
});

//userschema.plugin(encrypt,{ secret:process.env.SECRET, encryptedFields:["password"]});
const User=new mongoose.model("User",userschema);
//TODO
app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});

app.post('/register',function(req,res){

    bcrypt.hash(req.body.password, saltrounds, function(err, hash) {
        // Store hash in your password DB.
        const newuser=new User({
            email:req.body.username,
            password:hash
        });
        newuser.save(function(err){
            if(err)
            console.log(err);
            else
            res.render("secrets");
        });
    });

});
app.post('/login',function(req,res){
    const username=req.body.username;
    const password=req.body.password;
    User.findOne({email:username},function(err,result){
        if(err)
        console.log(err);
        else
        {
            if(result)
            {    bcrypt.compare(password, result.password, function(err, okay) {
                // result == true
                  if(okay===true){
                    res.render("secrets");
                  }
                  
                else
                res.send("Oops wrong password,Try again");
            });
              
               
               
            }
            else
            res.send("No account found");

           
        }
    })
})
app.listen(3000, function() {
  console.log("Server started on port 3000");
})