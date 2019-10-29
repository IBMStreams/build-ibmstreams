'use babel';
'use strict';

import { combineReducers } from 'redux-immutable';
// import { combineReducers } from 'redux';
import { buildV5Reducer } from './build/v5';
import { submitV5Reducer } from './submit/v5';
import { connectionV5Reducer } from './connection/v5';
import { ideReducer } from './ide';

const rootReducer = combineReducers({
  buildV5: buildV5Reducer,
  submitV5: submitV5Reducer,
  connectionV5: connectionV5Reducer,
  ide: ideReducer
});

export default rootReducer;
