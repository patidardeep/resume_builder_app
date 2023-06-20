var express = require('express');
var router = express.Router();
const upload = require("../helpers/multer").single("avatar");
const fs = require("fs");
const User = require("../models/userModel");
const passport = require("passport");
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(User.authenticate()));
const nodemailer = require('nodemailer');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: "Home"  ,isLoggedIn:req.user ? true : false, user: req.user, });
});



/* GET show page. */
router.get("/show",isLoggedIn, function(req, res, next) {
  res.render("show", { title: "show"  ,isLoggedIn:req.user ? true : false, user: req.user,});
});

/* GET signup page. */
router.get("/signup", function(req, res, next) {
  res.render("signup", { title: "signup"  ,isLoggedIn:req.user ? true : false, user: req.user,});
});

/* GET signin page. */
router.get("/signin", function(req, res, next) {
  res.render("signin", { title: "signin"  ,isLoggedIn:req.user ? true : false, user: req.user,});
});

/*  post signup page. */
router.post("/signup", function(req, res, next) {
  const {username,email,contact,password}= req.body;
  User.register({username,email,contact},password)
  .then((user)=>{
    res.redirect("signin");
  })
  .catch((err)=>res.send(err));
  
});

/* GET profile page. */
router.get("/profile",isLoggedIn,  function(req, res, next) {
  console.log(req.user);
  res.render("profile", { title: "profile"  ,isLoggedIn:req.user ? true : false, user: req.user,});
});

// sign in post
router.post("/signin", passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/signin",
}) ,
function(req,res,next){}
);

// get signout
router.get("/signout",isLoggedIn,function(req,res,next){
  req.logout(()=>{
    res.redirect("/signin");
  });
});

// get forget password
router.get("/forget-password",function(req,res,next){
  res.render("forget",{
    title: "Forget-Password",isLoggedIn: req.user ? true: false, user: req.user,
  })
});

router.post("/send-mail", async function (req, res, next) {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.send("user not found");

  // const mailurl = `${req.protocol}://${req.get("host")}/forgetpassword/${
  //     user._id
  // }`;
  const code = Math.floor(Math.random() * 9000 + 1000);

  const transport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  auth: {
      user: "patidardeepak327@gmail.com",
      pass: "deepu19456900",
  },
});

const mailOptions = {
  from: "deep Mail Pvt. Ltd. <deep.temp@gmail.com>",
  to: req.body.email,
  subject: "Password Reset Link",
  text: "Do not share this link to anyone.",
  html: `<p>Do not share this code to anyone.</p><h1>${code}</h1>`,
  // html:  `<a href='/forgetpassword${mailurl}'>Password Reset Link</a>`,
};

transport.sendMail(mailOptions, async (err, info) => {
  if (err) return res.send(err);
  // if(err) throw err;
  // console.log(info);
 
  // return res.send(
  //     "<h1 style='text-align:center;color: tomato; margin-top:10%'><span style='font-size:60px;'>✔️</span> <br />Email Sent! Check your inbox , <br/>check spam in case not found in inbox.</h1> <br> <a href='/signin'>Signin</a>"
  // );

  await User.findByIdAndUpdate(user._id, { code });
    
  res.redirect("/code/" + user._id);
});


// --------------------------Node mailer coding--------------------------------------
});

/* GET code/id page. */
router.get("/code/:id", async function (req, res, next) {
    res.render("getcode", { title: "Code", id: req.params.id ,isLoggedIn: req.user ? true: false, user: req.user,});
});

/* POST code/id page. */
router.post("/code/:id", async function (req, res, next) {
  try{
    const user = await User.findById(req.params.id);
  if (user.code == req.body.code)return res.send("wrong code");
  res.redirect(`/forgetpassword/${user._id}`);
  
  
   
  }catch(error){
    res.send(err);
  } 
});

/* GET forgetpassword page. */
router.get("/forgetpassword/:id", async function (req, res, next) {
  res.render("getpassword", { title: "Forget Password", id: req.params.id,isLoggedIn: req.user ? true: false, user: req.user, });
});

/* POST forgetpassword page. */
router.post("/forgetpassword/:id", async function (req, res, next) {
  await User.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/signin");
});

// get reset password
router.get("/reset-password",isLoggedIn,function(req,res,next){
  res.render("reset",{
    title: "Reset-Password",
    isLoggedIn:req.user ? true : false, user: req.user,
  })
});

// post reset password
router.post("/reset-password",isLoggedIn, async function(req,res,next){
  try{
    await req.user.changePassword(
      req.body.oldPassword,
      req.body.newPassword
    );
    await req.user.save();
    res.redirect("/profile");
  }
  catch(err){
    res.send(err)
  }
});

