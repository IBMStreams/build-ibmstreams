'use babel';
'use strict';

import { combineEpics, ofType } from 'redux-observable';
import * as path from 'path';
import * as fs from 'fs';
import * as xmldoc from 'xmldoc';
import {
  defaultIfEmpty,
  map,
  mergeMap,
  tap,
  delay,
  withLatestFrom,
  catchError,
} from 'rxjs/operators';
import {
  from,
  zip,
  of,
  empty,
  merge,
  forkJoin
} from 'rxjs';
import getStore from '../redux-store/configure-store';

import {
  actions,

  handleError,

  authenticateIcp4d,
  authenticateStreamsInstance,

  clearQueuedAction,

  setStreamsInstances,
  setIcp4dAuthToken,
  setIcp4dAuthError,
  setStreamsAuthToken,
  setStreamsAuthError,

  getBuildArtifacts,
  getBuildArtifactsFulfilled,

  uploadSource,
  getBuildStatus,
  getBuildStatusFulfilled,
  getSubmitStatusFulfilled,
  getSubmitLogMessagesFulfilled,
  getSubmitStatus,
  submitStatusReceived,
  getBuildLogMessagesFulfilled,
  startBuild,
  buildStatusReceived,
  asyncSubmitApplications,
  submitFromBundleWithParams,

  refreshToolkits,
  setFormDataField,
} from '../actions';
import {
  StateSelector,
  ResponseSelector,
  StreamsRestUtils,
  SourceArchiveUtils,
  StatusUtils,
  StreamsToolkitsUtils,
  KeychainUtils,
  StreamsUtils
} from '../util';
import MessageHandlerRegistry from '../message-handler-registry';
import SubmissionTimeView from '../views/submissionTimeParam/submissionTimeParamView';


/**
 * Consumes a NEW_BUILD action, creates a new build in the build service,
 * and emits a BUILD_UPLOAD_SOURCE action.
 * @param {*} action
 * @param {*} state
 */
const buildAppEpic = (action, state) => action.pipe(
  ofType(actions.NEW_BUILD),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.build.create(s, { originator: 'atom', name: action.sourceArchive }).pipe(
    map(createBuildResponse => {
      const buildId = ResponseSelector.getBuildId(createBuildResponse);
      if (!buildId) {
        throw new Error('Unable to retrieve build id');
      }
      const newBuild = StateSelector.getNewBuild(s, buildId);
      return uploadSource(
        buildId,
        newBuild.appRoot,
        newBuild.toolkitRootPath,
        newBuild.fqn,
        newBuild.makefilePath
      );
    }),
    catchError(error => of(handleError(a, error)))
  )), catchError((error) => of(handleError(action, error)))
);

/**
 * Consumes a BUILD_UPLOAD_SOURCE action, generates source archive zip file,
 * and emits a SOURCE_ARCHIVE_CREATED action.
 * @param {*} action
 * @param {*} state
 */
const uploadSourceEpic = (action, state) => action.pipe(
  ofType(actions.BUILD_UPLOAD_SOURCE),
  withLatestFrom(state),
  mergeMap(([uploadAction, s]) => SourceArchiveUtils.buildSourceArchive({
    buildId: uploadAction.buildId,
    appRoot: uploadAction.appRoot,
    toolkitPathSetting: uploadAction.toolkitRootPath,
    toolkitCacheDir: StateSelector.getToolkitsCacheDir(s),
    fqn: uploadAction.fqn,
    makefilePath: uploadAction.makefilePath
  })),
  catchError(error => of(handleError(action, error)))
);

/**
 * Consumes SOURCE_ARCHIVE_CREATED action, uploads source archive to build service,
 * and emits a START_BUILD action
 * @param {*} action
 * @param {*} state
 */
const sourceArchiveCreatedEpic = (action, state) => {
  return action.pipe(
    ofType(actions.SOURCE_ARCHIVE_CREATED),
    withLatestFrom(state),
    mergeMap(([sourceArchiveResponse, s]) => StreamsRestUtils.build.uploadSource(s, sourceArchiveResponse.buildId, sourceArchiveResponse.archivePath).pipe(
      map((a) => startBuild(sourceArchiveResponse.buildId)),
      tap(() => {
        if (fs.existsSync(sourceArchiveResponse.archivePath)) {
          fs.unlinkSync(sourceArchiveResponse.archivePath);
        }
      }),
      catchError(error => of(handleError(sourceArchiveResponse, error)))
    )), catchError(error => of(handleError(action, error)))
  );
};

