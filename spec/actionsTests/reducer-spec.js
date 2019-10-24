'use babel';

import { omit as _omit } from 'lodash';
import * as actions from '../../lib/actions/index';
import rootReducer from '../../lib/reducers/index';


describe('reducer', () => {
  describe('default', () => {
    it('should return the initial state', () => {
      expect(rootReducer(undefined, {})).toEqual({ streamsV5Build: [] });
    });
  });
  describe('actions', () => {
    let state;
    let action;
    let expectedState;
    it('should handle SET_BUILD_ORIGINATOR', () => {
      action = {
        type: actions.actions.SET_BUILD_ORIGINATOR,
        originator: 'test',
        version: '1.2.3'
      };
      state = rootReducer(undefined, action);
      expectedState = { streamsV5Build: { buildOriginator: `${action.originator}::${action.version}` } };
      expect(state).toEqual(expectedState);
    });
    it('should handle PACKAGE_ACTIVATED', () => {
      action = {
        type: actions.actions.PACKAGE_ACTIVATED,
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, packageActivated: true } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_ICP4D_URL', () => {
      action = {
        type: actions.actions.SET_ICP4D_URL,
        icp4dUrl: '/test/test/'
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, icp4dUrl: action.icp4dUrl } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_USE_ICP4D_MASTER_NODE_HOST', () => {
      action = {
        type: actions.actions.SET_USE_ICP4D_MASTER_NODE_HOST,
        useIcp4dMasterNodeHost: true
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, useIcp4dMasterNodeHost: action.useIcp4dMasterNodeHost } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_CURRENT_LOGIN_STEP', () => {
      action = {
        type: actions.actions.SET_CURRENT_LOGIN_STEP,
        currentLoginStep: 1
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, currentLoginStep: action.currentLoginStep } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_USERNAME', () => {
      action = {
        type: actions.actions.SET_USERNAME,
        username: 'testUser'
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, formData: { ...expectedState.streamsV5Build.formData, username: action.username } } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_PASSWORD', () => {
      action = {
        type: actions.actions.SET_PASSWORD,
        password: 'testPass'
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, formData: { ...expectedState.streamsV5Build.formData, password: action.password } } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_REMEMBER_PASSWORD', () => {
      action = {
        type: actions.actions.SET_REMEMBER_PASSWORD,
        rememberPassword: true
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, formData: { ...expectedState.streamsV5Build.formData, rememberPassword: action.rememberPassword } } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_FORM_DATA_FIELD', () => {
      action = {
        type: actions.actions.SET_FORM_DATA_FIELD,
        key: 'username',
        value: 'testUserChanged'
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, formData: { ...expectedState.streamsV5Build.formData, [action.key]: action.value } } };
      expect(state).toEqual(expectedState);
    });
    it('should handle QUEUE_ACTION', () => {
      action = {
        type: actions.actions.QUEUE_ACTION,
        queuedAction: { type: 'test', test: 'test' }
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, queuedAction: action.queuedAction } };
      expect(state).toEqual(expectedState);
    });
    it('should handle CLEAR_QUEUED_ACTION', () => {
      action = {
        type: actions.actions.CLEAR_QUEUED_ACTION
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, queuedAction: null } };
      expect(state).toEqual(expectedState);
    });
    it('should handle AUTHENTICATE_ICP4D', () => {
      action = {
        type: actions.actions.AUTHENTICATE_ICP4D,
        username: 'testUser',
        password: 'testPass',
        rememberPassword: false
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, username: action.username, rememberPassword: false } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_STREAMS_INSTANCES', () => {
      action = {
        type: actions.actions.SET_STREAMS_INSTANCES,
        streamsInstances: [{ ID: 'test' }]
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, streamsInstances: action.streamsInstances } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_SELECTED_INSTANCE', () => {
      const streamsInstance = {
        ID: '001',
        ServiceInstanceDisplayName: 'test',
        ServiceInstanceVersion: '1.2.3',
        CreateArguments: {
          'connection-info': {
            externalRestEndpoint: 'testRest',
            externalBuildEndpoint: 'testBuild',
            externalConsoleEndpoint: 'testConsole',
            externalJmxEndpoint: 'testJmx'
          }
        }
      };
      action = {
        type: actions.actions.SET_SELECTED_INSTANCE,
        ...streamsInstance,
        currentLoginStep: 3
      };
      state = rootReducer(state, action);
      expectedState = {
        streamsV5Build: {
          ...expectedState.streamsV5Build,
          currentLoginStep: 3,
          selectedInstance: {
            serviceInstanceId: action.ID,
            instanceName: action.ServiceInstanceDisplayName,
            serviceInstanceVersion: action.ServiceInstanceVersion,
            streamsRestUrl: action.CreateArguments['connection-info'].externalRestEndpoint,
            streamsBuildRestUrl: action.CreateArguments['connection-info'].externalBuildEndpoint,
            streamsConsoleUrl: action.CreateArguments['connection-info'].externalConsoleEndpoint,
            streamsJmxUrl: action.CreateArguments['connection-info'].externalJmxEndpoint
          }
        }
      };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_ICP4D_AUTH_TOKEN', () => {
      action = {
        type: actions.actions.SET_ICP4D_AUTH_TOKEN,
        authToken: { test: 'test' },
        currentLoginStep: 2
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, icp4dAuthToken: action.authToken, currentLoginStep: action.currentLoginStep } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_ICP4D_AUTH_ERROR', () => {
      action = {
        type: actions.actions.SET_ICP4D_AUTH_ERROR,
        authError: false
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, icp4dAuthError: action.authError, ...(!action.authError && { formData: {} }) } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_STREAMS_AUTH_TOKEN', () => {
      action = {
        type: actions.actions.SET_STREAMS_AUTH_TOKEN,
        authToken: { test: 'test' }
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, selectedInstance: { ...expectedState.streamsV5Build.selectedInstance, streamsAuthToken: action.authToken } } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_STREAMS_AUTH_ERROR', () => {
      action = {
        type: actions.actions.SET_STREAMS_AUTH_ERROR,
        authError: false
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, streamsAuthError: action.authError } };
      expect(state).toEqual(expectedState);
    });
    it('should handle RESET_AUTH', () => {
      action = {
        type: actions.actions.RESET_AUTH
      };
      const state2 = rootReducer(state, action);
      const expectedState2 = { streamsV5Build: { ..._omit(expectedState.streamsV5Build, ['currentLoginStep', 'icp4dAuthToken', 'icp4dAuthError', 'streamsInstances', 'selectedInstance', 'streamsAuthError', 'username']), currentLoginStep: 1 } };
      expect(state2).toEqual(expectedState2);
    });
    it('should handle NEW_BUILD', () => {
      action = {
        type: actions.actions.NEW_BUILD,
        appRoot: '/test/appRoot',
        toolkitRootPath: '/test/toolkits',
        fqn: 'test',
        makefilePath: '/test/makefile',
        postBuildAction: { type: 'test' }
      };
      state = rootReducer(state, action);
      expectedState = {
        streamsV5Build: {
          ...expectedState.streamsV5Build,
          builds: {
            ...expectedState.streamsV5Build.builds,
            [expectedState.streamsV5Build.selectedInstance.instanceName]: {
              ...(expectedState.streamsV5Build.builds && expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName]),
              newBuild: {
                appRoot: action.appRoot, toolkitRootPath: action.toolkitRootPath, fqn: action.fqn, makefilePath: action.makefilePath, postBuildAction: action.postBuildAction
              }
            }
          }
        }
      };
      expect(state).toEqual(expectedState);
    });
    it('should handle GET_BUILD_STATUS_FULFILLED', () => {
      const buildStatusResponse = {
        status: 'test',
        inactivityTimeout: 10000,
        lastActivityTime: 1000,
        submitCount: 1,
        buildId: '001'
      };
      action = {
        type: actions.actions.GET_BUILD_STATUS_FULFILLED,
        ...buildStatusResponse
      };
      state = rootReducer(state, action);
      expectedState = {
        streamsV5Build: {
          ...expectedState.streamsV5Build,
          builds: {
            ...expectedState.streamsV5Build.builds,
            [expectedState.streamsV5Build.selectedInstance.instanceName]: {
              ...(expectedState.streamsV5Build.builds && expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName]),
              [action.buildId]: {
                ...expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName][action.buildId],
                status: action.status,
                inactivityTimeout: action.inactivityTimeout,
                lastActivityTime: action.lastActivityTime,
                submitCount: action.submitCount,
                buildId: action.buildId
              }
            }
          }
        }
      };
      expect(state).toEqual(expectedState);
    });
    it('should handle GET_BUILD_LOG_MESSAGES_FULFILLED', () => {
      const buildLogMessagesResponse = {
        buildId: '001',
        logMessages: ['test', 'test2']
      };
      action = {
        type: actions.actions.GET_BUILD_LOG_MESSAGES_FULFILLED,
        ...buildLogMessagesResponse
      };
      state = rootReducer(state, action);
      expectedState = {
        streamsV5Build: {
          ...expectedState.streamsV5Build,
          builds: {
            ...expectedState.streamsV5Build.builds,
            [expectedState.streamsV5Build.selectedInstance.instanceName]: {
              ...(expectedState.streamsV5Build.builds && expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName]),
              [action.buildId]: {
                ...expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName][action.buildId],
                logMessages: action.logMessages
              }
            }
          }
        }
      };
      expect(state).toEqual(expectedState);
    });
    it('should handle BUILD_UPLOAD_SOURCE', () => {
      action = {
        type: actions.actions.BUILD_UPLOAD_SOURCE,
        buildId: '001',
        appRoot: '/test/appRoot',
        toolkitRootPath: '/test/toolkits',
        fqn: 'test',
        makefilePath: '/test/makefile'
      };
      state = rootReducer(state, action);
      expectedState = {
        streamsV5Build: {
          ...expectedState.streamsV5Build,
          builds: {
            ...expectedState.streamsV5Build.builds,
            [expectedState.streamsV5Build.selectedInstance.instanceName]: {
              ...(expectedState.streamsV5Build.builds && expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName]),
              [action.buildId]: {
                ...expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName][action.buildId],
                buildId: action.buildId,
                appRoot: expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName].newBuild.appRoot,
                toolkitRootPath: expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName].newBuild.toolkitRootPath,
                fqn: expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName].newBuild.fqn,
                makefilePath: expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName].newBuild.makefilePath,
                postBuildAction: expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName].newBuild.postBuildAction
              }
            }
          }
        }
      };
      expect(state).toEqual(expectedState);
    });
    it('should handle GET_BUILD_ARTIFACTS_FULFILLED', () => {
      action = {
        type: actions.actions.GET_BUILD_ARTIFACTS_FULFILLED,
        buildId: '001',
        artifacts: ['test']
      };
      state = rootReducer(state, action);
      expectedState = {
        streamsV5Build: {
          ...expectedState.streamsV5Build,
          builds: {
            ...expectedState.streamsV5Build.builds,
            [expectedState.streamsV5Build.selectedInstance.instanceName]: {
              ...(expectedState.streamsV5Build.builds && expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName]),
              [action.buildId]: {
                ...expectedState.streamsV5Build.builds[expectedState.streamsV5Build.selectedInstance.instanceName][action.buildId],
                artifacts: action.artifacts
              }
            }
          }
        }
      };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_TOOLKITS_CACHE_DIR', () => {
      action = {
        type: actions.actions.SET_TOOLKITS_CACHE_DIR,
        toolkitsCacheDir: '/test/toolkits'
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, toolkitsCacheDir: action.toolkitsCacheDir } };
      expect(state).toEqual(expectedState);
    });
    it('should handle SET_TOOLKITS_PATH_SETTING', () => {
      action = {
        type: actions.actions.SET_TOOLKITS_PATH_SETTING,
        toolkitsPathSetting: '/test/toolkits'
      };
      state = rootReducer(state, action);
      expectedState = { streamsV5Build: { ...expectedState.streamsV5Build, toolkitsPathSetting: action.toolkitsPathSetting } };
      expect(state).toEqual(expectedState);
    });
  });
});
