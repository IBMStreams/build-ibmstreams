'use babel';

import * as actions from '../../lib/actions/index';

describe('Actions', () => {
  let expectedOutput;
  // Clone this describe block to add new test
  describe('setIcp4dUrl', () => {
    it('should create an action to set the Icp4d URL', () => {
      const icp4dUrl = 'test';
      expectedOutput = {
        type: actions.actions.SET_ICP4D_URL,
        icp4dUrl
      };
      expect(actions.setIcp4dUrl(icp4dUrl)).toEqual(expectedOutput);
    });
  });
  describe('setUseIcp4dMasterNodeHost', () => {
    it('should create an action to set a boolean to use Icp4d master node host', () => {
      const useIcp4dMasterNodeHost = true;
      expectedOutput = {
        type: actions.actions.SET_USE_ICP4D_MASTER_NODE_HOST,
        useIcp4dMasterNodeHost
      };
      expect(actions.setUseIcp4dMasterNodeHost(useIcp4dMasterNodeHost)).toEqual(expectedOutput);
    });
  });
  describe('setCurrentLoginStep', () => {
    it('should create an action to set the current login step', () => {
      const currentLoginStep = 1;
      expectedOutput = {
        type: actions.actions.SET_CURRENT_LOGIN_STEP,
        currentLoginStep
      };
      expect(actions.setCurrentLoginStep(currentLoginStep)).toEqual(expectedOutput);
    });
  });
  describe('setUsername', () => {
    it('should create an action to set the username', () => {
      const username = 'test';
      expectedOutput = {
        type: actions.actions.SET_USERNAME,
        username
      };
      expect(actions.setUsername(username)).toEqual(expectedOutput);
    });
  });
  describe('setPassword', () => {
    it('should create an action to set the password', () => {
      const password = 'test';
      expectedOutput = {
        type: actions.actions.SET_PASSWORD,
        password
      };
      expect(actions.setPassword(password)).toEqual(expectedOutput);
    });
  });
  describe('setRememberPassword', () => {
    it('should create an action to set the remember password option', () => {
      const rememberPassword = true;
      expectedOutput = {
        type: actions.actions.SET_REMEMBER_PASSWORD,
        rememberPassword
      };
      expect(actions.setRememberPassword(rememberPassword)).toEqual(expectedOutput);
    });
  });
  describe('setFormDataField', () => {
    it('should create an action to set the key and value', () => {
      const key = 'test';
      const value = 'test2';
      expectedOutput = {
        type: actions.actions.SET_FORM_DATA_FIELD,
        key,
        value
      };
      expect(actions.setFormDataField(key, value)).toEqual(expectedOutput);
    });
  });
  describe('setBuildOriginator', () => {
    it('should create an action to set the originator and version', () => {
      const originator = 'test';
      const version = '1.2.3';
      expectedOutput = {
        type: actions.actions.SET_BUILD_ORIGINATOR,
        originator,
        version
      };
      expect(actions.setBuildOriginator(originator, version)).toEqual(expectedOutput);
    });
  });
  describe('queueAction', () => {
    it('should create an action to set the queue action', () => {
      const queuedAction = { type: 'test' };
      expectedOutput = {
        type: actions.actions.QUEUE_ACTION,
        queuedAction
      };
      expect(actions.queueAction(queuedAction)).toEqual(expectedOutput);
    });
  });
  describe('checkHostExists', () => {
    it('should create an action to set the successFn and errorFn', () => {
      const successFn = () => {};
      const errorFn = () => {};
      expectedOutput = {
        type: actions.actions.CHECK_HOST_EXISTS,
        successFn,
        errorFn
      };
      expect(actions.checkHostExists(successFn, errorFn)).toEqual(expectedOutput);
    });
  });
  describe('authenticateIcp4d', () => {
    it('should create an action to authenticate the username, password and rememberPassword', () => {
      const username = 'test';
      const password = 'test2';
      const rememberPassword = false;
      expectedOutput = {
        type: actions.actions.AUTHENTICATE_ICP4D,
        username,
        password,
        rememberPassword
      };
      expect(actions.authenticateIcp4d(username, password, rememberPassword)).toEqual(expectedOutput);
    });
  });
  describe('authenticateIcp4dStreamsInstance', () => {
    it('should create an action to authenticate the streams instance name', () => {
      const instanceName = 'test';
      expectedOutput = {
        type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
        instanceName
      };
      expect(actions.authenticateIcp4dStreamsInstance(instanceName)).toEqual(expectedOutput);
    });
  });
  describe('setStreamsInstances', () => {
    it('should create an action to set the streams instances', () => {
      const streamsInstances = [{ name: 'test' }];
      expectedOutput = {
        type: actions.actions.SET_STREAMS_INSTANCES,
        streamsInstances
      };
      expect(actions.setStreamsInstances(streamsInstances)).toEqual(expectedOutput);
    });
  });
  describe('setSelectedInstance', () => {
    it('should create an action to set the selected streams instance', () => {
      const streamsInstance = { name: 'test' };
      expectedOutput = {
        type: actions.actions.SET_SELECTED_INSTANCE,
        ...streamsInstance,
        currentLoginStep: 3
      };
      expect(actions.setSelectedInstance(streamsInstance)).toEqual(expectedOutput);
    });
  });
  describe('setIcp4dAuthToken', () => {
    it('should create an action to set the icp4d auth token', () => {
      const authToken = 'test';
      expectedOutput = {
        type: actions.actions.SET_ICP4D_AUTH_TOKEN,
        authToken,
        currentLoginStep: 2
      };
      expect(actions.setIcp4dAuthToken(authToken)).toEqual(expectedOutput);
    });
  });
  describe('setIcp4dAuthError', () => {
    it('should create an action to set the icp4d auth error', () => {
      const authError = 'test';
      expectedOutput = {
        type: actions.actions.SET_ICP4D_AUTH_ERROR,
        authError
      };
      expect(actions.setIcp4dAuthError(authError)).toEqual(expectedOutput);
    });
  });
  describe('setStreamsAuthToken', () => {
    it('should create an action to set the streams auth token', () => {
      const authToken = 'test';
      expectedOutput = {
        type: actions.actions.SET_STREAMS_AUTH_TOKEN,
        authToken
      };
      expect(actions.setStreamsAuthToken(authToken)).toEqual(expectedOutput);
    });
  });
  describe('setStreamsAuthError', () => {
    it('should create an action to set the streams auth error', () => {
      const authError = 'test';
      expectedOutput = {
        type: actions.actions.SET_STREAMS_AUTH_ERROR,
        authError
      };
      expect(actions.setStreamsAuthError(authError)).toEqual(expectedOutput);
    });
  });
  describe('startBuild', () => {
    it('should create an action to start the build', () => {
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.START_BUILD,
        buildId
      };
      expect(actions.startBuild(buildId)).toEqual(expectedOutput);
    });
  });
  describe('newBuild', () => {
    it('should create an action to start a new build', () => {
      const appRoot = './...';
      const toolkitRootPath = '/toolkits';
      const fqn = 'test';
      const makefilePath = '/makefile';
      const postBuildAction = { type: 'test' };
      expectedOutput = {
        type: actions.actions.NEW_BUILD,
        appRoot,
        toolkitRootPath,
        fqn,
        makefilePath,
        postBuildAction
      };
      expect(actions.newBuild({
        appRoot, toolkitRootPath, fqn, makefilePath, postBuildAction
      })).toEqual(expectedOutput);
    });
  });
  describe('uploadSource', () => {
    it('should create an action to upload the source', () => {
      const appRoot = './...';
      const toolkitRootPath = '/toolkits';
      const fqn = 'test';
      const makefilePath = '/makefile';
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.BUILD_UPLOAD_SOURCE,
        buildId,
        appRoot,
        toolkitRootPath,
        fqn,
        makefilePath
      };
      expect(actions.uploadSource(buildId, appRoot, toolkitRootPath, fqn, makefilePath)).toEqual(expectedOutput);
    });
  });
  describe('getBuildStatus', () => {
    it('should create an action to get the build status', () => {
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.GET_BUILD_STATUS,
        buildId
      };
      expect(actions.getBuildStatus(buildId)).toEqual(expectedOutput);
    });
  });
  describe('logBuildStatus', () => {
    it('should create an action to log the build status', () => {
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.LOG_BUILD_STATUS,
        buildId
      };
      expect(actions.logBuildStatus(buildId)).toEqual(expectedOutput);
    });
  });
  describe('getBuildStatusFulfilled', () => {
    it('should create an action to get the build status fulfilled', () => {
      const buildStatusResponse = { test: 'test' };
      expectedOutput = {
        type: actions.actions.GET_BUILD_STATUS_FULFILLED,
        ...buildStatusResponse
      };
      expect(actions.getBuildStatusFulfilled(buildStatusResponse)).toEqual(expectedOutput);
    });
  });
  describe('getBuildLogMessagesFulfilled', () => {
    it('should create an action to get the build log message fulfilled', () => {
      const buildLogMessagesResponse = { message: 'test' };
      expectedOutput = {
        type: actions.actions.GET_BUILD_LOG_MESSAGES_FULFILLED,
        ...buildLogMessagesResponse
      };
      expect(actions.getBuildLogMessagesFulfilled(buildLogMessagesResponse)).toEqual(expectedOutput);
    });
  });
  describe('buildSucceeded', () => {
    it('should create an action to inform that the build succeeded', () => {
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.BUILD_SUCCESS,
        buildId
      };
      expect(actions.buildSucceeded(buildId)).toEqual(expectedOutput);
    });
  });
  describe('buildFailed', () => {
    it('should create an action to inform that the build failed', () => {
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.BUILD_FAILED,
        buildId
      };
      expect(actions.buildFailed(buildId)).toEqual(expectedOutput);
    });
  });
  describe('buildInProgress', () => {
    it('should create an action to infrom that the build is in progress', () => {
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.BUILD_IN_PROGRESS,
        buildId
      };
      expect(actions.buildInProgress(buildId)).toEqual(expectedOutput);
    });
  });
  describe('buildStatusReceived', () => {
    it('should create an action to inform that the build status was received', () => {
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.BUILD_STATUS_RECEIVED,
        buildId
      };
      expect(actions.buildStatusReceived(buildId)).toEqual(expectedOutput);
    });
  });
  describe('getBuildArtifacts', () => {
    it('should create an action to get the build artifacts', () => {
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.GET_BUILD_ARTIFACTS,
        buildId
      };
      expect(actions.getBuildArtifacts(buildId)).toEqual(expectedOutput);
    });
  });
  describe('getBuildArtifactsFulfilled', () => {
    it('should create an action to get the build artifacts fulfilled', () => {
      const buildId = '001';
      const artifacts = ['test'];
      expectedOutput = {
        type: actions.actions.GET_BUILD_ARTIFACTS_FULFILLED,
        buildId,
        artifacts
      };
      expect(actions.getBuildArtifactsFulfilled(buildId, artifacts)).toEqual(expectedOutput);
    });
  });
  describe('downloadBuildArtifacts', () => {
    it('should create an action to download the application bundles', () => {
      const buildId = '001';
      expectedOutput = {
        type: actions.actions.DOWNLOAD_BUILD_ARTIFACTS,
        buildId
      };
      expect(actions.downloadBuildArtifacts(buildId)).toEqual(expectedOutput);
    });
  });
  describe('submitApplications', () => {
    it('should create an action to submit the applications', () => {
      const buildId = '001';
      const fromArtifact = 'test';
      expectedOutput = {
        type: actions.actions.SUBMIT_APPLICATIONS,
        buildId,
        fromArtifact
      };
      expect(actions.submitApplications(buildId, fromArtifact)).toEqual(expectedOutput);
    });
  });
  describe('submitApplicationsFromBundleFiles', () => {
    it('should create an action to submit the applications from the bundle files', () => {
      const bundles = ['test', 'test2'];
      expectedOutput = {
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles
      };
      expect(actions.submitApplicationsFromBundleFiles(bundles)).toEqual(expectedOutput);
    });
  });
  describe('setToolkitsCacheDir', () => {
    it('should create an action to set the toolkits cache directory', () => {
      const toolkitsCacheDir = '/toolkitsCache';
      expectedOutput = {
        type: actions.actions.SET_TOOLKITS_CACHE_DIR,
        toolkitsCacheDir
      };
      expect(actions.setToolkitsCacheDir(toolkitsCacheDir)).toEqual(expectedOutput);
    });
  });
  describe('setToolkitsPathSetting', () => {
    it('should create an action to set the toolkits path setting', () => {
      const toolkitsPathSetting = '/toolkits';
      expectedOutput = {
        type: actions.actions.SET_TOOLKITS_PATH_SETTING,
        toolkitsPathSetting
      };
      expect(actions.setToolkitsPathSetting(toolkitsPathSetting)).toEqual(expectedOutput);
    });
  });
  describe('handleError', () => {
    it('should create an action to handle an error', () => {
      const sourceAction = { type: 'test' };
      const error = 'testing';
      expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction,
        error
      };
      expect(actions.handleError(sourceAction, error)).toEqual(expectedOutput);
    });
  });
});
