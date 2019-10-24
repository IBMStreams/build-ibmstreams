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

  setStreamsAccessTokenUrl,

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
  mergeMap(([a, s]) => StreamsRestUtils.hostExists(StateSelector.getIcp4dUrl(s)).pipe(
    tap((response) => a.successFn()),
    catchError(error => {
      a.errorFn();
      return of(handleError(a, error));
    })
  )),
  map(() => ({ type: actions.POST_CHECK_HOST_EXISTS })),
  catchError(error => of(handleError(action, error)))
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
          icp4dAuthDelayObservable().pipe(
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
  )),
  catchError(error => of(handleError(action, error)))
);

const streamsOnIcp4dAuthEpic = (action, state) => action.pipe(
  ofType(actions.AUTHENTICATE_ICP4D_STREAMS_INSTANCE),
  withLatestFrom(state),
  mergeMap(([authAction, s]) => StreamsRestUtils.icp4d.getStreamsAuthToken(s, authAction.instanceName).pipe(
    mergeMap(authTokenResponse => {
      const statusCode = ResponseSelector.getStatusCode(authTokenResponse);
      if (statusCode === 200) {
        return merge(
          of(setStreamsAuthToken(ResponseSelector.getStreamsAuthToken(authTokenResponse))),
          of(setStreamsAuthError(false)),
          of(refreshToolkits()),
          getQueuedActionObservable(s),
          icp4dAuthDelayObservable().pipe(
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
  )),
  catchError(error => of(handleError(action, error)))
);

const getStreamsInstancesEpic = (action, state) => action.pipe(
  ofType(actions.SET_ICP4D_AUTH_TOKEN),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.icp4d.getServiceInstances(s).pipe(
    map(serviceInstancesResponse => ResponseSelector.getStreamsInstances(serviceInstancesResponse)),
    map(streamsInstances => setStreamsInstances(streamsInstances)),
    catchError(error => of(handleError(a, error)))
  )),
  catchError(error => of(handleError(action, error)))
);

const instanceSelectedEpic = (action, state) => action.pipe(
  ofType(actions.SET_SELECTED_INSTANCE),
  withLatestFrom(state),
  map(([a, s]) => authenticateIcp4dStreamsInstance(StateSelector.getSelectedInstanceName(s))), catchError(error => of(handleError(action, error)))
);

const streamsStandaloneAuthEpic = (action, state) => action.pipe(
  ofType(actions.AUTHENTICATE_STANDALONE_STREAMS_INSTANCE),
  // withLatestFrom(state),
  // mergeMap(([authAction, s]) => {
  //   const authTokenUrl = StateSelector.getStandaloneAuthTokenUrl(s);
  //   if (authTokenUrl) {
  //     return StreamsRestUtils.streams.getStreamsStandaloneAuthToken(s, authAction.username, authAction.password).pipe(

  //     )
  //   }
  //   StreamsRestUtils.streams.getStreamsResources(s, authAction.username, authAction.password).pipe(
  //     mergeMap(resourcesResponse => {
  //       const statusCode = ResponseSelector.getStatusCode(resourcesResponse);
  //       if (statusCode === 200) {
  //         const accessTokenUrl = ResponseSelector.getAccessTokenUrl(resourcesResponse);
  //         if (accessTokenUrl) {
  //           return
  //         }
  //       }
  //       return of(setStreamsAuthError(true));
  //     })
  //   )
  // })
);

const getStandaloneAuthTokenUrlEpic = (action, state) => action.pipe(
  ofType(actions.GET_STREAMS_STANDALONE_ACCESS_TOKEN_URL),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.streams.getStreamsResources(s, a.username, a.password).pipe(
    mergeMap(resourcesResponse => {
      const statusCode = ResponseSelector.getStatusCode(resourcesResponse);
      if (statusCode === 200) {
        const accessTokenUrl = ResponseSelector.getAccessTokenUrl(resourcesResponse);
        if (accessTokenUrl) {
          return of(setStreamsAccessTokenUrl(accessTokenUrl));
        }
      }
      return of(setStreamsAuthError(true));
    })
  ))
);

const getQueuedActionObservable = (state) => {
  return StateSelector.getQueuedAction(state) ? merge(
    of(StateSelector.getQueuedAction(state)), // if there was a queued action, pass it now
    of(clearQueuedAction())
  ) : of();
};

const streamsStandaloneAuthDelayObservable = () => {
  return of(1).pipe(
    delay(235 * 60 * 1000) // standalone streams auth tokens expire after 4 hours
  );
};

const icp4dAuthDelayObservable = () => {
  return of(1).pipe(
    delay(19.5 * 60 * 1000) // icp4d auth tokens expire after 20 minutes
  );
};

const connectionEpics = [
  hostExistsEpic,
  icp4dAuthEpic,
  streamsOnIcp4dAuthEpic,
  instanceSelectedEpic,
  getStreamsInstancesEpic,
  streamsStandaloneAuthEpic,
  getStandaloneAuthTokenUrlEpic,
];

export default connectionEpics;
