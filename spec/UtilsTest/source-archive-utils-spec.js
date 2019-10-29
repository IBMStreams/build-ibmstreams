'use babel';

// import { expect } from 'chai';


import * as path from 'path';
import MessageHandler from '../../lib/MessageHandler';

import { SourceArchiveUtils, MessageHandlerRegistry } from '../../lib/modules';

describe('source-archive-utils', () => {
  const toolkitsPath = `${__dirname}${path.sep}..${path.sep}BuildTest${path.sep}BuildSourceArchive${path.sep}toolkits${path.sep}streamsx.inet-2.9.6`;
  const appRoot = `${__dirname}${path.sep}..${path.sep}splFiles`;
  describe('getToolkits()', () => {
    const toolkits = SourceArchiveUtils.getToolkits(undefined, toolkitsPath, `${appRoot}${path.sep}utils`);
    const expectedOutput = [{ name: 'com.ibm.streamsx.inet', tkPath: `${toolkitsPath}${path.sep}com.ibm.streamsx.inet` }];
    it('gets all local toolkits specified inside the info.xml file', () => {
      expect(toolkits).toEqual(expectedOutput);
    });
  });
  describe('observableBuildSourceArchive()', () => {
    const fqn = 'test';
    let observableArchive;
    let messageHandler;
    const expectedPath = `${__dirname}${path.sep}..${path.sep}splFiles${path.sep}simple${path.sep}.build_test_1000.zip`;
    const expectedOutput = {
      type: 'SOURCE_ARCHIVE_CREATED',
      archivePath: expectedPath,
      buildId: undefined
    };
    beforeEach(async () => {
      messageHandler = new MessageHandler(console);
      MessageHandlerRegistry.add(fqn, messageHandler);
      observableArchive = await SourceArchiveUtils.buildSourceArchive(
        {
          appRoot: `${appRoot}${path.sep}simple`,
          toolkitPathSetting: toolkitsPath,
          fqn,
          messageHandler
        }
      );
    });
    it('tests the observableBuildSourceArchive() function', () => {
      expect(observableArchive).toEqual(expectedOutput);
    });
  });
  describe('getApplicationRoot()', () => {
    const projectPaths = [__dirname];
    const selectedFile = `${__dirname}${path.sep}..${path.sep}splFiles${path.sep}utils${path.sep}twoCompositesApp.spl`;
    let appRootT;
    const expectedOutput = `${__dirname}${path.sep}..${path.sep}splFiles${path.sep}utils`;
    beforeEach(() => {
      appRootT = SourceArchiveUtils.getApplicationRoot(projectPaths, selectedFile);
    });
    it('gets the application root path', () => {
      expect(appRootT).toEqual(expectedOutput);
    });
  });
});
