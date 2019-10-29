'use babel';
'use strict';

import { Map } from 'immutable';
import { actionTypes } from './submit-v5-actions';

const submitV5Reducer = (state = Map(), action) => {
  switch (action.type) {
    case actionTypes.GET_SUBMIT_STATUS_FULFILLED:
      return state.updateIn(['jobSubmissions', action.id], jobSubmission => {
        const jobSubmissionObj = jobSubmission || Map();
        return jobSubmissionObj.set('status', action.status);
      });
    case actionTypes.GET_SUBMIT_LOG_MESSAGES_FULFILLED:
      return state.updateIn(['jobSubmissions', action.id], jobSubmission => {
        const jobSubmissionObj = jobSubmission || Map();
        return jobSubmissionObj.set('logMessages', action.logMessages);
      });
    default:
      return state;
  }
};

export default submitV5Reducer;
