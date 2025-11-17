module.exports = {
    env: {
        node: true,
        es2022: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
    ],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
    },
    rules: {
        // Enforce ES6+ practices
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-arrow-callback': 'error',
        'prefer-template': 'error',
        'prefer-destructuring': ['error', {
            array: false,
            object: true,
        }],
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'prefer-exponentiation-operator': 'error',
        'no-useless-constructor': 'error',
        'no-useless-rename': 'error',
        'object-shorthand': 'error',
        'arrow-body-style': ['error', 'as-needed'],
        'arrow-spacing': 'error',
        'no-this-before-super': 'error',
        'no-duplicate-imports': 'error',
        'no-useless-computed-key': 'error',
        'no-useless-concat': 'error',
        
        // Allow CommonJS patterns (Node.js)
        'global-require': 'off',
        'func-style': 'off', // Allow function declarations
        
        // Strict mode
        'strict': ['error', 'never'], // Use ES6 modules instead
        'no-implicit-globals': 'error',
        
        // Code quality
        'no-console': 'warn',
        'no-debugger': 'error',
        'no-alert': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        
        // Best practices
        'eqeqeq': ['error', 'always'],
        'no-throw-literal': 'error',
        'prefer-promise-reject-errors': 'error',
        'no-return-await': 'error',
        'require-await': 'error',
        'consistent-return': 'off', // Allow functions without explicit return
        'radix': ['error', 'always'],
        
        // Style
        'indent': ['error', 4],
        'quotes': ['error', 'single', { avoidEscape: true }],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'always-multiline'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'space-before-blocks': 'error',
        'keyword-spacing': 'error',
        'space-infix-ops': 'error',
        'eol-last': ['error', 'always'],
        'no-trailing-spaces': 'error',
        'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
        
        // Import/Export - off for CommonJS
        'import/prefer-default-export': 'off',
        'import/no-unresolved': 'off',
        'import/extensions': 'off',
        'import/order': 'off',
    },
    overrides: [
        {
            files: ['*.test.js', '*.spec.js'],
            env: {
                jest: true,
            },
            rules: {
                'no-console': 'off',
            },
        },
    ],
};
