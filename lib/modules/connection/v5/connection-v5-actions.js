'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

export const setActiveStreamsInstanceType = (instanceType) => ({
  type: actionTypes.SET_ACTIVE_STREAMS_INSTANCE_TYPE,
  instanceType
});

export const checkHostExists = (url, successFn, errorFn) => ({
  type: actionTypes.CHECK_HOST_EXISTS,
  url,
  successFn,
  errorFn
});

export const setCurrentLoginStep = (step) => ({
  type: actionTypes.SET_CURRENT_LOGIN_STEP,
  currentLoginStep: step
});

export const setUsername = (username) => ({
  type: actionTypes.SET_USERNAME,
  username
});

export const setPassword = (password) => ({
  type: actionTypes.SET_PASSWORD,
  password
});

export const setRememberPassword = (rememberPassword) => ({
  type: actionTypes.SET_REMEMBER_PASSWORD,
  rememberPassword
});

export const setFormDataField = (key, value) => ({
  type: actionTypes.SET_FORM_DATA_FIELD,
  key,
  value
});

export const authenticateIcp4d = (username, password, rememberPassword) => ({
  type: actionTypes.AUTHENTICATE_ICP4D,
  username,
  password,
  rememberPassword
});

export const authenticateIcp4dStreamsInstance = (instanceName) => ({
  type: actionTypes.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
  instanceName
});

export const authenticateStandaloneStreamsInstance = (username, password, rememberPassword) => ({
  type: actionTypes.SET_STREAMS_ACCESS_TOKEN_URL,
  username,
  password,
  rememberPassword
});

export const setStreamsInstances = (streamsInstances) => ({
  type: actionTypes.SET_STREAMS_INSTANCES,
  streamsInstances
});

export const setSelectedCp4dStreamsInstance = (streamsInstance) => {
  const connectionInfo = streamsInstance.CreateArguments['connection-info'];
  let tkUrl = connectionInfo.externalBuildToolkitEndpoint;
  if (!tkUrl) {
    tkUrl = (connectionInfo.externalBuildEndpoint && connectionInfo.externalBuildEndpoint.endsWith('/builds')
      ? `${connectionInfo.externalBuildEndpoint.substring(0, connectionInfo.externalBuildEndpoint.lastIndexOf('/builds'))}/toolkits`
      : `${connectionInfo.externalBuildEndpoint}/toolkits`);
  }
  return {
    type: actionTypes.SET_SELECTED_CP4D_STREAMS_INSTANCE,
    selectedCp4dStreamsInstance: {
      serviceInstanceId: streamsInstance.ID,
      instanceName: streamsInstance.ServiceInstanceDisplayName,
      serviceInstanceVersion: streamsInstance.ServiceInstanceVersion,
      serviceInstanceNamespace: streamsInstance.ServiceInstanceNamespace,
      streamsRestUrl: connectionInfo.externalRestEndpoint,
      streamsBuildRestUrl: connectionInfo.externalBuildEndpoint,
      streamsToolkitRestUrl: tkUrl,
      streamsConsoleUrl: connectionInfo.externalConsoleEndpoint,
      streamsJmxUrl: connectionInfo.externalJmxEndpoint
    },
    // ...streamsInstance,
    currentLoginStep: 3
  };
};


export const setIcp4dAuthToken = (authToken) => ({
  type: actionTypes.SET_ICP4D_AUTH_TOKEN,
  authToken,
  currentLoginStep: 2
});

export const setIcp4dAuthError = (authError) => ({
  type: actionTypes.SET_ICP4D_AUTH_ERROR,
  authError
});

export const setStreamsAuthToken = (authToken) => {
  if (authToken.expiryTime) {
    return {
      type: actionTypes.SET_STREAMS_AUTH_TOKEN,
      authToken: authToken.authToken,
      expiryTime: authToken.expiryTime,
      issueTime: authToken.issueTime,
      currentLoginStep: 3
    };
  }
  return {
    type: actionTypes.SET_STREAMS_AUTH_TOKEN,
    authToken
  };
};

export const setStreamsAccessTokenUrl = (url, username, password) => ({
  type: actionTypes.SET_STREAMS_ACCESS_TOKEN_URL,
  url,
  username,
  password
});

export const setStreamsAuthError = (authError) => ({
  type: actionTypes.SET_STREAMS_AUTH_ERROR,
  authError
});

export const resetAuth = () => ({
  type: actionTypes.RESET_AUTH
});

export const setIcp4dUrl = (icp4dUrl) => ({
  type: actionTypes.SET_ICP4D_URL,
  icp4dUrl
});

export const setUseIcp4dMasterNodeHost = (useIcp4dMasterNodeHost) => ({
  type: actionTypes.SET_USE_ICP4D_MASTER_NODE_HOST,
  useIcp4dMasterNodeHost
});

export const setStreamsBuildUrl = (url) => ({
  type: actionTypes.SET_STREAMS_BUILD_URL,
  url: cleanUrl(url, '/streams/rest/builds'),
  toolkitUrl: cleanUrl(url, '/streams/rest/toolkits')
});

export const setStreamsInstancesRootRestUrl = (url) => ({
  type: actionTypes.SET_STREAMS_INSTANCES_ROOT_REST_URL,
  url: cleanUrl(url, '/streams/rest/instances')
});

export const setStreamsRestUrl = (url) => ({
  type: actionTypes.SET_STREAMS_REST_URL,
  url
});

export const getStreamsStandaloneAccessTokenUrl = (username, password) => ({
  type: actionTypes.GET_STREAMS_STANDALONE_ACCESS_TOKEN_URL,
  username,
  password
});

const cleanUrl = (urlString, finalSegment) => {
  try {
    const url = new URL(urlString); // eslint-disable-line compat/compat
    url.pathname = finalSegment;
    return url.toString();
  } catch (err) {
    return urlString;
  }
};

export const actionTypes = {
  SET_ACTIVE_STREAMS_INSTANCE_TYPE: 'SET_ACTIVE_STREAMS_INSTANCE_TYPE',
  SET_ICP4D_URL: 'SET_ICP4D_URL',
  SET_USE_ICP4D_MASTER_NODE_HOST: 'SET_USE_ICP4D_MASTER_NODE_HOST',

  SET_STREAMS_INSTANCES_ROOT_REST_URL: 'SET_STREAMS_INSTANCES_ROOT_REST_URL',
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

  AUTHENTICATE_STANDALONE_STREAMS_INSTANCE: 'AUTHENTICATE_STANDALONE_STREAMS_INSTANCE',

  GET_STREAMS_STANDALONE_ACCESS_TOKEN_URL: 'GET_STREAMS_STANDALONE_ACCESS_TOKEN_URL',
  SET_STREAMS_ACCESS_TOKEN_URL: 'SET_STREAMS_ACCESS_TOKEN_URL',

  SET_ICP4D_AUTH_TOKEN: 'SET_ICP4D_AUTH_TOKEN',
  SET_ICP4D_AUTH_ERROR: 'SET_ICP4D_AUTH_ERROR',
  SET_STREAMS_INSTANCES: 'SET_STREAMS_INSTANCES',
  SET_SELECTED_CP4D_STREAMS_INSTANCE: 'SET_SELECTED_CP4D_STREAMS_INSTANCE',
  SET_STREAMS_AUTH_TOKEN: 'SET_STREAMS_AUTH_TOKEN',
  SET_STREAMS_AUTH_ERROR: 'SET_STREAMS_AUTH_ERROR',
  RESET_AUTH: 'RESET_AUTH',
};
