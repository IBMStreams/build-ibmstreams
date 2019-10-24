'use babel';
'use strict';

import { combineEpics, ofType } from 'redux-observable';
import {
  map,
  tap,
  withLatestFrom,
  catchError,
} from 'rxjs/operators';
import {
  of,
} from 'rxjs';

import buildV5Epics from './build-v5-epics';
import connectionV5Epics from './connection-v5-epics';
import submitV5Epics from './submit-v5-epics';

import {
  actions,
  handleError,
  setFormDataField,
} from '../actions';
import {
  StateSelector,
  KeychainUtils,
} from '../util';
import MessageHandlerRegistry from '../message-handler-registry';

const openStreamsConsoleEpic = (action, state) => action.pipe(
  ofType(actions.OPEN_STREAMS_CONSOLE),
  withLatestFrom(state),
  tap(([a, s]) => {
    MessageHandlerRegistry.openUrl(StateSelector.getStreamsConsoleUrl(s));
  }),
  map(() => ({ type: actions.POST_OPEN_STREAMS_CONSOLE })), catchError(error => of(handleError(action, error)))
);

const packageActivatedEpic = (action, state) => action.pipe(
  ofType(actions.PACKAGE_ACTIVATED),
  withLatestFrom(state),
  map(([a, s]) => {
    const username = StateSelector.getUsername(s);
    const rememberPassword = StateSelector.getRememberPassword(s);
    if (username && rememberPassword) {
      const password = KeychainUtils.getCredentials(username);
      if (password) {
        return setFormDataField('password', password);
      }
    }
    return { type: actions.POST_PACKAGE_ACTIVATED };
  }), catchError(error => of(handleError(action, error)))
);

const errorHandlingEpic = (action, state) => action.pipe(
  ofType(actions.ERROR),
  withLatestFrom(state),
  tap(([a, s]) => {
    console.error('error occurred in action: ', a.sourceAction.type, '\nerror: ', a.error);
    if (typeof a.error === 'string') {
      MessageHandlerRegistry.getDefault().handleError(a.error, { detail: a.sourceAction.type });
    } else if (a.error) {
      MessageHandlerRegistry.getDefault().handleError(a.error.message, { detail: `Error occurred during ${a.sourceAction.type}`, stack: a.error.stack });
    }
  }),
  map(() => ({ type: actions.POST_ERROR })), catchError((error) => of(handleError(action, error)))
);

const rootEpic = combineEpics(
  errorHandlingEpic,
  openStreamsConsoleEpic,
  packageActivatedEpic,

  ...buildV5Epics,
  ...connectionV5Epics,
  ...submitV5Epics,
);

export default rootEpic;
