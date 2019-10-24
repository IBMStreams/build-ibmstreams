'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

export const packageActivated = () => ({
  type: actions.PACKAGE_ACTIVATED
});

export const setBuildOriginator = (originator, version) => ({
  type: actions.SET_BUILD_ORIGINATOR,
  originator,
  version
});

export const handleError = (sourceAction, error) => ({
  type: actions.ERROR,
  sourceAction,
  error
});

export const queueAction = (queuedAction) => ({
  type: actions.QUEUE_ACTION,
  queuedAction
});

export const clearQueuedAction = () => ({
  type: actions.CLEAR_QUEUED_ACTION
});

export const setToolkitsCacheDir = (toolkitsCacheDir) => ({
  type: actions.SET_TOOLKITS_CACHE_DIR,
  toolkitsCacheDir
});

export const setToolkitsPathSetting = (toolkitsPathSetting) => ({
  type: actions.SET_TOOLKITS_PATH_SETTING,
  toolkitsPathSetting
});

export const openStreamsConsole = () => ({
  type: actions.OPEN_STREAMS_CONSOLE
});

export const actions = {
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
