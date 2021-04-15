require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session=require("express-session");
const passport=require("passport");
const passportlocalmongoose=require("passport-local-mongoose");
const flash = require('req-flash');
const  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const  findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy;
const app = express();

//console.log(process.env.API_KEY);
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
    secret:"our little secret",
    resave:false,
    saveUninitialized:false
    
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true})
mongoose.set('useCreateIndex', true);
app.use(express.static("public"));
const userschema= new mongoose.Schema({
   email:String,
   password:String,
   googleId:String,
   facebookId:String,
   secret:String
});
userschema.plugin(passportlocalmongoose);
userschema.plugin(findOrCreate);
//userschema.plugin(encrypt,{ secret:process.env.SECRET, encryptedFields:["password"]});
const User=new mongoose.model("User",userschema);
// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
//TODO
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, done) {
  console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
}
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret:process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({facebookId: profile.id}, function(err, user) {
      if (err) { return done(err); }
      done(err, user);
    });
  }
));
app.get("/",function(req,res){
    res.render("home");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));
  app.get('/auth/facebook', passport.authenticate('facebook'));

app.get("/login",function(req,res){
    res.render("login");
});
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });
  app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { successRedirect: '/secrets',
                                      failureRedirect: '/login' }));

                                      app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: 'read_stream'  })
);
app.get("/register",function(req,res){
    res.render("register",{
    messageFailure: req.flash('messageFailure')
    });
});
app.get('/secrets',function(req,res){
   User.find({'secret': {$ne:null}},function (err,found){

    if(err)
    console.log(err);
    else{
        if(found){
            res.render("secrets",{userwithsecret:found});
        }
    }
       
   });
});

app.get('/submit',function (req,res){

 
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else
    res.redirect("/login");  
    
});
app.post('/submit',function (req,res) {
    const submitedsecret=req.body.secret;
    console.log(req.user._id);
    User.findById(req.user._id,function (err,found) {
        if(err)
        console.log(err);
        else
        {

            if(found)
         {   found.secret=submitedsecret;
            found.save(function (){
             
                res.redirect('/secrets');
            });
         }

        }
    })

});
app.get("/logout",function(req,res){
    req.logout();
    res.redirect('/');
});
app.post('/register',function(req,res){

   User.register({username:req.body.username},req.body.password,function(err,user){
       if(err)
      { console.log(err);
      //  res.json({success:false, message:"Your account could not be saved. Error: ", err}) 
      req.flash('messageFailure','User already exists!');
      res.redirect("/register");
   
      }
      else{
          passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets");
          })
      }
   });
  // req.flash('Accountalreadyexists');

});
	

/*app.post('/login',function(req,res){
   const user=new User({
       username:req.body.username,
       password:req.body.password
   });
   req.login(user,function(err){
       if(err)
       {
           console.log(err);
           return next(err);
       }
       else{
        /* passport.authenticate("local" )(req,res,function(){
             if(err)
             res.send('hi');
             else
               res.redirect("/secrets");
           })
        
           
         
       }
   })
});*/
app.post('/login', function(req, res, next) {
 
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.render('erry'); }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/secrets');
    });
  })(req, res, next);
});
app.listen(3000, function() {
  console.log("Server started on port 3000");
})

//ishu2001mitra@gmail.com