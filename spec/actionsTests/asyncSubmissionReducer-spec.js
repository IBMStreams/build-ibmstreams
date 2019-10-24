'use babel';

import * as _ from 'lodash';
import * as actions from '../../lib/actions/index';
import rootReducer from '../../lib/reducers/index';


describe('async submission reducers', () => {
  let state = {
    streamsV5Build: {
      selectedInstance: {
        instanceName: 'test'
      }
    }
  };
  let action;
  let expectedState = {
    streamsV5Build: {
      selectedInstance: {
        instanceName: 'test'
      }
    }
  };
  it('should handle SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES', () => {
    action = {
      type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
      bundles: '001'
    };
    state = rootReducer(state, action);
    expectedState = {
      streamsV5Build: {
        ...expectedState.streamsV5Build,
        submissions: {
          ...expectedState.streamsV5Build.submissions,
          [expectedState.streamsV5Build.selectedInstance.instanceName]: {
            ...(expectedState.streamsV5Build.submissions && expectedState.streamsV5Build.submissions[expectedState.streamsV5Build.selectedInstance.instanceName]),
          }
        }
      }
    };
    expect(state).toEqual(expectedState);
  });
  it('should handle GET_SUBMIT_STATUS_FULFILLED', () => {
    const submitStatusResponse = {
      status: 'test',
      id: '001'
    };
    action = {
      type: actions.actions.GET_SUBMIT_STATUS_FULFILLED,
      ...submitStatusResponse
    };
    state = rootReducer(state, action);
    expectedState = {
      streamsV5Build: {
        ...expectedState.streamsV5Build,
        submissions: {
          ...expectedState.streamsV5Build.submissions,
          [expectedState.streamsV5Build.selectedInstance.instanceName]: {
            ...(expectedState.streamsV5Build.submissions && expectedState.streamsV5Build.submissions[expectedState.streamsV5Build.selectedInstance.instanceName]),
            [action.id]: {
              ...expectedState.streamsV5Build.submissions[expectedState.streamsV5Build.selectedInstance.instanceName][action.id],
              status: action.status
            }
          }
        }
      }
    };
    expect(state).toEqual(expectedState);
  });
  it('should handle GET_SUBMIT_LOG_MESSAGES_FULFILLED', () => {
    const submitLogMessagesResponse = {
      id: '001',
      logMessages: ['test', 'test2']
    };
    action = {
      type: actions.actions.GET_SUBMIT_LOG_MESSAGES_FULFILLED,
      ...submitLogMessagesResponse
    };
    state = rootReducer(state, action);
    expectedState = {
      streamsV5Build: {
        ...expectedState.streamsV5Build,
        submissions: {
          ...expectedState.streamsV5Build.submissions,
          [expectedState.streamsV5Build.selectedInstance.instanceName]: {
            ...(expectedState.streamsV5Build.submissions && expectedState.streamsV5Build.submissions[expectedState.streamsV5Build.selectedInstance.instanceName]),
            [action.id]: {
              ...expectedState.streamsV5Build.submissions[expectedState.streamsV5Build.selectedInstance.instanceName][action.id],
              logMessages: action.logMessages
            }
          }
        }
      }
    };
    expect(state).toEqual(expectedState);
  });
});
