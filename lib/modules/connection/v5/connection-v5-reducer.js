'use babel';
'use strict';

import {
  Map,
  fromJS,
  setIn,
  merge,
} from 'immutable';
import { actionTypes } from './connection-v5-actions';

const connectionV5Reducer = (state = Map(), action) => {
  switch (action.type) {
    case actionTypes.SET_ACTIVE_STREAMS_INSTANCE_TYPE:
      return setIn(state, ['activeStreamsInstanceType'], action.instanceType);
    case actionTypes.SET_ICP4D_URL:
      return setIn(state, ['icp4dUrl'], action.icp4dUrl);
    case actionTypes.SET_USE_ICP4D_MASTER_NODE_HOST:
      return setIn(state, ['useIcp4dMasterNodeHost'], action.useIcp4dMasterNodeHost);
    case actionTypes.SET_STREAMS_BUILD_URL:
      return state.setIn(['selectedInstance', 'streamsBuildRestUrl'], action.url)
        .setIn(['selectedInstance', 'streamsToolkitRestUrl'], action.toolkitUrl);
    case actionTypes.SET_STREAMS_INSTANCES_ROOT_REST_URL:
      return setIn(state, ['selectedInstance', 'streamsInstancesRootRestUrl'], action.url);
    case actionTypes.SET_STREAMS_REST_URL:
      return setIn(state, ['selectedInstance', 'streamsRestUrl'], action.url);
    case actionTypes.SET_STREAMS_ACCESS_TOKEN_URL:
      return setIn(state, ['selectedInstance', 'streamsAccessTokenUrl'], action.url);
    case actionTypes.SET_CURRENT_LOGIN_STEP:
      return setIn(state, ['currentLoginStep'], action.currentLoginStep);
    case actionTypes.SET_USERNAME:
      return setIn(state, ['formData', 'username'], action.username);
    case actionTypes.SET_PASSWORD:
      return setIn(state, ['formData', 'password'], action.password);
    case actionTypes.SET_REMEMBER_PASSWORD:
      return setIn(state, ['formData', 'rememberPassword'], action.rememberPassword);
    case actionTypes.SET_FORM_DATA_FIELD:
      return setIn(state, ['formData', action.key], action.value);
    case actionTypes.AUTHENTICATE_ICP4D:
      return merge(state, { username: action.username, rememberPassword: action.rememberPassword });
    case actionTypes.SET_STREAMS_INSTANCES:
      return setIn(state, ['streamsInstances'], fromJS(action.streamsInstances));
    case actionTypes.SET_SELECTED_CP4D_STREAMS_INSTANCE:
      return state
        .set('currentLoginStep', action.currentLoginStep)
        .setIn(['selectedInstance'], action.selectedCp4dStreamsInstance);
    case actionTypes.SET_ICP4D_AUTH_TOKEN:
      return state.merge({ icp4dAuthToken: action.authToken, currentLoginStep: action.currentLoginStep });
    case actionTypes.SET_ICP4D_AUTH_ERROR:
      return state.set('icp4dAuthError', action.authError).remove('formData');
    case actionTypes.SET_STREAMS_AUTH_TOKEN: {
      if (action.authToken.accessToken) {
        return setIn(state, ['selectedInstance', 'streamsAuthToken'], action.authToken.accessToken).set('currentLoginStep', 3);
      }
      return setIn(state, ['selectedInstance', 'streamsAuthToken'], action.authToken);
    }
    case actionTypes.SET_STREAMS_AUTH_ERROR:
      return setIn(state, ['streamsAuthError'], action.authError);
    case actionTypes.RESET_AUTH:
      return state
        .removeAll([
          'currentLoginStep',
          'icp4dAuthToken',
          'icp4dAuthError',
          'streamsInstances',
          'streamsAuthError',
          'username'
        ])
        .set('currentLoginStep', 1);
    default:
      return state;
  }
};

export default connectionV5Reducer;
