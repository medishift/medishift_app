const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
//const flash = require('connect-flash');


const passport = require('passport');
//const popupS = require('popups');
//const app = express('8000');
//app.use(popupS());


//Bring in User Model

let User = require('../models/user');



// Register Form

router.get('/register', function (req,rest) {
res.render('register');

});



//Register Process
    router.post('/register',function (req,res) {

        const fullname = req.body.fullname;
        const username = req.body.username;
        const email = req.body.email;
        const gender = req.body.gender;
        const password = req.body.password;
        const confirmpassword = req.body.confirmpassword;
        //const phone = req.body.phone;

        req.checkBody('fullname', 'Name is required').notEmpty();
        req.checkBody('username', 'User name is required').notEmpty();
        req.checkBody('email', 'Email is required').notEmpty();
        req.checkBody('email', 'Email is not valid').isEmail();
        req.checkBody('gender', 'please select your gender').notEmpty();
        req.checkBody('password', 'Password is required').notEmpty();
        req.checkBody('confirmpassword', 'Password is required').notEmpty();
        req.checkBody('password', 'Passwords do not match').equals(confirmpassword);

        let errors = req.validationErrors();

        if(errors){
            res.render('register', {
                errors:errors
            });
        } else {
            let newUser = new User({
                fullname:fullname,
                username: username,
                email:email,
                gender:gender,
                password:password
            });

            bcrypt.genSalt(10, function(err, salt){
                bcrypt.hash(newUser.password, salt, function(err, hash){
                    if(err){
                        console.log(err);
                    }
                    newUser.password = hash;
                    newUser.save(function(err){
                        if(err){
                            console.log(err);
                            return;
                        } else {
                            // popupS.alert({
                            //     content: 'u r registered'
                            // });
                            res.redirect('/login');
                        }
                    });
                });
            });
        }



    });
// Login Form
router.get('/login', function(req, res){
    res.render('login');
});

// Login Process
router.post('/login', function(req, res, next){
    passport.authenticate('local', {
        successRedirect:'/',
        failureRedirect:'/users/login',
        //failureFlash: true
    })(req, res, next);
});

// logout
// router.get('/logout', function(req, res){
//     req.logout();
//     req.flash('success', 'You are logged out');
//     res.redirect('/users/login');
// });




module.exports=router;