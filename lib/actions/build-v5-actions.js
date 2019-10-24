'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */


export const startBuild = (buildId) => ({
  type: actions.START_BUILD,
  buildId
});

export const newBuild = ({
  appRoot,
  toolkitRootPath,
  fqn,
  makefilePath,
  postBuildAction
}) => ({
  type: actions.NEW_BUILD,
  appRoot,
  toolkitRootPath,
  fqn,
  makefilePath,
  postBuildAction
});

export const uploadSource = (
  buildId,
  appRoot,
  toolkitRootPath,
  fqn,
  makefilePath
) => ({
  type: actions.BUILD_UPLOAD_SOURCE,
  buildId,
  appRoot,
  toolkitRootPath,
  fqn,
  makefilePath
});

export const getBuildStatus = (buildId) => ({
  type: actions.GET_BUILD_STATUS,
  buildId
});

export const logBuildStatus = (buildId) => ({
  type: actions.LOG_BUILD_STATUS,
  buildId
});

export const getBuildStatusFulfilled = (buildStatusResponse) => ({
  type: actions.GET_BUILD_STATUS_FULFILLED,
  ...buildStatusResponse
});

export const getBuildLogMessagesFulfilled = (buildLogMessagesResponse) => ({
  type: actions.GET_BUILD_LOG_MESSAGES_FULFILLED,
  ...buildLogMessagesResponse
});

export const buildSucceeded = (buildId) => ({
  type: actions.BUILD_SUCCESS,
  buildId
});

export const buildFailed = (buildId) => ({
  type: actions.BUILD_FAILED,
  buildId
});

export const buildInProgress = (buildId) => ({
  type: actions.BUILD_IN_PROGRESS,
  buildId
});

export const buildStatusReceived = (buildId) => ({
  type: actions.BUILD_STATUS_RECEIVED,
  buildId
});

export const getBuildArtifacts = (buildId) => ({
  type: actions.GET_BUILD_ARTIFACTS,
  buildId
});

export const getBuildArtifactsFulfilled = (buildId, artifacts) => ({
  type: actions.GET_BUILD_ARTIFACTS_FULFILLED,
  buildId,
  artifacts
});

export const downloadBuildArtifacts = (buildId) => ({
  type: actions.DOWNLOAD_BUILD_ARTIFACTS,
  buildId
});

export const refreshToolkits = () => ({
  type: actions.REFRESH_TOOLKITS
});

export const actions = {
  NEW_BUILD: 'NEW_BUILD',
  START_BUILD: 'START_BUILD',
  BUILD_UPLOAD_SOURCE: 'BUILD_UPLOAD_SOURCE',
  SOURCE_ARCHIVE_CREATED: 'SOURCE_ARCHIVE_CREATED',

  GET_BUILD_STATUS: 'GET_BUILD_STATUS',
  GET_BUILD_STATUS_FULFILLED: 'GET_BUILD_STATUS_FULFILLED',
  GET_BUILD_LOG_MESSAGES_FULFILLED: 'GET_BUILD_LOG_MESSAGES_FULFILLED',
  LOG_BUILD_STATUS: 'LOG_BUILD_STATUS',
  BUILD_SUCCESS: 'BUILD_SUCCESS',
  BUILD_FAILED: 'BUILD_FAILED',
  BUILD_IN_PROGRESS: 'BUILD_IN_PROGRESS',
  BUILD_STATUS_RECEIVED: 'BUILD_STATUS_RECEIVED',
  GET_BUILD_ARTIFACTS: 'GET_BUILD_ARTIFACTS',
  GET_BUILD_ARTIFACTS_FULFILLED: 'GET_BUILD_ARTIFACTS_FULFILLED',
  POST_GET_BUILD_ARTIFACTS_FULFILLED: 'POST_GET_BUILD_ARTIFACTS_FULFILLED',
  DOWNLOAD_BUILD_ARTIFACTS: 'DOWNLOAD_BUILD_ARTIFACTS',
  POST_DOWNLOAD_BUILD_ARTIFACTS: 'POST_DOWNLOAD_BUILD_ARTIFACTS',
  REFRESH_TOOLKITS: 'REFRESH_TOOLKITS',
  POST_REFRESH_TOOLKITS: 'POST_REFRESH_TOOLKITS',
};
