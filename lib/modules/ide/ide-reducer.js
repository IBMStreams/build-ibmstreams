'use babel';
'use strict';

import { Map } from 'immutable';
import { actionTypes } from './ide-actions';

const ideReducer = (state = Map(), action) => {
  switch (action.type) {
    case actionTypes.SET_BUILD_ORIGINATOR:
      return state.setIn(['buildOriginator'], `${action.originator}::${action.version}`);
    case actionTypes.PACKAGE_ACTIVATED:
      return state.setIn(['packageActivated'], true);
    case actionTypes.QUEUE_ACTION:
      return state.setIn(['queuedAction'], action.queuedAction);
    case actionTypes.CLEAR_QUEUED_ACTION:
      return state.removeIn(['queuedAction']);
    case actionTypes.SET_TOOLKITS_CACHE_DIR:
      return state.setIn(['toolkitsCacheDir'], action.toolkitsCacheDir);
    case actionTypes.SET_TOOLKITS_PATH_SETTING:
      return state.setIn(['toolkitsPathSetting'], action.toolkitsPathSetting);
    default:
      return state;
  }
};

export default ideReducer;