/**
 * Consumes START_BUILD action,
 * starts the build and emits an GET_BUILD_STATUS action
 * @param {*} action
 * @param {*} state
 */
const startBuildEpic = (action, state) => {
  return action.pipe(
    ofType(actions.START_BUILD),
    withLatestFrom(state),
    mergeMap(([a, s]) => StreamsRestUtils.build.start(s, a.buildId).pipe(
      delay(1000), // delay necessary to make sure the build is ready to be started
      map(() => getBuildStatus(a.buildId)),
      catchError(error => of(handleError(a, error)))
    )), catchError(error => of(handleError(action, error)))
  );
};

/**
 * This epic handles requests for build status updates,
 * fetches build status and build log messages for action.buildId;
 * waits for get build status and build log messages actions to complete
 * and emits set of 3 actions,
 * BUILD_STATUS_FULFILLED, BUILD_LOG_FULFILLED, and BUILD_STATUS_RECEIVED.
 * FULFILLED actions update the state, RECEIVED action handles UI updates
 * and build status check loop.
 * @param {*} action
 */
const buildStatusEpic = (action, state) => action.pipe(
  ofType(actions.GET_BUILD_STATUS),
  withLatestFrom(state),
  // get build status and build message log and wait for both to complete,
  // passes on [BUILD_STATUS_FULFILLED, BUILD_LOG_FULFILLED]
  mergeMap(([a, s]) => zip(
    StreamsRestUtils.build.getStatus(s, a.buildId).pipe(
      map(response => {
        const buildStatusResponse = ResponseSelector.getBuildStatus(response);
        if (buildStatusResponse instanceof Error) {
          throw buildStatusResponse;
        }
        return getBuildStatusFulfilled(buildStatusResponse);
      }),
      catchError(error => of(handleError(a, error)))
    ),
    StreamsRestUtils.build.getLogMessages(s, a.buildId).pipe(
      map(response => getBuildLogMessagesFulfilled({ buildId: a.buildId, logMessages: response.body.split('\n') })),
      catchError(error => of(handleError(a, error)))
    )
  )),
  // emit [BUILD_STATUS_FULFILLED, BUILD_LOG_FULFILLED, BUILD_STATUS_RECEIVED]
  mergeMap(([statusFulfilledAction, logFulfilledAction]) => [statusFulfilledAction, logFulfilledAction, buildStatusReceived(statusFulfilledAction.buildId)]),
  catchError(error => of(handleError(action, error)))
);

const submitStatusEpic = (action, state) => action.pipe(
  ofType(actions.GET_SUBMIT_STATUS),
  withLatestFrom(state),
  // get build status and build message log and wait for both to complete,
  // passes on [BUILD_STATUS_FULFILLED, BUILD_LOG_FULFILLED]
  mergeMap(([a, s]) => zip(
    StreamsRestUtils.asyncSubmissions.getJobSubmission(s, a.id).pipe(
      map(response => getSubmitStatusFulfilled(ResponseSelector.getSubmitStatus(response), a.identifier)),
      catchError(error => of(handleError(a, error)))
    ),
    StreamsRestUtils.asyncSubmissions.getSubmissionLogMessages(s, a.id).pipe(
      map(response => getSubmitLogMessagesFulfilled({ id: a.id, logMessages: response.body.split('\n') })),
      catchError(error => of(handleError(a, error)))
    )
  )),
  // emit [BUILD_STATUS_FULFILLED, BUILD_LOG_FULFILLED, BUILD_STATUS_RECEIVED]
  mergeMap(([statusFulfilledAction, logFulfilledAction]) => [statusFulfilledAction, logFulfilledAction, submitStatusReceived(statusFulfilledAction.id, statusFulfilledAction.identifier)])
);

const buildStatusLoopEpic = (action, state) => action.pipe(
  ofType(actions.BUILD_STATUS_RECEIVED),
  withLatestFrom(state),
  tap(([a, s]) => {
    // message handling for updated build status
    StatusUtils.buildStatusUpdate(a, s);
  }),
  mergeMap(([a, s]) => merge(
    shouldGetBuildStatusHelperObservable(a, s).pipe(
      map(() => getBuildStatus(a.buildId)),
      catchError(error => of(handleError(a, error)))
    ),
    shouldGetArtifactsHelperObservable(a, s).pipe(
      map(() => getBuildArtifacts(a.buildId)),
      catchError(error => of(handleError(a, error)))
    )
  )), catchError(error => of(handleError(action, error)))
);

