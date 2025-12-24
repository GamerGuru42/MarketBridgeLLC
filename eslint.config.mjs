const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "dist/**",
      "server/**"
    ]
  },
  {
    rules: {
      "no-unused-vars": "off",
    }
  }
];

export default eslintConfig;
