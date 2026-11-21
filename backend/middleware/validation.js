// Input validation middleware
const validateAccount = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];

    // Validate email format
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Invalid email format');
        }
    }

    // Validate password strength (if provided)
    if (password) {
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }
    }

    // Validate username (if provided)
    if (username) {
        if (username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
};

module.exports = { validateAccount };
