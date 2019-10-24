'use babel';
'use strict';

import { get as _get, filter as _filter, find as _find } from 'lodash';
/* eslint-disable import/prefer-default-export */


const getBody = (response) => {
  const body = _get(response, 'body', {});
  if (body instanceof Buffer) {
    return JSON.parse(body.toString('utf8'));
  }
  if (typeof body === 'string') {
    try {
      const bodyJson = JSON.parse(body);
      return bodyJson;
    } catch (err) {
      // throw away syntax error
    }
  }
  if (body.messages && Array.isArray(body.messages)) {
    throw new Error(body.messages.map(entry => entry.message).join('\n'));
  }
  return body;
};

const getRequestObj = (response) => {
  const body = getBody(response);
  return _get(body, 'requestObj', {});
};

const getBuildId = (response) => {
  const body = getBody(response);
  let build = _get(body, 'build', null);
  if (build) {
    build = build.split('/').pop();
  }
  return build;
};

const getStatusCode = (response) => {
  return response.resp.statusCode;
};

const getIcp4dAuthToken = (response) => {
  const body = getBody(response);
  return _get(body, 'token', '');
};

const getStreamsAuthToken = (response) => {
  const body = getBody(response);
  return _get(body, 'AccessToken', '');
};

const getStreamsResources = (response) => {
  const body = getBody(response);
  return _get(body, 'resources', null);
};

const getAccessTokenUrl = (response) => {
  const resources = getStreamsResources(response);
  if (resources) {
    const accessTokenEndpoint = _find(resources, res => res.name === 'accessTokens');
    return accessTokenEndpoint ? accessTokenEndpoint.resource : null;
  }
  return null;
};

const getStandaloneAccessToken = (response) => {
  const body = getBody(response);
  return body;
};

const getStreamsInstances = (response) => {
  const requestObj = getRequestObj(response);
  return _filter(requestObj, instance => instance.ServiceInstanceType === 'streams');
};

const getSelectedInstance = (response, selectedInstanceName) => {
  const instances = getStreamsInstances(response);
  return instances.find(instance => instance.ServiceInstanceDisplayName === selectedInstanceName);
};

const getBuildStatus = (response) => {
  const body = getBody(response);
  const {
    id,
    creationTime,
    creationUser,
    lastActivityTime,
    name,
    processingStartTime,
    processingEndTime,
    status,
    submitCount
  } = body;
  return {
    buildId: id,
    creationTime,
    creationUser,
    lastActivityTime,
    name,
    processingStartTime,
    processingEndTime,
    status,
    submitCount
  };
};

const getSubmitStatus = (response) => {
  const body = getBody(response);
  const {
    id,
    status
  } = body;
  return {
    id,
    status
  };
};

const getBuildArtifacts = (response) => {
  const body = getBody(response);
  return _get(body, 'artifacts', []);
};

const getSubmitInfo = (response) => {
  const body = getBody(response);
  return body;
};

const getUploadedBundleId = (response) => {
  const body = getBody(response);
  return body.bundleId;
};

const getToolkits = (response) => {
  const body = getBody(response);
  return _get(body, 'toolkits', []);
};

const ResponseSelector = {
  getStatusCode,

  getIcp4dAuthToken,
  getStreamsAuthToken,
  getStreamsInstances,
  getSelectedInstance,
  getStreamsResources,
  getAccessTokenUrl,
  getStandaloneAccessToken,

  getBuildId,
  getBuildStatus,
  getBuildArtifacts,

  getUploadedBundleId,

  getSubmitInfo,
  getSubmitStatus,

  getToolkits,
};

export default ResponseSelector;
