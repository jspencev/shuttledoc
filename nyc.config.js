var config = {
  include: 'src/**/*.js',
  reporter: [
    'text',
    'lcov'
  ]
};
if (process.env.NYC_CONFIG) {
  Object.assign(config, JSON.parse(process.env.NYC_CONFIG));
}

module.exports = config;