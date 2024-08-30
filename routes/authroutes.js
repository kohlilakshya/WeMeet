const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/userModel');

// Logout route
router.get('/logout', (req, res) => {
    // Remove the user from the database
    User.deleteOne({ _id: req.user.id });

    // Log the user out and redirect to the home page
    req.logout((result) => {
        res.redirect('/');
    });
});

// Google OAuth login route
router.get('/google', passport.authenticate('google', {
    scope: ['profile']
})); // Initiates the Google OAuth flow by bringing up the consent screen

// Google OAuth callback route
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    // After successful authentication, redirect to the home page
    res.redirect('/');
}); // Handles the callback after Google has authenticated the user

module.exports = router;