const shouldGetBuildStatusHelperObservable = (action, state) => {
  const buildStatus = StateSelector.getBuildStatus(state, action.buildId);
  if (buildStatus === 'building' || buildStatus === 'created' || buildStatus === 'waiting') {
    return of(1).pipe(
      delay(5000),
    );
  }
  return empty();
};

const shouldGetArtifactsHelperObservable = (action, state) => {
  const buildStatus = StateSelector.getBuildStatus(state, action.buildId);
  if (buildStatus === 'built') {
    return of(1);
  }
  return empty();
};

const submitStatusLoopEpic = (action, state) => action.pipe(
  ofType(actions.SUBMIT_STATUS_RECEIVED),
  withLatestFrom(state),
  tap(([a, s]) => {
    // message handling for updated build status'
    StatusUtils.submitStatusUpdate(a, s);
  }),
  mergeMap(([a, s]) => shouldGetSubmitStatusHelperObservable(a, s).pipe(
    map(() => getSubmitStatus(a.id, a.identifier)),
    catchError(error => of(handleError(a, error)))
  )),
  catchError(error => of(handleError(action, error)))
);

const shouldGetSubmitStatusHelperObservable = (action, state) => {
  const submitStatus = StateSelector.getSubmitStatus(state, action.id);
  if (submitStatus === 'submission.unknown' || submitStatus === 'submission.created' || submitStatus === 'submission.failedProcessingJob' || submitStatus === 'submission.failedProcessingBuild' || submitStatus === 'job.submitting' || submitStatus === 'job.registering' || submitStatus === 'job.submitFailed' || submitStatus === 'job.applicationBundleUploading') {
    return of(1).pipe(
      delay(5000)
    );
  }
  return empty();
};

const getBuildArtifactsEpic = (action, state) => action.pipe(
  ofType(actions.GET_BUILD_ARTIFACTS),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.artifact.getArtifacts(s, a.buildId).pipe(
    map(artifactResponse => getBuildArtifactsFulfilled(a.buildId, ResponseSelector.getBuildArtifacts(artifactResponse))),
    catchError(error => of(handleError(a, error)))
  )), catchError(error => of(handleError(action, error)))
);

const getBuildArtifactsFulfilledEpic = (action, state) => action.pipe(
  ofType(actions.GET_BUILD_ARTIFACTS_FULFILLED),
  withLatestFrom(state),
  tap(([a, s]) => {
    const { buildId } = a;
    StatusUtils.downloadOrSubmit(s, buildId);
  }),
  map(() => ({ type: actions.POST_GET_BUILD_ARTIFACTS_FULFILLED })), catchError(error => of(handleError(action, error)))
);

const downloadArtifactsEpic = (action, state) => action.pipe(
  ofType(actions.DOWNLOAD_APP_BUNDLES),
  withLatestFrom(state),
  mergeMap(([a, s]) => {
    const { buildId } = a;
    const artifacts = StateSelector.getBuildArtifacts(s, buildId);
    return from(artifacts).pipe(
      mergeMap(artifact => StreamsRestUtils.artifact.downloadApplicationBundle(s, buildId, artifact.id).pipe(
        map(downloadResponse => {
          const artifactId = artifact.id;
          const artifactOutputPath = StateSelector.getOutputArtifactFilePath(s, buildId, artifactId);
          try {
            if (fs.existsSync(artifactOutputPath)) {
              fs.unlinkSync(artifactOutputPath);
            }
            const outputDir = path.dirname(artifactOutputPath);
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir);
            }
            fs.writeFileSync(artifactOutputPath, downloadResponse.body);
            StatusUtils.appBundleDownloaded(s, buildId, artifact.name, artifactOutputPath);
          } catch (err) {
            console.error(err);
          }
        })
      )),
      map(() => ({ type: actions.POST_DOWNLOAD_ARTIFACTS })),
      catchError(error => of(handleError(a, error)))
    );
  }), catchError(error => of(handleError(action, error)))
);

