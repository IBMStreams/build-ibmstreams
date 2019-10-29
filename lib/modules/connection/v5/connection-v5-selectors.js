'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

// import * as path from 'path';
import { createSelector } from 'reselect';
import { Map } from 'immutable';

/**
 * connection state selectors
 */

const getBase = (state) => state.get('connectionV5');

const getActiveStreamsInstanceType = createSelector(
  getBase,
  (base = Map()) => base.getIn(['activeStreamsInstanceType'])
);

const getLoginFormInitialized = createSelector(
  getBase,
  (base = Map()) => base.getIn(['formData', 'loginFormInitialized'])
);

const getSelectedInstance = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance'])
);

const getSelectedInstanceName = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'instanceName'])
);

const getIcp4dBearerToken = createSelector(
  getBase,
  (base = Map()) => base.getIn(['icp4dAuthToken'])
);

const getStreamsBearerToken = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'streamsAuthToken'])
);

const getCurrentLoginStep = createSelector(
  getBase,
  (base = Map()) => base.getIn(['currentLoginStep'])
);

const getIcp4dAuthError = createSelector(
  getBase,
  (base = Map()) => base.getIn(['icp4dAuthError'])
);

const getStreamsAuthError = createSelector(
  getBase,
  (base = Map()) => base.getIn(['streamsAuthError'])
);

const getServiceInstanceId = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'serviceInstanceId'])
);

const getStreamsInstances = createSelector(
  getBase,
  (base = Map()) => base.getIn(['streamsInstances'])
);

const getUsername = createSelector(
  getBase,
  (base = Map()) => base.getIn(['username'])
);

const hasAuthenticatedIcp4d = (state) => typeof getIcp4dBearerToken(state) === 'string';
const hasAuthenticatedToStreamsInstance = (state) => typeof getStreamsBearerToken(state) === 'string';

const getRememberPassword = createSelector(
  getBase,
  (base = Map()) => base.getIn(['rememberPassword'])
);

const getFormUsername = createSelector(
  getBase,
  (base = Map()) => base.getIn(['formData', 'username'])
);

const getFormPassword = createSelector(
  getBase,
  (base = Map()) => base.getIn(['formData', 'password'])
);

const getFormRememberPassword = createSelector(
  getBase,
  (base = Map()) => base.getIn(['formData', 'rememberPassword'])
);


/**
 * Base configuration and authentication state selectors
 */

const getUseIcp4dMasterNodeHost = createSelector(
  getBase,
  (base = Map()) => base.getIn(['useIcp4dMasterNodeHost'])
);

const getIcp4dUrl = createSelector(
  getBase,
  (base = Map()) => base.getIn(['icp4dUrl'])
);

const baseGetStreamsBuildRestUrl = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'streamsBuildRestUrl'])
);

const baseGetStreamsToolkitRestUrl = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'streamsToolkitRestUrl'])
);

const baseGetStreamsRestUrl = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'streamsRestUrl'])
);

const baseGetStreamsConsoleUrl = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'streamsConsoleUrl'])
);

const baseGetStreamsJmxUrl = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'streamsConsoleUrl'])
);

const getStreamsAccessTokenUrl = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'streamsAccessTokenUrl'])
);

const getStreamsBuildRestUrl = createSelector(
  getIcp4dUrl,
  getUseIcp4dMasterNodeHost,
  baseGetStreamsBuildRestUrl,
  getStreamsAccessTokenUrl,
  (icp4dUrlString, useIcp4dMasterNodeHost, buildRestUrlString, accessTokenUrlString) => {
    const buildRestUrl = normalizeCp4dEndpoint(icp4dUrlString, buildRestUrlString);
    return !accessTokenUrlString && useIcp4dMasterNodeHost ? makeUrlUseCp4dHost(icp4dUrlString, buildRestUrl) : buildRestUrl;
  }
);

const getStreamsToolkitRestUrl = createSelector(
  getIcp4dUrl,
  getUseIcp4dMasterNodeHost,
  baseGetStreamsToolkitRestUrl,
  getStreamsAccessTokenUrl,
  (icp4dUrlString, useIcp4dMasterNodeHost, toolkitRestUrlString, accessTokenUrlString) => {
    const toolkitRestUrl = normalizeCp4dEndpoint(icp4dUrlString, toolkitRestUrlString);
    return !accessTokenUrlString && useIcp4dMasterNodeHost ? makeUrlUseCp4dHost(icp4dUrlString, toolkitRestUrl) : toolkitRestUrl;
  }
);