router.post("/upload", isLoggedIn, async function (req, res, next) {
  upload(req, res, function (err) {
      if (err) {
          console.log("ERROR>>>>>", err.message);
          res.send(err.message);
      }
      if (req.file) {
        if (req.user.avatar !== "default.png")
          fs.unlinkSync("./public/images/" + req.user.avatar);
        
          req.user.avatar = req.file.filename;
          req.user
              .save()
              .then(() => {
                  res.redirect("/update/" + req.user._id);
              })
              .catch((err) => {
                  res.send(err);
              });
      }
  });
});

//  post newpassword page
router.post("/forgetpassword/:id",async function(req,res,next){
  const usr = await User.findById(req.params.id);
  usr.setPassword(req.body.newpassword, function(){
    usr.save();
});
  res.redirect("/signin" )


});


router.get("/update/:id", isLoggedIn, async function (req, res, next) {
  res.render("update", {
      title: "Update",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });
});

router.post("/update/:id", isLoggedIn, async function (req, res, next) {
  try {
      const { username, email, contact, linkedin, github, behance } =
          req.body;

      const updatedUserInfo = {
          username,
          email,
          contact,
          links: { linkedin, github, behance },
      };

      await User.findOneAndUpdate(req.params.id, updatedUserInfo);
      res.redirect("/update/" + req.params.id);
  } catch (error) {
      res.send(err);
  }
});


// ------------------resume-----------------------
router.get("/create", isLoggedIn, function (req, res, next) {
  res.render("Resume/Education", {
      title: "Create",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });
});

router.get("/education", isLoggedIn, function (req, res, next) {
  res.render("Resume/Education", {
      title: "Education",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });``
});

router.post("/add-edu", isLoggedIn, async function (req, res, next) {
  req.user.education.push(req.body);
  await req.user.save();
  res.redirect("/education");
});
// ---------------------------------for delete---------------------------------------------
router.get("/delete-edu/:index", isLoggedIn, async function (req, res, next) {
  const eduCopy = [...req.user.education];
  eduCopy.splice(req.params.index, 1);
  req.user.education = [...eduCopy];
  await req.user.save();
  res.redirect("/education");
});
// ------------------------------------------------------------------------------------------

router.get("/skill", isLoggedIn, function (req, res, next) {
  res.render("Resume/Skill", {
      title: "Skill",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });``
});

router.post("/add-skill", isLoggedIn, async function (req, res, next) {
  req.user.skill.push(req.body);
  await req.user.save();
  res.redirect("/skill");
});

router.get("/delete-skill/:index", isLoggedIn, async function (req, res, next) {
  const skillCopy = [...req.user.skill];
  skillCopy.splice(req.params.index, 1);
  req.user.skill = [...skillCopy];
  await req.user.save();
  res.redirect("/skill");
});
// ---------------------------------------------------------------------------------------------------------------
router.get("/project", isLoggedIn, function (req, res, next) {
  res.render("Resume/Project", {
      title: "Project",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });``
});

router.post("/add-project", isLoggedIn, async function (req, res, next) {
  req.user.project.push(req.body);
  await req.user.save();
  res.redirect("/project");
});

router.get("/delete-project/:index", isLoggedIn, async function (req, res, next) {
  const projectCopy = [...req.user.education];
  projectCopy.splice(req.params.index, 1);
  req.user.project = [...projectCopy];
  await req.user.save();
  res.redirect("/project");
});

// ----------------------------------------------------------------------------------------------------------------------

router.get("/experience", isLoggedIn, function (req, res, next) {
  res.render("Resume/Experience", {
      title: "Experince",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });``
});

router.post("/add-exp", isLoggedIn, async function (req, res, next) {
  req.user.experience.push(req.body);
  await req.user.save();
  res.redirect("/experience");
});

router.get("/delete-exp/:index", isLoggedIn, async function (req, res, next) {
  const expCopy = [...req.user.experience];
  expCopy.splice(req.params.index, 1);
  req.user.experience = [...expCopy];
  await req.user.save();
  res.redirect("/experience");
});

// ---------------------------------------------------------------------------------------------------------------------

router.get("/interest", isLoggedIn, function (req, res, next) {
  res.render("Resume/Interest", {
      title: "Interest",
      isLoggedIn: req.user ? true : false,
      user: req.user,
  });``
});

router.post("/add-int", isLoggedIn, async function (req, res, next) {
  req.user.interest.push(req.body);
  await req.user.save();
  res.redirect("/interest");
});

router.get("/delete-int/:index", isLoggedIn, async function (req, res, next) {
  const intCopy = [...req.user.interest];
  intCopy.splice(req.params.index, 1);
  req.user.interest = [...intCopy];
  await req.user.save();
  res.redirect("/interest");
});


function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    next();
  }else{
    res.redirect("/signin")
  }
}
module.exports = router;