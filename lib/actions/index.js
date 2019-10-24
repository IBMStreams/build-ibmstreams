'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

import { actions as ideActions } from './ide-actions';
import { actions as connectionsV5Actions } from './connection-v5-actions';
import { actions as buildV5Actions } from './build-v5-actions';
import { actions as submitV5Actions } from './submit-v5-actions';

export {
  packageActivated,
  setBuildOriginator,
  handleError,
  queueAction,
  clearQueuedAction,
  setToolkitsCacheDir,
  setToolkitsPathSetting,
  openStreamsConsole,
} from './ide-actions';

export {
  newBuild,
  startBuild,
  uploadSource,
  getBuildStatus,
  logBuildStatus,
  getBuildStatusFulfilled,
  getBuildLogMessagesFulfilled,
  buildSucceeded,
  buildFailed,
  buildInProgress,
  buildStatusReceived,
  getBuildArtifacts,
  getBuildArtifactsFulfilled,
  downloadBuildArtifacts,
  refreshToolkits,
} from './build-v5-actions';

export {
  setIcp4dUrl,
  setUseIcp4dMasterNodeHost,
  setStreamsBuildUrl,
  setStreamsRestUrl,
  checkHostExists,
  setCurrentLoginStep,
  setFormDataField,
  resetAuth,
  setIcp4dAuthError,
  setIcp4dAuthToken,
  setPassword,
  setRememberPassword,
  setUsername,
  setSelectedInstance,
  setStreamsAccessTokenUrl,
  setStreamsAuthError,
  setStreamsAuthToken,
  setStreamsInstances,
  authenticateIcp4d,
  authenticateIcp4dStreamsInstance,
} from './connection-v5-actions';

export {
  submitApplications,
  submitApplicationsFromBundleFiles,
  submitFromBundleWithParams,
  getSubmitStatus,
  getSubmitStatusFulfilled,
  getSubmitLogMessagesFulfilled,
  submitStatusReceived,
  getSubmissionTimeParamsFromAdl,
} from './submit-v5-actions';

export const actions = {
  ...ideActions,
  ...connectionsV5Actions,
  ...buildV5Actions,
  ...submitV5Actions,
};
