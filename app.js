require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const validator = require("validator");
const moment=require('moment');
const mongoose = require("mongoose");
const session = require('express-session');
const passport= require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy= require("passport-facebook").Strategy;
const findOrCreate=require( "mongoose-findorcreate");



const app = express();

// config start
app.set("view engine", "ejs");
app.use( bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// config end

app.use(session({
  secret:"ilker.",
  resave:false,
  saveUninitialized:false
}));


app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/NeighborBookDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false});
mongoose.set("useCreateIndex", true);
// sartlar burada hazirlanir.

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, min: 6,  max:21 },

  picture: {type: String,default: 'https://picsum.photos/50/50/?random'},

  password: { type: String, required: true, min: 6, max:20 },

  email: { type: String, required: true },

  gender: { type: String, enum: ["Male", "Female", "Others"], default: "Male"},
  
  dob: { type: Date }
  
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User", userSchema);


const postSchema = new mongoose.Schema({
  post: {  type: String, max: 500 },
  comment: {type: String,max: 500,default: ''},
  time: { type: Date, default: Date.now },
  like: { type: Number, default: 0 },
  dislike: { type: Number, default: 0 },
  _username:{type:mongoose.SchemaTypes.ObjectId, ref:"User"}
  
});

const Post = new mongoose.model("Post", postSchema);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// google
passport.use(new GoogleStrategy({
  clientID:process.env.CLIENT_ID,
  clientSecret:process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/neighborbook",
  userProfileURL:"https://googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

passport.use(new FacebookStrategy({
  clientID:process.env.FACEBOOK_APP_ID,
  clientSecret:process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/neigborbook"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

  app.get("/auth/google",
 passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/home", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/home");
  });


  app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/home',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });

  app.get("/", (req, res) => {
    res.render("login");
  });
// Login yapmak istediginde username veya password bos mu die bakiyoruz. Bos ise Username and Password cannot be empty ifadesi cikiyor.eger usernmae ve passwordda sknti yoksa ve kisi bulundu ise acilsin cennetin kapilari deyip home page a giris izni verilir. ancak kisi bulunmadi ise "401 Unauthorized" uyarisi cikar.
app.post("/", (req, res) => {
  const user =new User({
    username: req.body.username,
    password: req.body.password
});
 
  if (validator.isEmpty(req.body.username) || validator.isEmpty(req.body.password)) {
    res.send("Username and Password cannot be empty");
  } else {
   req.login(user, (err) => {
      if (!err) {
       
          passport.authenticate("local" ,{ failureFlash: 'Invalid username or password.'})(req, res, () => {
              res.redirect('/home');
              //res.render("post", { usernameLogin: req.body.username });
          });
      } else {
        
          res.send(err);
          // .then(setTimeout(res.redirect('/home'), 3000));
      }
  });
  }
});


// REGISTER
app.get("/register",(req, res)=>{
  res.render("register");
});


app.post("/register", (req, res) => {
  //register sayfasinda ki bilgileri burasi tutar ve if kisminda isleme tabi tutar. eger sartlar saglaniyorsa gecis izni verilir.

  const usernameNew = req.body.username;
  const passwordNew = req.body.password;
  const emailNew = req.body.email;
  const dobNew = req.body.dob;

  if (validator.isEmail(emailNew)) {
    if (!validator.isEmpty(usernameNew)) {
      if (!validator.isEmpty(passwordNew)) {
        if (validator.isLength(usernameNew, { min: 3, max:21 })) {
          if (validator.isLength(passwordNew, { min: 6, max:20 })) {
            //  validoter'da hersey tmm oldugunda, eger girilen bilgiler databasede daha once eklenmisse veya eklenmemisse findOne bunu kontrol eder. username email kontrollerini yaparki ikinci asamada database e eklesin, ayni bilgiler girilmisse bunu engeller.
            User.findOne(
              { username: usernameNew },
              (err, foundUser) => {
                if (!err) {
                  if (!foundUser) {
                    const newUser = new User({
                      username: usernameNew,
                      email: emailNew,
                      password: passwordNew,
                      dob: dobNew
                    });
                    newUser.save(); 
                    res.redirect("/home");
                  } else {
                    res.send("username or email are already in use.");
                  }
                } else{console.log(err);}
              }
            );
          }else{console.log('1');}
        }else{console.log('2');}
      }else{console.log('3');}
    }else{console.log('4');}
  }else{console.log('5');}
});

// home icersinde yeni bir post yapmak icin, o postun ID si lazim bundan dolayi newPostId ile ariyoruz ve postumuzu cagiriyoruz.


// GET post==

app.get("/home", async(req, res) => {
  
  if (req.isAuthenticated()) { 
      const users = await Post.find({ _username: { $ne: null } })
          .populate('_username', ['username','picture'])
          .sort({ 'time': 'desc' });
      res.render('home', { users, loginInf: req.user, moment });
  } else {
    console.log('req hatasi');
      res.redirect("/");
  }
});

app.post("/home", async(req, res) => {
  let newpost = req.body.post;
  let newcomment = req.body.comment;

  const newPost = new Post({
      post: newpost,
      comment: newcomment,
      _username: req.user.id,
      time: new moment()
  });


  try {
      await newPost.save();
     
      res.redirect("home");
  } catch (err) {
      res.status(400).send(err);
  }
});


app.get("/home/like/:id", async(req, res) => {
  let { id } = req.params;
  await Post.findById(id).then(post => {
      post.like = post.like + 1;
      post.save().then(like => {
          res.redirect("/home");
      });
  });
});

app.get("/home/dislike/:id", async(req, res) => {
  let { id } = req.params;
  await Post.findById(id).then(post => {
      post.dislike = post.dislike + 1;
      post.save().then(dislike => {
          res.redirect("/home");
      });
  });
});


app.get("/home/delete/:id", async(req, res) => {
  let { id } = req.params;

  await Post.findByIdAndRemove(id, (err) => {
      if (!err) {
          res.redirect("/home");
      } else {
          console.log(err);
      }
  });

});
  

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
