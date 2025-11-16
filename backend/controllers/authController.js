

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

        // Validate role
        if (!['admin', 'tutor', 'student'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Department validation
        let finalDepartment = undefined;

        if (role === 'admin') {
            finalDepartment = undefined;
        } else {
            if (!department || department.trim() === "") {
                return res.status(400).json({
                    message: 'Department is required for tutors and students'
                });
            }

            finalDepartment = department;
        }

        // Create new user
        // Prepare user data safely
        const userData = {
            name,
            email,
            passwordHash: password,
            role
        };

        // Add department ONLY for tutor/student
        if (role !== 'admin') {
            userData.department = department;
        }

        const user = new User(userData);
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