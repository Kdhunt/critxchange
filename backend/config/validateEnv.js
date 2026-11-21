const REQUIRED_VARIABLES = ['JWT_SECRET'];

function validateEnv() {
    const missing = REQUIRED_VARIABLES.filter((variable) => !process.env[variable]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

module.exports = validateEnv;
