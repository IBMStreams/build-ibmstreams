'use babel';

import { createEpicMiddleware, ActionsObservable } from 'redux-observable';
import { Observable, of } from 'rxjs';
import * as operators from 'rxjs/operators';
import { createStore, applyMiddleware } from 'redux';
import rootEpic from '../../lib/epics/index';
import * as actions from '../../lib/actions/index';
import rootReducer from '../../lib/reducers/index';
import MessageHandler from '../../lib/MessageHandler';
import MessageHandlerRegistry from '../../lib/message-handler-registry';
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

describe('Epics', () => {
  describe('errorHandlingEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle the case where a default MessageHandler is missing', () => {
      const action = ActionsObservable.of({
        type: actions.actions.ERROR,
        error: 'test error',
        sourceAction: { type: 'testSourceAction' }
      });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new TypeError() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should create error messages ', () => {
      const action = ActionsObservable.of({
        type: actions.actions.ERROR,
        error: 'test error',
        sourceAction: { type: 'testSourceAction' }
      });
      const ms = new MessageHandler(console);
      MessageHandlerRegistry.setDefault(ms);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_ERROR };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('buildAppEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success ', () => {
      spyOn(ResponseSelector, 'getBuildId').andReturn('001');
      spyOn(StateSelector, 'getNewBuild').andReturn({
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake'
      });

      const action = ActionsObservable.of({
        type: actions.actions.NEW_BUILD,
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake',
        postBuildAction: { type: 'TEST' }
      });

      spyOn(StreamsRestUtils.build, 'create').andReturn(action);

      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.BUILD_UPLOAD_SOURCE,
        buildId: '001',
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake'
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.build.create fails', () => {
      spyOn(ResponseSelector, 'getBuildId').andReturn('001');
      spyOn(StateSelector, 'getNewBuild').andReturn({
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake'
      });

      const action = ActionsObservable.of({
        type: actions.actions.NEW_BUILD,
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake',
        postBuildAction: { type: 'TEST' }
      });

      spyOn(StreamsRestUtils.build, 'create').andCallFake(() => {
        throw new Error();
      });

      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getBuildId fails', () => {
      spyOn(ResponseSelector, 'getBuildId').andReturn(null);
      spyOn(StateSelector, 'getNewBuild').andReturn({
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake'
      });

      const action = ActionsObservable.of({
        type: actions.actions.NEW_BUILD,
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake',
        postBuildAction: { type: 'TEST' }
      });

      spyOn(StreamsRestUtils.build, 'create').andReturn(action);

      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.NEW_BUILD,
          appRoot: 'testRoot',
          toolkitRootPath: 'testToolkit',
          fqn: 'testFqn',
          makefilePath: 'testMake',
          postBuildAction: { type: 'TEST' }
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getNewBuild fails', () => {
      spyOn(ResponseSelector, 'getBuildId').andReturn('001');
      spyOn(StateSelector, 'getNewBuild').andCallFake(() => {
        throw new Error();
      });

      const action = ActionsObservable.of({
        type: actions.actions.NEW_BUILD,
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake',
        postBuildAction: { type: 'TEST' }
      });

      spyOn(StreamsRestUtils.build, 'create').andReturn(action);

      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.NEW_BUILD,
          appRoot: 'testRoot',
          toolkitRootPath: 'testToolkit',
          fqn: 'testFqn',
          makefilePath: 'testMake',
          postBuildAction: { type: 'TEST' }
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('uploadSourceEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      spyOn(SourceArchiveUtils, 'buildSourceArchive').andReturn(ActionsObservable.of({ type: actions.actions.SOURCE_ARCHIVE_CREATED, archivePath: 'testPath', buildId: '001' }));
      const action = ActionsObservable.of({
        type: actions.actions.BUILD_UPLOAD_SOURCE,
        buildId: '001',
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake'
      });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.SOURCE_ARCHIVE_CREATED, archivePath: 'testPath', buildId: '001' };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if SourceArchiveUtils.buildSourceArchive fails', () => {
      spyOn(SourceArchiveUtils, 'buildSourceArchive').andCallFake(() => {
        throw new Error();
      });
      const action = ActionsObservable.of({
        type: actions.actions.BUILD_UPLOAD_SOURCE,
        buildId: '001',
        appRoot: 'testRoot',
        toolkitRootPath: 'testToolkit',
        fqn: 'testFqn',
        makefilePath: 'testMake'
      });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('sourceArchiveCreatedEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SOURCE_ARCHIVE_CREATED,
        buildId: '001',
        archivePath: 'testPath'
      });
      spyOn(StreamsRestUtils.build, 'uploadSource').andReturn(action);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.START_BUILD, buildId: '001' };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.build.uploadSource fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SOURCE_ARCHIVE_CREATED,
        buildId: '001',
        archivePath: 'testPath'
      });
      spyOn(StreamsRestUtils.build, 'uploadSource').andCallFake(() => {
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
  describe('startBuildEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.START_BUILD,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.build, 'start').andReturn(action);
      spyOn(operators, 'delay').andReturn((val) => val);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.GET_BUILD_STATUS, buildId: '001' };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.build.start fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.START_BUILD,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.build, 'start').andCallFake(() => {
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
  describe('buildStatusEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', async () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_STATUS,
        buildId: '001',
      });
      spyOn(ResponseSelector, 'getBuildStatus').andReturn({ status: 'test', buildId: '001' });
      spyOn(StreamsRestUtils.build, 'getStatus').andReturn(action);
      spyOn(StreamsRestUtils.build, 'getLogMessages').andReturn(ActionsObservable.of({ body: 'test' }));
      const state = getState$(store);
      const expectedOutput = [{ type: actions.actions.GET_BUILD_STATUS_FULFILLED, status: 'test', buildId: '001' }, { type: actions.actions.GET_BUILD_LOG_MESSAGES_FULFILLED, buildId: '001', logMessages: ['test'] }, { type: actions.actions.BUILD_STATUS_RECEIVED, buildId: '001' }];
      let i = 0;
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput[i]);
          i += 1;
        });
    });
    it('should handle failure if StreamsRestUtils.build.getStatus fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_STATUS,
        buildId: '001',
      });
      spyOn(ResponseSelector, 'getBuildStatus').andReturn({ status: 'test', buildId: '001' });
      spyOn(StreamsRestUtils.build, 'getStatus').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsRestUtils.build, 'getLogMessages').andReturn(ActionsObservable.of({ body: 'test' }));
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.build.getLogMessages fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_STATUS,
        buildId: '001',
      });
      spyOn(ResponseSelector, 'getBuildStatus').andReturn({ status: 'test', buildId: '001' });
      spyOn(StreamsRestUtils.build, 'getStatus').andReturn(action);
      spyOn(StreamsRestUtils.build, 'getLogMessages').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getBuildStatus fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_STATUS,
        buildId: '001',
      });
      spyOn(ResponseSelector, 'getBuildStatus').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsRestUtils.build, 'getStatus').andReturn(action);
      spyOn(StreamsRestUtils.build, 'getLogMessages').andReturn(ActionsObservable.of({ body: 'test' }));
      const state = getState$(store);
      const expectedOutput = [{
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.GET_BUILD_STATUS,
          buildId: '001',
        },
        error: new Error()
      }, { type: actions.actions.GET_BUILD_LOG_MESSAGES_FULFILLED, buildId: '001', logMessages: ['test'] }, { type: actions.actions.BUILD_STATUS_RECEIVED, buildId: undefined }];
      let i = 0;
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput[i]);
          i += 1;
        });
    });
    it('should handle failure if response do not have a body fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_STATUS,
        buildId: '001',
      });
      spyOn(ResponseSelector, 'getBuildStatus').andReturn({ status: 'test', buildId: '001' });
      spyOn(StreamsRestUtils.build, 'getStatus').andReturn(action);
      spyOn(StreamsRestUtils.build, 'getLogMessages').andReturn(ActionsObservable.of({ test: 'test' }));
      const state = getState$(store);
      const expectedOutput = [{ type: actions.actions.GET_BUILD_STATUS_FULFILLED, status: 'test', buildId: '001' }, {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.GET_BUILD_STATUS,
          buildId: '001',
        },
        error: new TypeError()
      }, { type: actions.actions.BUILD_STATUS_RECEIVED, buildId: '001' }];
      let i = 0;
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput[i]);
          i += 1;
        });
    });
  });
  describe('buildStatusLoopEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success when status is built', () => {
      const action = ActionsObservable.of({
        type: actions.actions.BUILD_STATUS_RECEIVED,
        buildId: '001',
      });
      spyOn(operators, 'delay').andCallFake((val) => action);
      spyOn(StatusUtils, 'buildStatusUpdate').andReturn(1);
      spyOn(StateSelector, 'getBuildStatus').andReturn('built');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.GET_BUILD_ARTIFACTS, buildId: '001' };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle success when status is building or created or waiting', () => {
      const action = ActionsObservable.of({
        type: actions.actions.BUILD_STATUS_RECEIVED,
        buildId: '001',
      });
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(StatusUtils, 'buildStatusUpdate').andReturn(1);
      spyOn(StateSelector, 'getBuildStatus').andReturn('building');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.GET_BUILD_STATUS, buildId: '001' };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StatusUtils.buildStatusUpdate fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.BUILD_STATUS_RECEIVED,
        buildId: '001',
      });
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(StatusUtils, 'buildStatusUpdate').andCallFake(() => {
        throw new Error();
      });
      spyOn(StateSelector, 'getBuildStatus').andReturn('building');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getBuildStatus fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.BUILD_STATUS_RECEIVED,
      });
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(StatusUtils, 'buildStatusUpdate').andReturn(1);
      spyOn(StateSelector, 'getBuildStatus').andCallFake(() => {
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
  describe('getBuildArtifactsEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_ARTIFACTS,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.artifact, 'getArtifacts').andReturn(action);
      spyOn(ResponseSelector, 'getBuildArtifacts').andReturn(['test', 'test']);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.GET_BUILD_ARTIFACTS_FULFILLED, buildId: '001', artifacts: ['test', 'test'] };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.artifact.getArtifacts fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_ARTIFACTS,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.artifact, 'getArtifacts').andCallFake(() => {
        throw new Error();
      });
      spyOn(ResponseSelector, 'getBuildArtifacts').andReturn(['test', 'test']);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getBuildArtifacts fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_ARTIFACTS,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.artifact, 'getArtifacts').andReturn(action);
      spyOn(ResponseSelector, 'getBuildArtifacts').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.GET_BUILD_ARTIFACTS,
          buildId: '001',
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('getBuildArtifactsFulfilledEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_ARTIFACTS_FULFILLED,
        buildId: '001',
        artifacts: [{ id: 'test' }]
      });
      spyOn(StatusUtils, 'downloadOrSubmit').andReturn(1);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_GET_BUILD_ARTIFACTS_FULFILLED };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StatusUtils.downloadOrSubmit fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.GET_BUILD_ARTIFACTS_FULFILLED,
        buildId: '001',
        artifacts: [{ id: 'test' }]
      });
      spyOn(StatusUtils, 'downloadOrSubmit').andCallFake(() => {
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
  describe('downloadArtifactsEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.DOWNLOAD_BUILD_ARTIFACTS,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.artifact, 'downloadApplicationBundle').andReturn(ActionsObservable.of({ body: 'testing' }));
      spyOn(StateSelector, 'getBuildArtifacts').andReturn([{ id: 'test' }]);
      spyOn(StateSelector, 'getOutputArtifactFilePath').andReturn(`${__dirname}/output/artifact`);
      spyOn(StatusUtils, 'appBundleDownloaded').andReturn(1);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_DOWNLOAD_BUILD_ARTIFACTS, };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getBuildArtifacts fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.DOWNLOAD_BUILD_ARTIFACTS,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.artifact, 'downloadApplicationBundle').andReturn(ActionsObservable.of({ body: 'testing' }));
      spyOn(StateSelector, 'getBuildArtifacts').andCallFake(() => {
        throw new Error();
      });
      spyOn(StateSelector, 'getOutputArtifactFilePath').andReturn(`${__dirname}/output/artifact`);
      spyOn(StatusUtils, 'appBundleDownloaded').andReturn(1);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.artifact.downloadApplicationBundle fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.DOWNLOAD_BUILD_ARTIFACTS,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.artifact, 'downloadApplicationBundle').andCallFake(() => {
        throw new Error();
      });
      spyOn(StateSelector, 'getBuildArtifacts').andReturn([{ id: 'test' }]);
      spyOn(StateSelector, 'getOutputArtifactFilePath').andReturn(`${__dirname}/output/artifact`);
      spyOn(StatusUtils, 'appBundleDownloaded').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.DOWNLOAD_BUILD_ARTIFACTS,
          buildId: '001',
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getOutputArtifactFilePath fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.DOWNLOAD_BUILD_ARTIFACTS,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.artifact, 'downloadApplicationBundle').andReturn(ActionsObservable.of({ body: 'testing' }));
      spyOn(StateSelector, 'getBuildArtifacts').andReturn([{ id: 'test' }]);
      spyOn(StateSelector, 'getOutputArtifactFilePath').andCallFake(() => {
        throw new Error('testing');
      });
      spyOn(StatusUtils, 'appBundleDownloaded').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.DOWNLOAD_BUILD_ARTIFACTS,
          buildId: '001',
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StatusUtils.appBundleDownloaded fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.DOWNLOAD_BUILD_ARTIFACTS,
        buildId: '001',
      });
      spyOn(StreamsRestUtils.artifact, 'downloadApplicationBundle').andReturn(ActionsObservable.of({ body: 'testing' }));
      spyOn(StateSelector, 'getBuildArtifacts').andReturn([{ id: 'test' }]);
      spyOn(StateSelector, 'getOutputArtifactFilePath').andReturn(`${__dirname}/output/artifact`);
      spyOn(StatusUtils, 'appBundleDownloaded').andCallFake(() => {
        throw new Error('testing');
      });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_DOWNLOAD_BUILD_ARTIFACTS, };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('submitApplicationEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS,
        buildId: '001',
        fromArtifact: { test: 'test' }
      });
      spyOn(StateSelector, 'getBuildArtifacts').andReturn([{ id: 'test' }]);
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_SUBMIT_APPLICATIONS, };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getBuildArtifacts fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS,
        buildId: '001',
        fromArtifact: { test: 'test' }
      });
      spyOn(StateSelector, 'getBuildArtifacts').andCallFake(() => {
        throw new Error();
      });
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StatusUtils.submitJobStart fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS,
        buildId: '001',
        fromArtifact: { test: 'test' }
      });
      spyOn(StateSelector, 'getBuildArtifacts').andReturn([{ id: 'test' }]);
      spyOn(StatusUtils, 'submitJobStart').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS,
          buildId: '001',
          fromArtifact: { test: 'test' }
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.artifact.submitJob fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS,
        buildId: '001',
        fromArtifact: { test: 'test' }
      });
      spyOn(StateSelector, 'getBuildArtifacts').andReturn([{ id: 'test' }]);
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'submitJob').andCallFake(() => {
        throw new Error();
      });
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS,
          buildId: '001',
          fromArtifact: { test: 'test' }
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
        type: actions.actions.SUBMIT_APPLICATIONS,
        buildId: '001',
        fromArtifact: { test: 'test' }
      });
      spyOn(StateSelector, 'getBuildArtifacts').andReturn([{ id: 'test' }]);
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andCallFake(() => {
        throw new Error();
      });
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS,
          buildId: '001',
          fromArtifact: { test: 'test' }
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
        type: actions.actions.SUBMIT_APPLICATIONS,
        buildId: '001',
        fromArtifact: { test: 'test' }
      });
      spyOn(StateSelector, 'getBuildArtifacts').andReturn([{ id: 'test' }]);
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SUBMIT_APPLICATIONS,
          buildId: '001',
          fromArtifact: { test: 'test' }
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('submitApplicationFromBundleFilesEpic', () => {
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
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
      spyOn(ResponseSelector, 'getSubmitInfo').andReturn('test');
      spyOn(StatusUtils, 'jobSubmitted').andReturn(1);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES, };
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
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
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
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
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
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
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
    it('should handle failure if StreamsRestUtils.artifact.submitJob fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SUBMIT_APPLICATIONS_FROM_BUNDLE_FILES,
        bundles: [{ bundlePath: 'testing' }],
      });
      spyOn(StatusUtils, 'submitJobStart').andReturn(1);
      spyOn(StreamsRestUtils.artifact, 'uploadApplicationBundleToInstance').andReturn(action);
      spyOn(ResponseSelector, 'getUploadedBundleId').andReturn('test');
      spyOn(StreamsRestUtils.artifact, 'submitJob').andCallFake(() => {
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
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
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
      spyOn(StreamsRestUtils.artifact, 'submitJob').andReturn(action);
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
  describe('openStreamsConsoleEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.OPEN_STREAMS_CONSOLE,
      });
      spyOn(StateSelector, 'getStreamsConsoleUrl').andReturn(1);
      spyOn(MessageHandlerRegistry, 'openUrl').andReturn(1);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_OPEN_STREAMS_CONSOLE, };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getStreamsConsoleUrl fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.OPEN_STREAMS_CONSOLE,
      });
      spyOn(StateSelector, 'getStreamsConsoleUrl').andCallFake(() => {
        throw new Error();
      });
      spyOn(MessageHandlerRegistry, 'openUrl').andReturn(1);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if MessageHandlerRegistry.openUrl fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.OPEN_STREAMS_CONSOLE,
      });
      spyOn(StateSelector, 'getStreamsConsoleUrl').andReturn(1);
      spyOn(MessageHandlerRegistry, 'openUrl').andCallFake(() => {
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
  describe('icp4dHostExistsEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.CHECK_HOST_EXISTS,
        successFn: () => 1,
        errorFn: () => 1
      });
      spyOn(StreamsRestUtils.icp4d, 'icp4dHostExists').andReturn(action);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_CHECK_HOST_EXISTS, };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.icp4d.icp4dHostExists fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.CHECK_HOST_EXISTS,
        successFn: () => 1,
        errorFn: () => 1
      });
      spyOn(StreamsRestUtils.icp4d, 'icp4dHostExists').andCallFake(() => {
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
  describe('icp4dAuthEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D,
        username: 'test',
        password: 'test',
        rememberPassword: true
      });
      spyOn(StreamsRestUtils.icp4d, 'getIcp4dToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(200);
      spyOn(KeychainUtils, 'addCredentials').andReturn(1);
      spyOn(KeychainUtils, 'deleteCredentials').andReturn(1);
      spyOn(ResponseSelector, 'getIcp4dAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = [{ type: actions.actions.SET_ICP4D_AUTH_TOKEN, authToken: { test: 'test' }, currentLoginStep: 2 }, { type: actions.actions.SET_ICP4D_AUTH_ERROR, authError: false }, {
        type: actions.actions.AUTHENTICATE_ICP4D,
        username: 'test',
        password: 'test',
        rememberPassword: true
      }];
      let i = 0;
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput[i]);
          i += 1;
        });
    });
    it('should handle failure if status code is not 200', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D,
        username: 'test',
        password: 'test',
        rememberPassword: true
      });
      spyOn(StreamsRestUtils.icp4d, 'getIcp4dToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(1);
      spyOn(KeychainUtils, 'addCredentials').andReturn(1);
      spyOn(KeychainUtils, 'deleteCredentials').andReturn(1);
      spyOn(ResponseSelector, 'getIcp4dAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.SET_ICP4D_AUTH_ERROR, authError: 1 };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.icp4d.getIcp4dToken fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D,
        username: 'test',
        password: 'test',
        rememberPassword: true
      });
      spyOn(StreamsRestUtils.icp4d, 'getIcp4dToken').andCallFake(() => {
        throw new Error();
      });
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(200);
      spyOn(KeychainUtils, 'addCredentials').andReturn(1);
      spyOn(KeychainUtils, 'deleteCredentials').andReturn(1);
      spyOn(ResponseSelector, 'getIcp4dAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getStatusCode fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D,
        username: 'test',
        password: 'test',
        rememberPassword: true
      });
      spyOn(StreamsRestUtils.icp4d, 'getIcp4dToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andCallFake(() => {
        throw new Error();
      });
      spyOn(KeychainUtils, 'addCredentials').andReturn(1);
      spyOn(KeychainUtils, 'deleteCredentials').andReturn(1);
      spyOn(ResponseSelector, 'getIcp4dAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.AUTHENTICATE_ICP4D,
          username: 'test',
          password: 'test',
          rememberPassword: true
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if KeychainUtils.addCredentials fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D,
        username: 'test',
        password: 'test',
        rememberPassword: true
      });
      spyOn(StreamsRestUtils.icp4d, 'getIcp4dToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(200);
      spyOn(KeychainUtils, 'addCredentials').andCallFake(() => {
        throw new Error();
      });
      spyOn(KeychainUtils, 'deleteCredentials').andReturn(1);
      spyOn(ResponseSelector, 'getIcp4dAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.AUTHENTICATE_ICP4D,
          username: 'test',
          password: 'test',
          rememberPassword: true
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if KeychainUtils.deleteCredentials fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D,
        username: 'test',
        password: 'test',
        rememberPassword: false
      });
      spyOn(StreamsRestUtils.icp4d, 'getIcp4dToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(200);
      spyOn(KeychainUtils, 'addCredentials').andReturn(1);
      spyOn(KeychainUtils, 'deleteCredentials').andCallFake(() => {
        throw new Error();
      });
      spyOn(ResponseSelector, 'getIcp4dAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.AUTHENTICATE_ICP4D,
          username: 'test',
          password: 'test',
          rememberPassword: false
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getIcp4dAuthToken fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D,
        username: 'test',
        password: 'test',
        rememberPassword: true
      });
      spyOn(StreamsRestUtils.icp4d, 'getIcp4dToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(200);
      spyOn(KeychainUtils, 'addCredentials').andReturn(1);
      spyOn(KeychainUtils, 'deleteCredentials').andReturn(1);
      spyOn(ResponseSelector, 'getIcp4dAuthToken').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.AUTHENTICATE_ICP4D,
          username: 'test',
          password: 'test',
          rememberPassword: true
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('streamsAuthEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
        instanceName: 'testInstance',
      });
      spyOn(StreamsRestUtils.icp4d, 'getStreamsAuthToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(200);
      spyOn(StateSelector, 'getQueuedAction').andReturn(action);
      spyOn(ResponseSelector, 'getStreamsAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = [
        { type: actions.actions.SET_STREAMS_AUTH_TOKEN, authToken: { test: 'test' } },
        { type: actions.actions.SET_STREAMS_AUTH_ERROR, authError: false },
        { type: actions.actions.REFRESH_TOOLKITS },
        action,
        { type: actions.actions.CLEAR_QUEUED_ACTION },
        { type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE, instanceName: 'testInstance' }
      ];
      let i = 0;
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput[i]);
          i += 1;
        });
    });
    it('should handle failure if StreamsRestUtils.icp4d.getStreamsAuthToken fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
        instanceName: 'testInstance',
      });
      spyOn(StreamsRestUtils.icp4d, 'getStreamsAuthToken').andCallFake(() => {
        throw new Error();
      });
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(200);
      spyOn(StateSelector, 'getQueuedAction').andReturn(action);
      spyOn(ResponseSelector, 'getStreamsAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if Status code is not 200', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
        instanceName: 'testInstance',
      });
      spyOn(StreamsRestUtils.icp4d, 'getStreamsAuthToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(1);
      spyOn(StateSelector, 'getQueuedAction').andReturn(action);
      spyOn(ResponseSelector, 'getStreamsAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.SET_STREAMS_AUTH_ERROR, authError: true };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getStatusCode fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
        instanceName: 'testInstance',
      });
      spyOn(StreamsRestUtils.icp4d, 'getStreamsAuthToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andCallFake(() => {
        throw new Error();
      });
      spyOn(StateSelector, 'getQueuedAction').andReturn(action);
      spyOn(ResponseSelector, 'getStreamsAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
          instanceName: 'testInstance',
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getQueuedAction fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
        instanceName: 'testInstance',
      });
      spyOn(StreamsRestUtils.icp4d, 'getStreamsAuthToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(200);
      spyOn(StateSelector, 'getQueuedAction').andCallFake(() => {
        throw new Error();
      });
      spyOn(ResponseSelector, 'getStreamsAuthToken').andReturn({ test: 'test' });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
          instanceName: 'testInstance',
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getStreamsAuthToken fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
        instanceName: 'testInstance',
      });
      spyOn(StreamsRestUtils.icp4d, 'getStreamsAuthToken').andReturn(action);
      spyOn(operators, 'delay').andCallFake(() => operators.map(() => of(1)));
      spyOn(ResponseSelector, 'getStatusCode').andReturn(200);
      spyOn(StateSelector, 'getQueuedAction').andReturn(action);
      spyOn(ResponseSelector, 'getStreamsAuthToken').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE,
          instanceName: 'testInstance',
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('getStreamsInstanceEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SET_ICP4D_AUTH_TOKEN,
        authToken: { test: 'test' },
        currentLoginStep: 2
      });
      spyOn(StreamsRestUtils.icp4d, 'getServiceInstances').andReturn(action);
      spyOn(ResponseSelector, 'getStreamsInstances').andReturn({ testInstance: 'testInstance' });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.SET_STREAMS_INSTANCES, streamsInstances: { testInstance: 'testInstance' } };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.icp4d.getServiceInstances fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SET_ICP4D_AUTH_TOKEN,
        authToken: { test: 'test' },
        currentLoginStep: 2
      });
      spyOn(StreamsRestUtils.icp4d, 'getServiceInstances').andCallFake(() => {
        throw new Error();
      });
      spyOn(ResponseSelector, 'getStreamsInstances').andReturn({ testInstance: 'testInstance' });
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getStreamsInstances fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SET_ICP4D_AUTH_TOKEN,
        authToken: { test: 'test' },
        currentLoginStep: 2
      });
      spyOn(StreamsRestUtils.icp4d, 'getServiceInstances').andReturn(action);
      spyOn(ResponseSelector, 'getStreamsInstances').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.SET_ICP4D_AUTH_TOKEN,
          authToken: { test: 'test' },
          currentLoginStep: 2
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('instanceSelectedEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SET_SELECTED_INSTANCE,
        buildId: '001',
        currentLoginStep: 3
      });
      spyOn(StateSelector, 'getSelectedInstanceName').andReturn('testInstance');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE, instanceName: 'testInstance' };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.build.start fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.SET_SELECTED_INSTANCE,
        buildId: '001',
        currentLoginStep: 3
      });
      spyOn(StateSelector, 'getSelectedInstanceName').andCallFake(() => {
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
  describe('refreshToolkitsEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success', () => {
      const action = ActionsObservable.of({
        type: actions.actions.REFRESH_TOOLKITS,
      });
      spyOn(StreamsRestUtils.toolkit, 'getToolkits').andReturn(action);
      spyOn(ResponseSelector, 'getToolkits').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'getToolkitsToCache').andReturn([1, 2]);
      spyOn(StreamsRestUtils.toolkit, 'getToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'cacheToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'refreshLspToolkits').andReturn(action);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_REFRESH_TOOLKITS, };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.toolkit.getToolkits fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.REFRESH_TOOLKITS,
      });
      spyOn(StreamsRestUtils.toolkit, 'getToolkits').andCallFake(() => {
        throw new Error();
      });
      spyOn(ResponseSelector, 'getToolkits').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'getToolkitsToCache').andReturn([1, 2]);
      spyOn(StreamsRestUtils.toolkit, 'getToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'cacheToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'refreshLspToolkits').andReturn(action);
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if ResponseSelector.getToolkits fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.REFRESH_TOOLKITS,
      });
      spyOn(StreamsRestUtils.toolkit, 'getToolkits').andReturn(action);
      spyOn(ResponseSelector, 'getToolkits').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsToolkitsUtils, 'getToolkitsToCache').andReturn([1, 2]);
      spyOn(StreamsRestUtils.toolkit, 'getToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'cacheToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'refreshLspToolkits').andReturn(action);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.REFRESH_TOOLKITS,
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsToolkitsUtils.getToolkitsToCache fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.REFRESH_TOOLKITS,
      });
      spyOn(StreamsRestUtils.toolkit, 'getToolkits').andReturn(action);
      spyOn(ResponseSelector, 'getToolkits').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'getToolkitsToCache').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsRestUtils.toolkit, 'getToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'cacheToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'refreshLspToolkits').andReturn(action);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.REFRESH_TOOLKITS,
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsRestUtils.tookit.getToolkitIndex fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.REFRESH_TOOLKITS,
      });
      spyOn(StreamsRestUtils.toolkit, 'getToolkits').andReturn(action);
      spyOn(ResponseSelector, 'getToolkits').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'getToolkitsToCache').andReturn([1, 2]);
      spyOn(StreamsRestUtils.toolkit, 'getToolkitIndex').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsToolkitsUtils, 'cacheToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'refreshLspToolkits').andReturn(action);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.REFRESH_TOOLKITS,
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsToolkitsUtils.cacheToolkitIndex fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.REFRESH_TOOLKITS,
      });
      spyOn(StreamsRestUtils.toolkit, 'getToolkits').andReturn(action);
      spyOn(ResponseSelector, 'getToolkits').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'getToolkitsToCache').andReturn([1, 2]);
      spyOn(StreamsRestUtils.toolkit, 'getToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'cacheToolkitIndex').andCallFake(() => {
        throw new Error();
      });
      spyOn(StreamsToolkitsUtils, 'refreshLspToolkits').andReturn(action);
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.REFRESH_TOOLKITS,
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StreamsToolkitsUtils.refreshLspToolkits fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.REFRESH_TOOLKITS,
      });
      spyOn(StreamsRestUtils.toolkit, 'getToolkits').andReturn(action);
      spyOn(ResponseSelector, 'getToolkits').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'getToolkitsToCache').andReturn([1, 2]);
      spyOn(StreamsRestUtils.toolkit, 'getToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'cacheToolkitIndex').andReturn(action);
      spyOn(StreamsToolkitsUtils, 'refreshLspToolkits').andCallFake(() => {
        throw new Error();
      });
      const state = getState$(store);
      const expectedOutput = {
        type: actions.actions.ERROR,
        sourceAction: {
          type: actions.actions.REFRESH_TOOLKITS,
        },
        error: new Error()
      };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
  describe('packageActivatedEpic', () => {
    let store = {};
    beforeEach(() => {
      const epicMiddleware = createEpicMiddleware();
      store = createStore(rootReducer, applyMiddleware(epicMiddleware));
      epicMiddleware.run(rootEpic);
    });
    it('should handle success with remember password set to true', () => {
      const action = ActionsObservable.of({
        type: actions.actions.PACKAGE_ACTIVATED,
      });
      spyOn(StateSelector, 'getUsername').andReturn('testUser');
      spyOn(StateSelector, 'getRememberPassword').andReturn(true);
      spyOn(KeychainUtils, 'getCredentials').andReturn('testPassword');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.SET_FORM_DATA_FIELD, key: 'password', value: 'testPassword' };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle success with remember password set to false', () => {
      const action = ActionsObservable.of({
        type: actions.actions.PACKAGE_ACTIVATED,
      });
      spyOn(StateSelector, 'getUsername').andReturn('testUser');
      spyOn(StateSelector, 'getRememberPassword').andReturn(false);
      spyOn(KeychainUtils, 'getCredentials').andReturn('testPassword');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.POST_PACKAGE_ACTIVATED };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getUsername fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.PACKAGE_ACTIVATED,
      });
      spyOn(StateSelector, 'getUsername').andCallFake(() => {
        throw new Error();
      });
      spyOn(StateSelector, 'getRememberPassword').andReturn(true);
      spyOn(KeychainUtils, 'getCredentials').andReturn('testPassword');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getRememberPassword fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.PACKAGE_ACTIVATED,
      });
      spyOn(StateSelector, 'getUsername').andReturn('testUser');
      spyOn(StateSelector, 'getRememberPassword').andCallFake(() => {
        throw new Error();
      });
      spyOn(KeychainUtils, 'getCredentials').andReturn('testPassword');
      const state = getState$(store);
      const expectedOutput = { type: actions.actions.ERROR, sourceAction: action, error: new Error() };
      rootEpic(action, state)
        .subscribe((output) => {
          expect(output).toEqual(expectedOutput);
        });
    });
    it('should handle failure if StateSelector.getUsername fails', () => {
      const action = ActionsObservable.of({
        type: actions.actions.PACKAGE_ACTIVATED,
      });
      spyOn(StateSelector, 'getUsername').andReturn('testUser');
      spyOn(StateSelector, 'getRememberPassword').andReturn(true);
      spyOn(KeychainUtils, 'getCredentials').andCallFake(() => {
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
});
