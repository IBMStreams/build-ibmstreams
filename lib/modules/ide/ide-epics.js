'use babel';
'use strict';

import { ofType } from 'redux-observable';
import {
  map,
  tap,
  withLatestFrom,
  catchError,
} from 'rxjs/operators';
import {
  of,
} from 'rxjs';

import {
  actionTypes,
  handleError,
} from './ide-actions';

import { setFormDataField, connectionV5Selectors as ConnV5Selectors } from '../connection/v5';

import {
  KeychainUtils,
  MessageHandlerRegistry
} from '../util';


const openStreamsConsoleEpic = (action, state) => action.pipe(
  ofType(actionTypes.OPEN_STREAMS_CONSOLE),
  withLatestFrom(state),
  tap(([a, s]) => {
    MessageHandlerRegistry.openUrl(ConnV5Selectors.getStreamsConsoleUrl(s));
  }),
  map(() => ({ type: actionTypes.POST_OPEN_STREAMS_CONSOLE })), catchError(error => of(handleError(action, error)))
);

const packageActivatedEpic = (action, state) => action.pipe(
  ofType(actionTypes.PACKAGE_ACTIVATED),
  withLatestFrom(state),
  map(([a, s]) => {
    const username = ConnV5Selectors.getUsername(s);
    const rememberPassword = ConnV5Selectors.getRememberPassword(s);
    if (username && rememberPassword) {
      const password = KeychainUtils.getCredentials(username);
      if (password) {
        return setFormDataField('password', password);
      }
    }
    return { type: actionTypes.POST_PACKAGE_ACTIVATED };
  }), catchError(error => of(handleError(action, error)))
);

const errorHandlingEpic = (action, state) => action.pipe(
  ofType(actionTypes.ERROR),
  withLatestFrom(state),
  tap(([a, s]) => {
    console.error('error occurred in action: ', a.sourceAction.type, '\nerror: ', a.error);
    if (typeof a.error === 'string') {
      MessageHandlerRegistry.getDefault().handleError(a.error, { detail: a.sourceAction.type });
    } else if (a.error) {
      MessageHandlerRegistry.getDefault().handleError(a.error.message, { detail: `Error occurred during ${a.sourceAction.type}`, stack: a.error.stack });
    }
  }),
  map(() => ({ type: actionTypes.POST_ERROR })), catchError((error) => of(handleError(action, error)))
);

const ideEpics = [
  openStreamsConsoleEpic,
  packageActivatedEpic,
  errorHandlingEpic
];

export default ideEpics;
