'use babel';
'use strict';

import { ofType } from 'redux-observable';
import {
  map,
  mergeMap,
  tap,
  delay,
  withLatestFrom,
  catchError,
} from 'rxjs/operators';
import {
  of,
  merge,
} from 'rxjs';

import {
  actions,

  handleError,

  authenticateIcp4d,
  authenticateIcp4dStreamsInstance,

  clearQueuedAction,

  setStreamsInstances,
  setIcp4dAuthToken,
  setIcp4dAuthError,
  setStreamsAuthToken,
  setStreamsAuthError,

  refreshToolkits,
} from '../actions';
import {
  StateSelector,
  ResponseSelector,
  StreamsRestUtils,
  KeychainUtils,
} from '../util';


const hostExistsEpic = (action, state) => action.pipe(
  ofType(actions.CHECK_HOST_EXISTS),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.icp4d.icp4dHostExists(s).pipe(
    tap((response) => a.successFn()),
    catchError(error => {
      a.errorFn();
      return of(handleError(a, error));
    })
  )),
  map(() => ({ type: actions.POST_CHECK_HOST_EXISTS })), catchError(error => of(handleError(action, error)))
);

const icp4dAuthEpic = (action, state) => action.pipe(
  ofType(actions.AUTHENTICATE_ICP4D),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.icp4d.getIcp4dToken(s, a.username, a.password).pipe(
    mergeMap(authTokenResponse => {
      const statusCode = ResponseSelector.getStatusCode(authTokenResponse);
      if (statusCode === 200) {
        if (a.rememberPassword) {
          KeychainUtils.addCredentials(a.username, a.password);
        } else {
          KeychainUtils.deleteCredentials(a.username);
        }
        return merge(
          of(setIcp4dAuthToken(ResponseSelector.getIcp4dAuthToken(authTokenResponse))),
          of(setIcp4dAuthError(false)),
          authDelayObservable().pipe(
            tap(() => {
              console.log('reauthenticating to icp4d');
            }),
            mergeMap(() => of(authenticateIcp4d(a.username, a.password, a.rememberPassword))),
            catchError(error => of(handleError(a, error)))
          ),
        );
      }
      return of(setIcp4dAuthError(statusCode));
    }),
    catchError(error => of(handleError(a, error)))
  )), catchError(error => of(handleError(action, error)))
);

const authDelayObservable = () => {
  return of(1).pipe(
    delay(19.5 * 60 * 1000) // icp4d auth tokens expire after 20 minutes
  );
};

const streamsAuthEpic = (action, state) => action.pipe(
  ofType(actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE),
  withLatestFrom(state),
  mergeMap(([authAction, s]) => StreamsRestUtils.icp4d.getStreamsAuthToken(s, authAction.instanceName).pipe(
    mergeMap(authTokenResponse => {
      const statusCode = ResponseSelector.getStatusCode(authTokenResponse);
      if (statusCode === 200) {
        const queuedActionObservable = StateSelector.getQueuedAction(s) ? merge(
          of(StateSelector.getQueuedAction(s)), // if there was a queued action, run it now...
          of(clearQueuedAction())
        ) : of();
        return merge(
          of(setStreamsAuthToken(ResponseSelector.getStreamsAuthToken(authTokenResponse))),
          of(setStreamsAuthError(false)),
          of(refreshToolkits()),
          queuedActionObservable,
          authDelayObservable().pipe(
            tap(() => {
              console.log('reauthenticating to streams instance');
            }),
            mergeMap(() => of(authenticateIcp4dStreamsInstance(authAction.instanceName))),
            catchError(error => of(handleError(authAction, error)))
          )
        );
      }
      return of(setStreamsAuthError(true));
    }),
    catchError(error => of(handleError(authAction, error)))
  )), catchError(error => of(handleError(action, error)))
);

const getStreamsInstancesEpic = (action, state) => action.pipe(
  ofType(actions.SET_ICP4D_AUTH_TOKEN),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.icp4d.getServiceInstances(s).pipe(
    map(serviceInstancesResponse => ResponseSelector.getStreamsInstances(serviceInstancesResponse)),
    map(streamsInstances => setStreamsInstances(streamsInstances)),
    catchError(error => of(handleError(a, error)))
  )), catchError(error => of(handleError(action, error)))
);

const instanceSelectedEpic = (action, state) => action.pipe(
  ofType(actions.SET_SELECTED_INSTANCE),
  withLatestFrom(state),
  map(([a, s]) => authenticateIcp4dStreamsInstance(StateSelector.getSelectedInstanceName(s))), catchError(error => of(handleError(action, error)))
);

const connectionEpics = [
  hostExistsEpic,
  icp4dAuthEpic,
  streamsAuthEpic,
  instanceSelectedEpic,
  getStreamsInstancesEpic,
];

export default connectionEpics;
