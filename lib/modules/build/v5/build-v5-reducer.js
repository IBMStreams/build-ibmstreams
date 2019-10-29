'use babel';
'use strict';

import {
  setIn, removeIn, Map, fromJS
} from 'immutable';

import { actionTypes } from './build-v5-actions';

const streamsV5BuildReducer = (state = Map(), action) => {
  switch (action.type) {
    case actionTypes.SET_BUILD_ORIGINATOR:
      return setIn(state, ['buildOriginator'], `${action.originator}::${action.version}`);
    case actionTypes.QUEUE_ACTION:
      return setIn(state, ['queuedAction'], action.queuedAction);
    case actionTypes.CLEAR_QUEUED_ACTION:
      return removeIn(state, ['queuedAction']);
    case actionTypes.NEW_BUILD: {
      const tempNewBuild = {
        appRoot: action.appRoot,
        toolkitRootPath: action.toolkitRootPath,
        fqn: action.fqn,
        makefilePath: action.makefilePath,
        postBuildAction: action.postBuildAction
      };
      return state.set('tempNewBuild', fromJS(tempNewBuild));
    }
    case actionTypes.GET_BUILD_STATUS_FULFILLED: {
      return state.updateIn(['builds', action.buildId], build => {
        return build.set('status', action.status)
          .set('inactivityTimeout', action.lastActivityTime)
          .set('lastActivityTime', action.lastActivityTime)
          .set('submitCount', action.submitCount)
          .set('buildId', action.buildId);
      });
    }
    case actionTypes.GET_BUILD_LOG_MESSAGES_FULFILLED:
      return setIn(state, ['builds', action.buildId, 'logMessages'], action.logMessages);
    case actionTypes.BUILD_UPLOAD_SOURCE: {
      return state.updateIn(['builds', action.buildId], build => {
        const buildObj = build || Map();
        return buildObj.set('buildId', action.buildId)
          .set('appRoot', state.getIn(['tempNewBuild', 'appRoot']))
          .set('toolkitRootPath', state.getIn(['tempNewBuild', 'toolkitRootPath']))
          .set('fqn', state.getIn(['tempNewBuild', 'fqn']))
          .set('makefilePath', state.getIn(['tempNewBuild', 'makefilePath']))
          .set('postBuildAction', state.getIn(['tempNewBuild', 'postBuildAction']));
      });
    }
    case actionTypes.GET_BUILD_ARTIFACTS_FULFILLED:
      return setIn(state, ['builds', action.buildId, 'artifacts'], action.artifacts);
    case actionTypes.SET_TOOLKITS_CACHE_DIR:
      return setIn(state, ['toolkitsCacheDir'], action.toolkitsCacheDir);
    case actionTypes.SET_TOOLKITS_PATH_SETTING:
      return setIn(state, ['toolkitsPathSetting'], action.toolkitsPathSetting);
    default:
      return state;
  }
};

export default streamsV5BuildReducer;
