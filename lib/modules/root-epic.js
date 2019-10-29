'use babel';
'use strict';

import { combineEpics } from 'redux-observable';

import { buildV5Epics } from './build/v5';
import { connectionV5Epics } from './connection/v5';
import { submitV5Epics } from './submit/v5';
import { ideEpics } from './ide';


const rootEpic = combineEpics(
  ...ideEpics,
  ...buildV5Epics,
  ...connectionV5Epics,
  ...submitV5Epics,
);

export default rootEpic;
