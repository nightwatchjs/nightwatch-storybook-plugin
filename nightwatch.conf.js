module.exports = {
  src_folders: ['stories/*.stories.jsx', 'tests'],

  // See https://nightwatchjs.org/guide/extending-nightwatch/custom-commands.html
  custom_commands_path: [
    //path.join('nightwatch', 'commands')
  ],

  '@nightwatch/storybook': {
    start_storybook: true,
    storybook_config_dir: '.storybook',
    hide_csf_errors: true,
    storybook_url: 'http://localhost:6006/'
  },

  plugins: ['./test_plugin.js'],
  // See https://nightwatchjs.org/guide/#external-globals
  //globals_path: path.join('nightwatch', 'globals.js'),

  webdriver: {},

  test_settings: {
    default: {
      disable_error_log: false,
      launch_url: 'http://localhost:8736',
      screenshots: {
        enabled: false,
        path: 'screens',
        on_failure: true
      },
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          w3c: true,
          args: []
        }
      },
      webdriver: {
        start_process: true,
        server_path: ''
      }
    }
  }
};
