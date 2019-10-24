'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

export const checkHostExists = (url, successFn, errorFn) => ({
  type: actions.CHECK_HOST_EXISTS,
  url,
  successFn,
  errorFn
});

export const setCurrentLoginStep = (step) => ({
  type: actions.SET_CURRENT_LOGIN_STEP,
  currentLoginStep: step
});

export const setUsername = (username) => ({
  type: actions.SET_USERNAME,
  username
});

export const setPassword = (password) => ({
  type: actions.SET_PASSWORD,
  password
});

export const setRememberPassword = (rememberPassword) => ({
  type: actions.SET_REMEMBER_PASSWORD,
  rememberPassword
});

export const setFormDataField = (key, value) => ({
  type: actions.SET_FORM_DATA_FIELD,
  key,
  value
});

export const authenticateIcp4d = (username, password, rememberPassword) => ({
  type: actions.AUTHENTICATE_ICP4D,
  username,
  password,
  rememberPassword
});

export const authenticateIcp4dStreamsInstance = (instanceName) => ({
  type: actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
  instanceName
});

export const setStreamsInstances = (streamsInstances) => ({
  type: actions.SET_STREAMS_INSTANCES,
  streamsInstances
});

export const setSelectedInstance = (streamsInstance) => ({
  type: actions.SET_SELECTED_INSTANCE,
  ...streamsInstance,
  currentLoginStep: 3
});

export const setIcp4dAuthToken = (authToken) => ({
  type: actions.SET_ICP4D_AUTH_TOKEN,
  authToken,
  currentLoginStep: 2
});

export const setIcp4dAuthError = (authError) => ({
  type: actions.SET_ICP4D_AUTH_ERROR,
  authError
});

export const setStreamsAuthToken = (authToken) => {
  if (authToken.expiryTime) {
    return {
      type: actions.SET_STREAMS_AUTH_TOKEN,
      authToken: authToken.authToken,
      expiryTime: authToken.expiryTime,
      issueTime: authToken.issueTime
    };
  }
  return {
    type: actions.SET_STREAMS_AUTH_TOKEN,
    authToken
  };
};

export const setStreamsAccessTokenUrl = (url) => ({
  type: actions.SET_STREAMS_ACCESS_TOKEN_URL,
  url
});

export const setStreamsAuthError = (authError) => ({
  type: actions.SET_STREAMS_AUTH_ERROR,
  authError
});

export const resetAuth = () => ({
  type: actions.RESET_AUTH
});

export const setIcp4dUrl = (icp4dUrl) => ({
  type: actions.SET_ICP4D_URL,
  icp4dUrl
});

export const setUseIcp4dMasterNodeHost = (useIcp4dMasterNodeHost) => ({
  type: actions.SET_USE_ICP4D_MASTER_NODE_HOST,
  useIcp4dMasterNodeHost
});

export const setStreamsBuildUrl = (url) => ({
  type: actions.SET_STREAMS_BUILD_URL,
  url
});

export const setStreamsRestUrl = (url) => ({
  type: actions.SET_STREAMS_REST_URL,
  url
});

export const actions = {
  SET_ICP4D_URL: 'SET_ICP4D_URL',
  SET_USE_ICP4D_MASTER_NODE_HOST: 'SET_USE_ICP4D_MASTER_NODE_HOST',

  SET_STREAMS_REST_URL: 'SET_STREAMS_REST_URL',
  SET_STREAMS_BUILD_URL: 'SET_STREAMS_BUILD_URL',

  CHECK_HOST_EXISTS: 'CHECK_HOST_EXISTS',
  POST_CHECK_HOST_EXISTS: 'POST_CHECK_HOST_EXISTS',

  SET_CURRENT_LOGIN_STEP: 'SET_CURRENT_LOGIN_STEP',
  SET_USERNAME: 'SET_USERNAME',
  SET_PASSWORD: 'SET_PASSWORD',
  SET_REMEMBER_PASSWORD: 'SET_REMEMBER_PASSWORD',
  SET_FORM_DATA_FIELD: 'SET_FORM_DATA_FIELD',

  AUTHENTICATE_ICP4D: 'AUTHENTICATE_ICP4D',
  AUTHENTICATE_ICP4D_STREAMS_INSTANCE: 'AUTHENTICATE_ICP4D_STREAMS_INSTANCE',

  SET_ICP4D_AUTH_TOKEN: 'SET_ICP4D_AUTH_TOKEN',
  SET_ICP4D_AUTH_ERROR: 'SET_ICP4D_AUTH_ERROR',
  SET_STREAMS_INSTANCES: 'SET_STREAMS_INSTANCES',
  SET_SELECTED_INSTANCE: 'SET_SELECTED_INSTANCE',
  SET_STREAMS_ACCESS_TOKEN_URL: 'SET_STREAMS_ACCESS_TOKEN_URL',
  SET_STREAMS_AUTH_TOKEN: 'SET_STREAMS_AUTH_TOKEN',
  SET_STREAMS_AUTH_ERROR: 'SET_STREAMS_AUTH_ERROR',
  RESET_AUTH: 'RESET_AUTH',
};
