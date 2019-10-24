'use babel';

import * as actions from '../../lib/actions/index';


describe('Actions', () => {
  let expectedOutput;
  // Clone this describe block to add new test
  describe('getSubmitStatus', () => {
    it('should create an action to get the submit status', () => {
      const id = 'test';
      expectedOutput = {
        type: actions.actions.GET_SUBMIT_STATUS,
        id
      };
      expect(actions.getSubmitStatus(id)).toEqual(expectedOutput);
    });
  });
  describe('getSubmitStatusFulfilled', () => {
    it('should create an action to get the submitStatusResponse URL', () => {
      const submitStatusResponse = { id: 'test', status: 'testStatus' };
      expectedOutput = {
        type: actions.actions.GET_SUBMIT_STATUS_FULFILLED,
        ...submitStatusResponse
      };
      expect(actions.getSubmitStatusFulfilled(submitStatusResponse)).toEqual(expectedOutput);
    });
  });
  describe('getSubmitLogMessagesFulfilled', () => {
    it('should create an action to get the submit log messages response URL', () => {
      const submitLogMessagesResponse = { logMessages: ['test'] };
      expectedOutput = {
        type: actions.actions.GET_SUBMIT_LOG_MESSAGES_FULFILLED,
        ...submitLogMessagesResponse
      };
      expect(actions.getSubmitLogMessagesFulfilled(submitLogMessagesResponse)).toEqual(expectedOutput);
    });
  });
  describe('submitStatusReceived', () => {
    it('should create a submit status recieved action', () => {
      const id = 'test';
      expectedOutput = {
        type: actions.actions.SUBMIT_STATUS_RECEIVED,
        id
      };
      expect(actions.submitStatusReceived(id)).toEqual(expectedOutput);
    });
  });
  describe('submitApplicationsFromBundleFiles', () => {
    it('should create a submit application from bundle file async action', () => {
      const bundles = ['test'];
      expectedOutput = {
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles
      };
      expect(actions.submitApplicationsFromBundleFiles(bundles)).toEqual(expectedOutput);
    });
  });
});