const getSubmissionTimeParamsFromAdlEpic = (action, state) => action.pipe(
  ofType(actions.GET_SUBMISSION_TIME_VALUES_FROM_ADL),
  withLatestFrom(state),
  mergeMap(([a, s]) => {
    const { buildId } = a;
    const artifacts = StateSelector.getBuildArtifacts(s, buildId);
    return from(artifacts).pipe(
      tap(submitArtifact => StatusUtils.submitJobStart(s, submitArtifact.name, buildId)),
      mergeMap(artifact => StreamsRestUtils.artifact.getAdl(s, buildId, artifact.id).pipe(
        map((adl) => {
          const doc = new xmldoc.XmlDocument(adl.body);
          const submissionTimeValues = doc.childNamed('splApplication').childNamed('submissionTimeValues');
          let submissionTimePanel;
          if (submissionTimeValues) {
            const submitCallback = (params) => {
              const act = asyncSubmitApplications(buildId, true, a.identifier, params);
              getStore().dispatch(act);
            };
            const submissionTimeView = new SubmissionTimeView(() => {
              submissionTimePanel.hide();
            }, submissionTimeValues.childrenNamed('submissionTimeValue'), {
              type: 'V5', subType: 'adl', submitCallback
            });
            submissionTimePanel = atom.workspace.addModalPanel({
              item: submissionTimeView.getElement(),
              visible: false
            });
          } else {
            submissionTimePanel = null;
          }
          return submissionTimePanel;
        }),
        map((panel) => {
          if (panel) {
            panel.show();
            return ({ type: actions.WAITING_FOR_SUBMISSION_TIME_PARAMETERS });
          }
          return asyncSubmitApplications(buildId, true, []);
        })
      )),
      catchError(error => of(handleError(a, error)))
    );
  }),
);

const asyncSubmitApplicationsEpic = (action, state) => action.pipe(
  ofType(actions.ASYNC_SUBMIT_APPLICATIONS),
  withLatestFrom(state),
  mergeMap(([a, s]) => {
    const { buildId } = a;
    let submitInfo;
    const artifacts = StateSelector.getBuildArtifacts(s, buildId);
    return from(artifacts).pipe(
      tap(submitArtifact => StatusUtils.submitJobStart(s, submitArtifact.name, buildId)),
      mergeMap(artifact => StreamsRestUtils.asyncSubmissions.submitJobAsync(
        s,
        artifact.applicationBundle,
        { submitParameters: a.submitParameters }
      ).pipe(
        tap(submitResponse => {
          submitInfo = ResponseSelector.getSubmitInfo(submitResponse);
          StatusUtils.jobSubmitted(s, submitInfo, buildId);
        })
      )),
      map(() => (getSubmitStatus(submitInfo.id, a.identifier))),
      catchError(error => of(handleError(a, error)))
    );
  }),
);

// async submition if sab file is downloaded
const getSubmissionTimeParamsFromBundleFilesEpic = (action, state) => action.pipe(
  ofType(actions.GET_SUBMISSION_TIME_VALUES_FROM_BUNDLE),
  withLatestFrom(state),
  mergeMap(([a, s]) => {
    let submissionTimePanel;
    let submitBundleId;
    return from(a.bundles).pipe(
      tap((bundleToUpload) => {
        StatusUtils.submitJobStart(s, path.basename(bundleToUpload.bundlePath));
      }),
      mergeMap(bundle => StreamsRestUtils.artifact.uploadApplicationBundleToInstance(s, bundle.bundlePath).pipe(
        mergeMap((uploadRes) => {
          submitBundleId = ResponseSelector.getUploadedBundleId(uploadRes);

          const submitCallback = (params) => {
            const act = submitFromBundleWithParams(submitBundleId, bundle.jobName, params);
            getStore().dispatch(act);
          };
          return StreamsUtils.extractSab(bundle.bundlePath, {
            type: 'V5', subType: 'Bundle', submitCallback
          }).then((panel) => {
            submissionTimePanel = panel;
          });
        }),
        map(() => {
          if (submissionTimePanel) {
            submissionTimePanel.show();
            return ({ type: actions.WAITING_FOR_SUBMISSION_TIME_PARAMETERS });
          }
          return (submitFromBundleWithParams(submitBundleId, bundle.jobName, []));
        })
      )),
      catchError(error => of(handleError(a, error)))
    );
  }),
);

