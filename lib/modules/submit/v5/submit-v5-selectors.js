'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

import { createSelector } from 'reselect';
import { Map } from 'immutable';

/**
 * build state selectors
 */

const getBase = (state) => state.get('submitV5');

const getJobSubmissions = createSelector(
  getBase,
  (base = Map()) => base.getIn(['jobSubmissions'])
);

const getSubmission = (state, submitId) => {
  const submissions = getJobSubmissions(state);
  if (submissions) {
    return submissions.getIn([submitId]);
  }
  return {};
};

const getSubmitStatus = (state, submitId) => getSubmission(state, submitId).get('status');

const getSubmitLogMessages = (state, submitId) => getSubmission(state, submitId).get('logMessages');

export const submitV5Selectors = {
  getSubmitStatus,
  getSubmitLogMessages,
};
