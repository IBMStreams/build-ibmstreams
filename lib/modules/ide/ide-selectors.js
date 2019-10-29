'use babel';
'use strict';

/* eslint-disable import/prefer-default-export */

import { createSelector } from 'reselect';
import { Map } from 'immutable';

/**
 * build state selectors
 */

const getBase = (state) => state.get('ide');

const getPackageActivated = createSelector(
  getBase,
  (base = Map()) => base.getIn(['packageActivated'])
);

const getBuildOriginator = createSelector(
  getBase,
  (base = Map()) => base.getIn(['buildOriginator'])
);

const getQueuedAction = createSelector(
  getBase,
  (base = Map()) => base.getIn(['queuedAction'])
);

const getToolkitsCacheDir = createSelector(
  getBase,
  base => base.getIn(['toolkitsCacheDir'])
);

const getToolkitsPathSetting = createSelector(
  getBase,
  base => base.getIn(['toolkitsPathSetting'])
);

export const ideSelectors = {
  getPackageActivated,
  getBuildOriginator,
  getQueuedAction,

  getToolkitsCacheDir,
  getToolkitsPathSetting,
};
