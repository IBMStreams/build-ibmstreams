'use babel';
'use strict';

import { ofType } from 'redux-observable';
import * as path from 'path';
import * as xmldoc from 'xmldoc';
import {
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
} from 'rxjs';
import getStore from '../redux-store/configure-store';

import {
  actions,
  handleError,
  getSubmitStatusFulfilled,
  getSubmitLogMessagesFulfilled,
  getSubmitStatus,
  submitStatusReceived,
  submitApplications,
  submitFromBundleWithParams,
} from '../actions';
import {
  StateSelector,
  ResponseSelector,
  StreamsRestUtils,
  StatusUtils,
  StreamsUtils
} from '../util';
import SubmissionTimeView from '../views/submissionTimeParam/submissionTimeParamView';

const submitStatusEpic = (action, state) => action.pipe(
  ofType(actions.GET_SUBMIT_STATUS),
  withLatestFrom(state),
  // get job submission status and job submission message log and wait for both to complete,
  // passes on [SUBMIT_STATUS_FULFILLED, SUBMIT_LOG_FULFILLED]
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
  // emit [SUBMIT_STATUS_FULFILLED, SUBMIT_LOG_FULFILLED, SUBMIT_STATUS_RECEIVED]
  mergeMap(([statusFulfilledAction, logFulfilledAction]) => [statusFulfilledAction, logFulfilledAction, submitStatusReceived(statusFulfilledAction.id, statusFulfilledAction.identifier)])
);

const submitStatusLoopEpic = (action, state) => action.pipe(
  ofType(actions.SUBMIT_STATUS_RECEIVED),
  withLatestFrom(state),
  tap(([a, s]) => {
    // message handling for updated job submission status
    StatusUtils.submitStatusUpdate(a, s);
  }),
  mergeMap(([a, s]) => shouldGetSubmitStatusHelperObservable(a, s).pipe(
    map(() => getSubmitStatus(a.id, a.identifier)),
    catchError(error => of(handleError(a, error)))
  )),
  catchError(error => of(handleError(action, error)))
);

const incompleteSubmissionStatuses = [
  'submission.created',
  // 'submission.failedProcessingJob',
  // 'submission.failedProcessingBuild',
  'job.submitting',
  'job.registering',
  // 'job.submitFailed',
  'job.applicationBundleUploading'
];

const shouldGetSubmitStatusHelperObservable = (action, state) => {
  const submitStatus = StateSelector.getSubmitStatus(state, action.id);
  if (incompleteSubmissionStatuses.includes(submitStatus)) {
    return of(1).pipe(
      delay(5000)
    );
  }
  return empty();
};

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
              const act = submitApplications(buildId, true, a.identifier, params);
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
          return submitApplications(buildId, true, []);
        })
      )),
      catchError(error => of(handleError(a, error)))
    );
  }),
);

const submitApplicationsEpic = (action, state) => action.pipe(
  ofType(actions.SUBMIT_APPLICATIONS),
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

const submitApplicationsFromBundleFilesEpic = (action, state) => action.pipe(
  ofType(actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.asyncSubmissions.submitJobAsync(s, a.submitBundleId, { submitParameters: a.submitParameters }).pipe(
    tap(submitResponse => {
      const submitInfo = ResponseSelector.getSubmitInfo(submitResponse);
      StatusUtils.jobSubmitted(s, submitInfo);
    }),
    map((submitResponse) => (getSubmitStatus(ResponseSelector.getSubmitInfo(submitResponse).id, a.identifier)))
  )),
);

const submitEpics = [
  submitStatusEpic,
  submitStatusLoopEpic,
  submitApplicationsEpic,
  submitApplicationsFromBundleFilesEpic,
  getSubmissionTimeParamsFromBundleFilesEpic,
  getSubmissionTimeParamsFromAdlEpic,
];

export default submitEpics;
