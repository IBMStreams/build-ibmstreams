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
  connectionV5Selectors as ConnV5Selectors,
  actionTypes,

  authenticateIcp4d,
  authenticateIcp4dStreamsInstance,

  setStreamsInstances,
  setIcp4dAuthToken,
  setIcp4dAuthError,
  setStreamsAuthToken,
  setStreamsAuthError,

  setStreamsAccessTokenUrl,
} from '.';
import {
  handleError,
  clearQueuedAction,
  ideSelectors as IdeSelectors
} from '../../ide';
import { refreshToolkits } from '../../build/v5';
import {
  ResponseSelector,
  StreamsRestUtils,
  KeychainUtils,
} from '../..';
import { setStreamsRestUrl } from './connection-v5-actions';
import { CONFIG } from '../../constants';


const hostExistsEpic = (action, state) => action.pipe(
  ofType(actionTypes.CHECK_HOST_EXISTS),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.hostExists(ConnV5Selectors.getIcp4dUrl(s)).pipe(
    tap((response) => a.successFn()),
    catchError(error => {
      a.errorFn();
      return of(handleError(a, error));
    })
  )),
  map(() => ({ type: actionTypes.POST_CHECK_HOST_EXISTS })),
  catchError(error => of(handleError(action, error)))
);

const icp4dAuthEpic = (action, state) => action.pipe(
  ofType(actionTypes.AUTHENTICATE_ICP4D),
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
  ofType(actionTypes.AUTHENTICATE_ICP4D_STREAMS_INSTANCE),
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
  ofType(actionTypes.SET_ICP4D_AUTH_TOKEN),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.icp4d.getServiceInstances(s).pipe(
    map(serviceInstancesResponse => ResponseSelector.getStreamsInstances(serviceInstancesResponse)),
    map(streamsInstances => setStreamsInstances(streamsInstances)),
    catchError(error => of(handleError(a, error)))
  )),
  catchError(error => of(handleError(action, error)))
);

const instanceSelectedEpic = (action, state) => action.pipe(
  ofType(actionTypes.SET_SELECTED_CP4D_STREAMS_INSTANCE),
  withLatestFrom(state),
  map(([a, s]) => authenticateIcp4dStreamsInstance(ConnV5Selectors.getSelectedInstanceName(s))), catchError(error => of(handleError(action, error)))
);

const streamsStandaloneAuthEpic = (action, state) => action.pipe(
  ofType(actionTypes.SET_STREAMS_ACCESS_TOKEN_URL),
  withLatestFrom(state),
  mergeMap(([authAction, s]) => {
    return StreamsRestUtils.streams.getStreamsStandaloneAuthToken(s, authAction.username, authAction.password).pipe(
      mergeMap(authTokenResponse => {
        const statusCode = ResponseSelector.getStatusCode(authTokenResponse);
        if (statusCode === 200) {
          return merge(
            of(setStreamsAuthToken(ResponseSelector.getStandaloneAccessToken(authTokenResponse))),
            // of(setStreamsAuthError(false)),
            getQueuedActionObservable(s),
          );
        }
        // return of(setStreamsAuthError(true));
        return of();
      })
    );
  })
);

const setStreamsAuthTokenEpic = (action, state) => action.pipe(
  ofType(actionTypes.SET_STREAMS_AUTH_TOKEN),
  withLatestFrom(state),
  mergeMap(([setTokenAction, s]) => {
    if (ConnV5Selectors.getActiveStreamsInstanceType(s) === CONFIG.TARGET_V5_STANDALONE) {
      return StreamsRestUtils.streams.getStreamsInstanceRestResources(s).pipe(
        mergeMap(instanceResourcesResponse => {
          const statusCode = ResponseSelector.getStatusCode(instanceResourcesResponse);
          if (statusCode === 200) {
            const restUrl = ResponseSelector.getInstanceSelfRestUrl(instanceResourcesResponse);
            return of(setStreamsRestUrl(restUrl));
          }
        })
      );
    }
    return of();
  }),
);

const getStandaloneAuthTokenUrlEpic = (action, state) => action.pipe(
  ofType(actionTypes.GET_STREAMS_STANDALONE_ACCESS_TOKEN_URL),
  withLatestFrom(state),
  mergeMap(([a, s]) => StreamsRestUtils.streams.getStreamsResources(s, a.username, a.password).pipe(
    mergeMap(resourcesResponse => {
      console.log('resourcesResponse', resourcesResponse);
      const statusCode = ResponseSelector.getStatusCode(resourcesResponse);
      if (statusCode === 200) {
        const accessTokenUrl = ResponseSelector.getAccessTokenUrl(resourcesResponse);
        if (accessTokenUrl) {
          return of(setStreamsAccessTokenUrl(accessTokenUrl, a.username, a.password));
        }
      }
      return of();
    })
  ))
);

const getQueuedActionObservable = (state) => {
  return IdeSelectors.getQueuedAction(state) ? merge(
    of(IdeSelectors.getQueuedAction(state)), // if there was a queued action, pass it now
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
  setStreamsAuthTokenEpic,
];

export default connectionEpics;
