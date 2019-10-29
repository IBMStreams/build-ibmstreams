'use babel';
'use strict';

import { createStore, applyMiddleware, compose } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
// import { composeWithDevTools } from 'remote-redux-devtools';

import { rootReducer, rootEpic } from '..';

const epicMiddleware = createEpicMiddleware();

let store;

const composeEnhancers = compose; // atom.inDevMode() && composeWithDevTools ? composeWithDevTools({ hostname: 'localhost', port: 8000, realtime: true }) : compose;

const addLoggingToDispatch = (s) => {
  const rawDispatch = s.dispatch;
  return (action) => {
    if (atom.inDevMode()) {
      console.log('store dispatch receiving action:', action);
    }
    return rawDispatch(action);
  };
};

export default function getStore() {
  if (!store) {
    store = createStore(
      rootReducer,
      composeEnhancers(
        applyMiddleware(epicMiddleware)
      )
    );
    store.dispatch = addLoggingToDispatch(store);

    epicMiddleware.run(rootEpic);
  }
  return store;
}