const getStreamsRestUrl = createSelector(
  getIcp4dUrl,
  getUseIcp4dMasterNodeHost,
  baseGetStreamsRestUrl,
  getStreamsAccessTokenUrl,
  (icp4dUrlString, useIcp4dMasterNodeHost, streamsRestUrlString, accessTokenUrlString) => {
    const streamsRestUrl = normalizeCp4dEndpoint(icp4dUrlString, streamsRestUrlString);
    return !accessTokenUrlString && useIcp4dMasterNodeHost ? makeUrlUseCp4dHost(icp4dUrlString, streamsRestUrl) : streamsRestUrl;
  }
);

const getStreamsConsoleUrl = createSelector(
  getIcp4dUrl,
  getUseIcp4dMasterNodeHost,
  baseGetStreamsConsoleUrl,
  getStreamsAccessTokenUrl,
  (icp4dUrlString, useIcp4dMasterNodeHost, streamsConsoleUrlString, accessTokenUrlString) => {
    const streamsConsoleUrl = normalizeCp4dEndpoint(icp4dUrlString, streamsConsoleUrlString);
    return !accessTokenUrlString && useIcp4dMasterNodeHost ? makeUrlUseCp4dHost(icp4dUrlString, streamsConsoleUrl) : streamsConsoleUrl;
  }
);

const getStreamsJmxUrl = createSelector(
  getIcp4dUrl,
  getUseIcp4dMasterNodeHost,
  baseGetStreamsJmxUrl,
  getStreamsAccessTokenUrl,
  (icp4dUrlString, useIcp4dMasterNodeHost, streamsJmxUrlString, accessTokenUrlString) => {
    const streamsJmxUrl = normalizeCp4dEndpoint(icp4dUrlString, streamsJmxUrlString);
    return !accessTokenUrlString && useIcp4dMasterNodeHost ? makeUrlUseCp4dHost(icp4dUrlString, streamsJmxUrl) : streamsJmxUrl;
  }
);

const getStreamsInstancesRootRestUrl = createSelector(
  getBase,
  (base = Map()) => base.getIn(['selectedInstance', 'streamsInstancesRootRestUrl'])
);

const getStreamsRestResourcesUrl = createSelector(
  getStreamsInstancesRootRestUrl,
  (rootRestUrl = '') => {
    const resourcesUrl = `${rootRestUrl.substring(0, rootRestUrl.indexOf('/instances'))}/resources`;
    return resourcesUrl;
  }
);

const normalizeCp4dEndpoint = (cp4dUrl, url) => {
  if (typeof url === 'string' && url.startsWith('/') && typeof cp4dUrl === 'string') {
    return `${cp4dUrl.replace(/\/+$/, '')}/${url}`;
  }
  return url;
};

const makeUrlUseCp4dHost = (icp4dUrlString, endpointUrlString) => {
  try {
    const icp4dUrl = new URL(icp4dUrlString); /* eslint-disable-line compat/compat */
    const streamsRestUrl = new URL(endpointUrlString); /* eslint-disable-line compat/compat */
    streamsRestUrl.hostname = icp4dUrl.hostname;
    return streamsRestUrl.toString();
  } catch (err) {
    return endpointUrlString;
  }
};

export const connectionV5Selectors = {
  getActiveStreamsInstanceType,
  getSelectedInstance,
  getSelectedInstanceName,
  getServiceInstanceId,
  getStreamsInstances,
  getUsername,
  getRememberPassword,
  getLoginFormInitialized,
  getCurrentLoginStep,
  getFormUsername,
  getFormPassword,
  getFormRememberPassword,
  getIcp4dUrl,
  getIcp4dBearerToken,
  getIcp4dAuthError,
  getUseIcp4dMasterNodeHost,
  getStreamsRestUrl,
  getStreamsInstancesRootRestUrl,
  getStreamsRestResourcesUrl,
  getStreamsBuildRestUrl,
  getStreamsToolkitRestUrl,
  getStreamsConsoleUrl,
  getStreamsJmxUrl,
  getStreamsAccessTokenUrl,
  getStreamsBearerToken,
  getStreamsAuthError,

  hasAuthenticatedIcp4d,
  hasAuthenticatedToStreamsInstance
};
