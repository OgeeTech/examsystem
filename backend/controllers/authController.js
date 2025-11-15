

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

        // Department handling based on role
        let finalDepartment = undefined;

        if (role === 'admin') {
            // Admins MUST NOT have a department
            finalDepartment = undefined;
        }
        else if (role === 'tutor' || role === 'student') {
            if (!department) {
                return res.status(400).json({
                    message: 'Department is required for tutors and students'
                });
            }
            finalDepartment = department;
        }
        else {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            passwordHash: password,
            role: role || 'student',
            ...(finalDepartment && { department: finalDepartment }) // add only if exists
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
                department: user.department || null
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            message: 'Server error during signup',
            error: error.message
        });
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