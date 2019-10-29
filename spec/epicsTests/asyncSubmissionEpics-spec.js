'use babel';

import { createEpicMiddleware, ActionsObservable } from 'redux-observable';
import { Observable, of } from 'rxjs';
import * as operators from 'rxjs/operators';
import { createStore, applyMiddleware } from 'redux';
import rootEpic from '../../lib/epics/index';
import * as actions from '../../lib/actions/index';
import rootReducer from '../../lib/reducers/index';
import {
  StateSelector,
  ResponseSelector,
  StreamsRestUtils,
  SourceArchiveUtils,
  StatusUtils,
  StreamsToolkitsUtils,
  KeychainUtils
} from '../../lib/util';

function getState$(store) {
  return new Observable(((observer) => {
    observer.next(store.getState());
    const unsubscribe = store.subscribe(() => {
      observer.next(store.getState());
    });
    return unsubscribe;
  }));
}

describe('async submission epics', () => {
  describe('submitStatusEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', async () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_SUBMIT_STATUS,
        id: '001',
      });
      spyOn(ResponseSelector, 'getSubmitStatus').andReturn({ status: 'test', id: '001' });
      spyOn(StreamsRestUtils.submit, 'getJobSubmission').andReturn(action);
      spyOn(StreamsRestUtils.submit, 'getSubmissionLogMessages').andReturn(ActionsObservable.of({ body: 'test' }));
      const state = getState$(store);
      const expectedOutput = [{ type: actions.actions.GET_SUBMIT_STATUS_FULFILLED, status: 'test', id: '001' }, { type: actions.actions.GET_SUBMIT_LOG_MESSAGES_FULFILLED, id: '001', logMessages: ['test'] }, { type: actions.actions.SUBMIT_STATUS_RECEIVED, id: '001' }];
      let i = 0;
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput[i]);
          i += 1;
        });
    });
    it('should handle failure if StreamsRestUtils.submit.getJobSubmission fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_SUBMIT_STATUS,
        id: '001',
      });
      spyOn(ResponseSelector, 'getSubmitStatus').andReturn({ status: 'test', id: '001' });
      spyOn(StreamsRestUtils.submit, 'getJobSubmission').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsRestUtils.submit, 'getSubmissionLogMessages').andReturn(ActionsObservable.of({ body: 'test' }));
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.submit.getSubmissionLogMessages fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_SUBMIT_STATUS,
        id: '001',
      });
      spyOn(ResponseSelector, 'getSubmitStatus').andReturn({ status: 'test', id: '001' });
      spyOn(StreamsRestUtils.submit, 'getJobSubmission').andReturn(action);
      spyOn(StreamsRestUtils.submit, 'getSubmissionLogMessages').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getSubmitStatus fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_SUBMIT_STATUS,
        id: '001',
      });
      spyOn(ResponseSelector, 'getSubmitStatus').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsRestUtils.submit, 'getJobSubmission').andReturn(action);
      spyOn(StreamsRestUtils.submit, 'getSubmissionLogMessages').andReturn(ActionsObservable.of({ body: 'test' }));
      const state = getState$(store);
      const expectedOutput = [{
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.GET_SUBMIT_STATUS,
          id: '001',
        },
        error: new Error()
      }, { type: actions.actions.GET_SUBMIT_LOG_MESSAGES_FULFILLED, id: '001', logMessages: ['test'] }, { type: actions.actions.SUBMIT_STATUS_RECEIVED, id: undefined }];
      let i = 0;
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput[i]);
          i += 1;
        });
    });
    it('should handle failure if response do not have a body', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_SUBMIT_STATUS,
        id: '001',
      });
      spyOn(ResponseSelector, 'getSubmitStatus').andReturn({ status: 'test', id: '001' });
      spyOn(StreamsRestUtils.submit, 'getJobSubmission').andReturn(action);
      spyOn(StreamsRestUtils.submit, 'getSubmissionLogMessages').andReturn(ActionsObservable.of({ test: 'test' }));
      const state = getState$(store);
      const expectedOutput = [{ type: actions.actions.GET_SUBMIT_STATUS_FULFILLED, status: 'test', id: '001' }, {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.GET_SUBMIT_STATUS,
          id: '001',
        },
        error: new TypeError()
      }, { type: actions.actions.SUBMIT_STATUS_RECEIVED, id: '001' }];
      let i = 0;
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput[i]);
          i += 1;
        });
    });
  });
  describe('submitStatusLoopEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success when status is submission.unknown, submission.failedProcessingJob, submission.failedProcessingBuild, job.submiting, job.registering or job.submitFailed', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_STATUS_RECEIVED,
        id: '001',
      });
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(StatusUtils, 'submitStatusUpdate').andReturn(1);
      spyOn(StateSelector, 'getSubmitStatus').andReturn('submission.unknown');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.GET_SUBMIT_STATUS, id: '001' };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StatusUtils.submitStatusUpdate fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_STATUS_RECEIVED,
        id: '001',
      });
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(StatusUtils, 'submitStatusUpdate').andCallFake(() => {
        throw new Error();
      });
      spyOn(StateSelector, 'getSubmitStatus').andReturn('submission.unknown');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getBuildStatus fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_STATUS_RECEIVED,
        id: '001'
      });
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(StatusUtils, 'submitStatusUpdate').andReturn(1);
      spyOn(StateSelector, 'getSubmitStatus').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('asyncSubmitApplicationFromBundleFilesEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles: [{ bundlePath: 'testing' }],
      });
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'uploadApplicationBundleToInstance').andReturn(action);
      spyOn(ResponseSelector, 'getUploadedBundleId').andReturn('test');
      spyOn(StreamsRestUtils.submit, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn({ id: '001' });
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.GET_SUBMIT_STATUS, id: '001' };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StatusUtils.submitJob fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles: [{ bundlePath: 'testing' }],
      });
      spyOn(StatusUtils, 'submitJobStart').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsRestUtils.artifact, 'uploadApplicationBundleToInstance').andReturn(action);
      spyOn(ResponseSelector, 'getUploadedBundleId').andReturn('test');
      spyOn(StreamsRestUtils.submit, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
          bundles: [{ bundlePath: 'testing' }],
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.artifact.uploadApplicationBundleToInstance fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles: [{ bundlePath: 'testing' }],
      });
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'uploadApplicationBundleToInstance').andCallFake(() => {
        throw new Error();
      });
      spyOn(ResponseSelector, 'getUploadedBundleId').andReturn('test');
      spyOn(StreamsRestUtils.submit, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
          bundles: [{ bundlePath: 'testing' }],
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getUploadedBundleId fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles: [{ bundlePath: 'testing' }],
      });
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'uploadApplicationBundleToInstance').andReturn(action);
      spyOn(ResponseSelector, 'getUploadedBundleId').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsRestUtils.submit, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
          bundles: [{ bundlePath: 'testing' }],
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.submit.submitJob fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles: [{ bundlePath: 'testing' }],
      });
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'uploadApplicationBundleToInstance').andReturn(action);
      spyOn(ResponseSelector, 'getUploadedBundleId').andReturn('test');
      spyOn(StreamsRestUtils.submit, 'submitJob').andCallFake(() => {
        throw new Error();
      });
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
          bundles: [{ bundlePath: 'testing' }],
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getSubmitInfo fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles: [{ bundlePath: 'testing' }],
      });
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'uploadApplicationBundleToInstance').andReturn(action);
      spyOn(ResponseSelector, 'getUploadedBundleId').andReturn('test');
      spyOn(StreamsRestUtils.submit, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andCallFake(() => {
        throw new Error();
      });
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
          bundles: [{ bundlePath: 'testing' }],
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StatusUtils.jobSubmitted fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles: [{ bundlePath: 'testing' }],
      });
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'uploadApplicationBundleToInstance').andReturn(action);
      spyOn(ResponseSelector, 'getUploadedBundleId').andReturn('test');
      spyOn(StreamsRestUtils.submit, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
          bundles: [{ bundlePath: 'testing' }],
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
});
