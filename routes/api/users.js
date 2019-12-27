const express = require('express');
const router = express.Router();
const validator = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post('/', [
    validator.check('name', 'Name is required')
    .not().isEmpty(),
    validator.check('email', 'Please include a valid email')
    .isEmail(),
    validator.check('password', 'Please enter a password with 5 or more characters')
    .isLength({ min: 5})
],
 async (req, res) => {
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        
        // See if there is a user
        let user = await User.findOne({ email });

        if(user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists'}] });
        }
        
        // Get users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

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