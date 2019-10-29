'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

import * as path from 'path';
import { createSelector } from 'reselect';
import { Map } from 'immutable';

/**
 * build state selectors
 */

const getBase = (state) => state.get('buildV5');

const getBuilds = createSelector(
  getBase,
  (base = Map()) => base.getIn(['builds'])
);

// temporary build details; before getting a build id
const getNewBuild = createSelector(
  getBase,
  (base = Map()) => base.getIn(['tempNewBuild'])
);

// build
const getBuild = (state, buildId) => {
  const builds = getBuilds(state);
  if (builds) {
    return builds.get(buildId);
  }
  return {};
};

const getPostBuildAction = (state, buildId) => {
  const build = getBuild(state, buildId);
  if (build) {
    return build.get('postBuildAction') || '';
  }
  return '';
};

const getBuildAppRoot = (state, buildId) => getBuild(state, buildId).get('appRoot');

const getBuildStatus = (state, buildId) => getBuild(state, buildId).get('status');

const getBuildLogMessages = (state, buildId) => getBuild(state, buildId).get('logMessages');

const getBuildArtifacts = (state, buildId) => getBuild(state, buildId).get('artifacts');

// artifact object for specific artifact id of build
const getBuildArtifact = (state, buildId, artifactId) => getBuildArtifacts(state, buildId).find(artifact => artifact.id === artifactId);

// computed fs path to  use for downloading artifact
const getOutputArtifactFilePath = (state, buildId, artifactId) => {
  const artifact = getBuildArtifact(state, buildId, artifactId);
  const projectPath = getBuildAppRoot(state, buildId);
  return `${projectPath}/output/${artifact.name}`;
};

const getBuildDisplayIdentifier = (state, buildId) => {
  const build = getBuild(state, buildId);
  return build.get('makefilePath') ? `${path.basename(build.get('appRoot'))}${path.sep}${path.relative(build.get('appRoot'), build.get('makefilePath'))}` : build.get('fqn');
};
const getMessageHandlerIdentifier = (state, buildId) => {
  const build = getBuild(state, buildId);
  return build.get('fqn') || build.get('makefilePath');
};

export const buildV5Selectors = {
  getNewBuild,
  getBuild,
  getBuildStatus,
  getBuildAppRoot,
  getBuildLogMessages,
  getPostBuildAction,
  getBuildDisplayIdentifier,
  getBuildArtifacts,
  getBuildArtifact,
  getOutputArtifactFilePath,
  getMessageHandlerIdentifier
};
