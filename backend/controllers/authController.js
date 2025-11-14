// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const generateToken = (userId) => {
//     return jwt.sign(
//         { userId },
//         process.env.JWT_SECRET || 'fallback_secret',
//         { expiresIn: '1h' }
//     );
// };

// exports.signup = async (req, res) => {
//     try {
//         const { name, email, password, role, department } = req.body;

//         // Check if user already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // Create new user
//         const user = new User({
//             name,
//             email,
//             passwordHash: password,
//             role: role || 'student',
//             department: role === 'admin' ? undefined : department
//         });

//         await user.save();

//         // Generate token
//         const token = generateToken(user._id);

//         res.status(201).json({
//             token,
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//                 department: user.department
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error during signup', error: error.message });
//     }
// };

// exports.login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         // Find user
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         // Check password
//         const isMatch = await user.comparePassword(password);
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         // Generate token
//         const token = generateToken(user._id);

//         res.json({
//             token,
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//                 department: user.department
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error during login', error: error.message });
//     }
// };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role,           // ADD THIS
            department: user.department // ADD THIS
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
    );
};

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            passwordHash: password,
            role: role || 'student',
            department: role === 'admin' ? undefined : department
        });

        await user.save();

        // Generate token WITH ROLE AND DEPARTMENT
        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during signup', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token WITH ROLE AND DEPARTMENT
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};