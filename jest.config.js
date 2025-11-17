module.exports = {
    testEnvironment: 'node',
    verbose: true,
    testMatch: [
        '**/backend/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/tests/**',
        '!backend/index.js',
        '!backend/models/index.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js'],
    testTimeout: 10000
};
