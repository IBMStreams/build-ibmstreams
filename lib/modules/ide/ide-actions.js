'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

export const packageActivated = () => ({
  type: actionTypes.PACKAGE_ACTIVATED
});

export const setBuildOriginator = (originator, version) => ({
  type: actionTypes.SET_BUILD_ORIGINATOR,
  originator,
  version
});

export const handleError = (sourceAction, error) => ({
  type: actionTypes.ERROR,
  sourceAction,
  error
});

export const queueAction = (queuedAction) => ({
  type: actionTypes.QUEUE_ACTION,
  queuedAction
});

export const clearQueuedAction = () => ({
  type: actionTypes.CLEAR_QUEUED_ACTION
});

export const setToolkitsCacheDir = (toolkitsCacheDir) => ({
  type: actionTypes.SET_TOOLKITS_CACHE_DIR,
  toolkitsCacheDir
});

export const setToolkitsPathSetting = (toolkitsPathSetting) => ({
  type: actionTypes.SET_TOOLKITS_PATH_SETTING,
  toolkitsPathSetting
});

export const openStreamsConsole = () => ({
  type: actionTypes.OPEN_STREAMS_CONSOLE
});

export const actionTypes = {
  PACKAGE_ACTIVATED: 'PACKAGE_ACTIVATED',
  POST_PACKAGE_ACTIVATED: 'POST_PACKAGE_ACTIVATED',
  SET_BUILD_ORIGINATOR: 'SET_BUILD_ORIGINATOR',
  ERROR: 'ERROR',
  POST_ERROR: 'POST_ERROR',
  QUEUE_ACTION: 'QUEUE_ACTION',
  CLEAR_QUEUED_ACTION: 'CLEAR_QUEUED_ACTION',
  SET_TOOLKITS_CACHE_DIR: 'SET_TOOLKITS_CACHE_DIR',
  SET_TOOLKITS_PATH_SETTING: 'SET_TOOLKITS_PATH_SETTING',
  OPEN_STREAMS_CONSOLE: 'OPEN_STREAMS_CONSOLE',
  POST_OPEN_STREAMS_CONSOLE: 'POST_OPEN_STREAMS_CONSOLE',
};