const asyncSubmitApplicationsFromBundleFilesEpic = (action, state) => action.pipe(
  ofType(actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES_ASYNC),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.asyncSubmissions.submitJobAsync(s, a.submitBundleId, { submitParameters: a.submitParameters }).pipe(
    tap(submitResponse => {
      const submitInfo = ResponseSelector.getSubmitInfo(submitResponse);
      StatusUtils.jobSubmitted(s, submitInfo);
    }),
    map((submitResponse) => (getSubmitStatus(ResponseSelector.getSubmitInfo(submitResponse).id, a.identifier)))
  )),
);

const openStreamsConsoleEpic = (action, state) => action.pipe(
  ofType(actions.OPEN_STREAMS_CONSOLE),
  withLatestFrom(state),
  tap(([a, s]) => {
    MessageHandlerRegistry.openUrl(StateSelector.getStreamsConsoleUrl(s));
  }),
  map(() => ({ type: actions.POST_OPEN_STREAMS_CONSOLE })), catchError(error => of(handleError(action, error)))
);

const icp4dHostExistsEpic = (action, state) => action.pipe(
  ofType(actions.CHECK_ICP4D_HOST_EXISTS),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.icp4d.icp4dHostExists(s).pipe(
    tap((response) => a.successFn()),
    catchError(error => {
      a.errorFn();
      return of(handleError(a, error));
    })
  )),
  map(() => ({ type: actions.POST_CHECK_ICP4D_HOST_EXISTS })), catchError(error => of(handleError(action, error)))
);

const icp4dAuthEpic = (action, state) => action.pipe(
  ofType(actions.AUTHENTICATE_ICP4D),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.icp4d.getIcp4dToken(s, a.username, a.password).pipe(
    mergeMap(authTokenResponse => {
      const statusCode = ResponseSelector.getStatusCode(authTokenResponse);
      if (statusCode === 200) {
        if (a.rememberPassword) {
          KeychainUtils.addCredentials(a.username, a.password);
        } else {
          KeychainUtils.deleteCredentials(a.username);
        }
        return merge(
          of(setIcp4dAuthToken(ResponseSelector.getIcp4dAuthToken(authTokenResponse))),
          of(setIcp4dAuthError(false)),
          authDelayObservable().pipe(
            tap(() => {
              console.log('reauthenticating to icp4d');
            }),
            mergeMap(() => of(authenticateIcp4d(a.username, a.password, a.rememberPassword))),
            catchError(error => of(handleError(a, error)))
          ),
        );
      }
      return of(setIcp4dAuthError(statusCode));
    }),
    catchError(error => of(handleError(a, error)))
  )), catchError(error => of(handleError(action, error)))
);

const authDelayObservable = () => {
  return of(1).pipe(
    delay(19.5 * 60 * 1000) // icp4d auth tokens expire after 20 minutes
  );
};

const streamsAuthEpic = (action, state) => action.pipe(
  ofType(actions.AUTHENTICATE_STREAMS_INSTANCE),
  withLatestFrom(state),
  mergeMap(([authAction, s]) => StreamsRestUtils.icp4d.getStreamsAuthToken(s, authAction.instanceName).pipe(
    mergeMap(authTokenResponse => {
      const statusCode = ResponseSelector.getStatusCode(authTokenResponse);
      if (statusCode === 200) {
        const queuedActionObservable = StateSelector.getQueuedAction(s) ? merge(
          of(StateSelector.getQueuedAction(s)), // if there was a queued action, run it now...
          of(clearQueuedAction())
        ) : of();
        return merge(
          of(setStreamsAuthToken(ResponseSelector.getStreamsAuthToken(authTokenResponse))),
          of(setStreamsAuthError(false)),
          of(refreshToolkits()),
          queuedActionObservable,
          authDelayObservable().pipe(
            tap(() => {
              console.log('reauthenticating to streams instance');
            }),
            mergeMap(() => of(authenticateStreamsInstance(authAction.instanceName))),
            catchError(error => of(handleError(authAction, error)))
          )
        );
      }
      return of(setStreamsAuthError(true));
    }),
    catchError(error => of(handleError(authAction, error)))
  )), catchError(error => of(handleError(action, error)))
);

