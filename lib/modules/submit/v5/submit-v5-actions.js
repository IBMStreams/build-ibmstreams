'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

export const getSubmitStatus = (id, identifier) => ({
  type: actionTypes.GET_SUBMIT_STATUS,
  id,
  identifier
});

export const getSubmitStatusFulfilled = (submitStatusResponse, identifier) => ({
  type: actionTypes.GET_SUBMIT_STATUS_FULFILLED,
  ...submitStatusResponse,
  identifier
});

export const getSubmitLogMessagesFulfilled = (submitLogMessagesResponse) => ({
  type: actionTypes.GET_SUBMIT_LOG_MESSAGES_FULFILLED,
  ...submitLogMessagesResponse
});

export const submitStatusReceived = (id, identifier) => ({
  type: actionTypes.SUBMIT_STATUS_RECEIVED,
  id,
  identifier
});

export const submitFromBundleWithParams = (submitBundleId, identifier, submitParameters) => ({
  type: actionTypes.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
  submitBundleId,
  identifier,
  submitParameters
});

export const submitApplications = (buildId, fromArtifact, identifier, submitParameters) => ({
  type: actionTypes.SUBMIT_APPLICATIONS,
  buildId,
  fromArtifact,
  identifier,
  submitParameters
});

export const getSubmissionTimeParamsFromAdl = (buildId, fromArtifact, identifier) => ({
  type: actionTypes.GET_SUBMISSION_TIME_VALUES_FROM_ADL,
  buildId,
  fromArtifact,
  identifier
});

export const submitApplicationsFromBundleFiles = (bundles) => ({
  type: actionTypes.GET_SUBMISSION_TIME_VALUES_FROM_BUNDLE,
  bundles
});

export const actionTypes = {
  GET_SUBMIT_STATUS: 'GET_SUBMIT_STATUS',
  SUBMIT_STATUS_RECEIVED: 'SUBMIT_STATUS_RECEIVED',
  GET_SUBMIT_STATUS_FULFILLED: 'GET_SUBMIT_STATUS_FULFILLED',
  GET_SUBMIT_LOG_MESSAGES_FULFILLED: 'GET_SUBMIT_LOG_MESSAGES_FULFILLED',
  SUBMIT_APPLICATIONS: 'SUBMIT_APPLICATIONS',
  POST_SUBMIT_APPLICATIONS: 'POST_SUBMIT_APPLICATIONS',
  SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES: 'SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES',
  POST_SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES: 'POST_SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES',
  GET_SUBMISSION_TIME_VALUES_FROM_BUNDLE: 'GET_SUBMISSION_TIME_VALUES_FROM_BUNDLE',
  GET_SUBMISSION_TIME_VALUES_FROM_ADL: 'GET_SUBMISSION_TIME_VALUES_FROM_ADL',
  WAITING_FOR_SUBMISSION_TIME_PARAMETERS: 'WAITING_FOR_SUBMISSION_TIME_PARAMETERS',
};
