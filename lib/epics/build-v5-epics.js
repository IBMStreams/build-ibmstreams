'use babel';
'use strict';

import { ofType } from 'redux-observable';
import * as path from 'path';
import * as fs from 'fs';
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

import {
  actions,

  handleError,

  getBuildArtifacts,
  getBuildArtifactsFulfilled,

  uploadSource,
  getBuildStatus,
  getBuildStatusFulfilled,
  getBuildLogMessagesFulfilled,
  startBuild,
  buildStatusReceived,
} from '../actions';
import {
  StateSelector,
  ResponseSelector,
  StreamsRestUtils,
  SourceArchiveUtils,
  StatusUtils,
  StreamsToolkitsUtils,
} from '../util';
import MessageHandlerRegistry from '../message-handler-registry';


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
  ofType(actions.DOWNLOAD_BUILD_ARTIFACTS),
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
      map(() => ({ type: actions.POST_DOWNLOAD_BUILD_ARTIFACTS })),
      catchError(error => of(handleError(a, error)))
    );
  }), catchError(error => of(handleError(action, error)))
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

const buildEpics = [
  buildAppEpic,
  uploadSourceEpic,
  sourceArchiveCreatedEpic,
  startBuildEpic,
  buildStatusEpic,
  buildStatusLoopEpic,
  getBuildArtifactsEpic,
  getBuildArtifactsFulfilledEpic,
  downloadArtifactsEpic,
  refreshToolkitsEpic,
];

export default buildEpics;
