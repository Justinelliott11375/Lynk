const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const validator = require('express-validator');

const User = require('../../models/User');
// @route    GET api/auth
// @desc     Test route
// @access   Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// @route    POST api/auth
// @desc     Authenticate user and get token
// @access   Public
router.post('/', [
    validator.check('email', 'Please include a valid email')
    .isEmail(),
    validator.check('password', 'Password is required')
    .exists()
],
 async (req, res) => {
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        
        // See if there is a user
        let user = await User.findOne({ email });

        if(!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials'}] });
        }
        
        // Compare entered password to user's password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials'}] });
        }
        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 36000 },
            (err, token) => {
                if(err) throw err;
                res.json({ token });
            });
    } catch (err) {
    
        console.log(err.message);
        res.status(500).send('Server error');
    }

});

module.exports = router;