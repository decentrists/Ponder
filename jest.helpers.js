/**
 * Global Jest variables and helper functions. See jest.setup.js for global hooks.
 */

global.enableArConnect = () => {
  Object.assign(process.env, { REACT_APP_USE_ARCONNECT: 'true' });
};

global.disableArConnect = () => {
  Object.assign(process.env, { REACT_APP_USE_ARCONNECT: 'false' });
};

global.resetArConnect = () => {
  process.env.REACT_APP_USE_ARCONNECT = global.originalArConnectState;
};