const getStreamsInstancesEpic = (action, state) => action.pipe(
  ofType(actions.SET_ICP4D_AUTH_TOKEN),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.icp4d.getServiceInstances(s).pipe(
    map(serviceInstancesResponse => ResponseSelector.getStreamsInstances(serviceInstancesResponse)),
    map(streamsInstances => setStreamsInstances(streamsInstances)),
    catchError(error => of(handleError(a, error)))
  )), catchError(error => of(handleError(action, error)))
);

const instanceSelectedEpic = (action, state) => action.pipe(
  ofType(actions.SET_SELECTED_INSTANCE),
  withLatestFrom(state),
  map(([a, s]) => authenticateStreamsInstance(StateSelector.getSelectedInstanceName(s))), catchError(error => of(handleError(action, error)))
);

const refreshToolkitsEpic = (action, state) => action.pipe(
  ofType(actions.REFRESH_TOOLKITS),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.toolkit.getToolkits(s).pipe(
    tap(() => MessageHandlerRegistry.getDefault().handleInfo('Initializing toolkit index cache')),
    map(toolkitsResponse => ResponseSelector.getToolkits(toolkitsResponse)),
    map(toolkits => StreamsToolkitsUtils.getToolkitsToCache(s, toolkits)),
    mergeMap(toolkitsToCache => forkJoin(from(toolkitsToCache).pipe(
      mergeMap(toolkitToCache => StreamsRestUtils.toolkit.getToolkitIndex(s, toolkitToCache.id).pipe(
        map(toolkitIndexResponse => StreamsToolkitsUtils.cacheToolkitIndex(s, toolkitToCache, toolkitIndexResponse.body))
      )),
      defaultIfEmpty('empty')
    ))),
    tap(() => StreamsToolkitsUtils.refreshLspToolkits(s, MessageHandlerRegistry.sendLspNotification)),
    map(() => ({ type: actions.POST_REFRESH_TOOLKITS })),
    tap(() => MessageHandlerRegistry.getDefault().handleSuccess('Toolkit indexes cached successfully', { notificationAutoDismiss: true })),
    catchError(error => of(handleError(a, error)))
  )), catchError(error => of(handleError(action, error)))
);

const packageActivatedEpic = (action, state) => action.pipe(
  ofType(actions.PACKAGE_ACTIVATED),
  withLatestFrom(state),
  map(([a, s]) => {
    const username = StateSelector.getUsername(s);
    const rememberPassword = StateSelector.getRememberPassword(s);
    if (username && rememberPassword) {
      const password = KeychainUtils.getCredentials(username);
      if (password) {
        return setFormDataField('password', password);
      }
    }
    return { type: actions.POST_PACKAGE_ACTIVATED };
  }), catchError(error => of(handleError(action, error)))
);

const errorHandlingEpic = (action, state) => action.pipe(
  ofType(actions.ERROR),
  withLatestFrom(state),
  tap(([a, s]) => {
    console.error('error occurred in action: ', a.sourceAction.type, '\nerror: ', a.error);
    if (typeof a.error === 'string') {
      MessageHandlerRegistry.getDefault().handleError(a.error, { detail: a.sourceAction.type });
    } else if (a.error) {
      MessageHandlerRegistry.getDefault().handleError(a.error.message, { detail: `Error occurred during ${a.sourceAction.type}`, stack: a.error.stack });
    }
  }),
  map(() => ({ type: actions.POST_ERROR })), catchError((error) => of(handleError(action, error)))
);

const rootEpic = combineEpics(
  errorHandlingEpic,

  buildAppEpic,
  buildStatusEpic,
  uploadSourceEpic,
  sourceArchiveCreatedEpic,
  startBuildEpic,
  buildStatusLoopEpic,

  getBuildArtifactsEpic,
  getBuildArtifactsFulfilledEpic,
  downloadArtifactsEpic,
  getSubmissionTimeParamsFromBundleFilesEpic,
  getSubmissionTimeParamsFromAdlEpic,

  openStreamsConsoleEpic,

  instanceSelectedEpic,
  icp4dHostExistsEpic,
  icp4dAuthEpic,
  streamsAuthEpic,
  getStreamsInstancesEpic,

  packageActivatedEpic,

  refreshToolkitsEpic,

  submitStatusEpic,
  submitStatusLoopEpic,
  asyncSubmitApplicationsFromBundleFilesEpic,
  asyncSubmitApplicationsEpic

);

export default rootEpic;
