module.exports = {
  env: {
    node: true,
    es6: true
  },
  extends: 'eslint:recommended',
  rules: {
    'comma-dangle': [ 'error', 'never' ],
    'indent': ['error', 2, { SwitchCase: 1 } ],
    'no-unused-vars': 'warn',
    'quotes': ['error', 'single'],
    'semi': ['error', 'always']
  }
};
