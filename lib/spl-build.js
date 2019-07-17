'use babel';
'use strict';

import * as fs from 'fs';
import path from 'path';
import * as _ from 'lodash';

import * as electron from 'electron';
import { CompositeDisposable } from 'atom';

import MessageHandler from './MessageHandler';
import MessageHandlerRegistry from './message-handler-registry';
import LintHandler from './LintHandler';
import LintHandlerRegistry from './lint-handler-registry';
import SplBuildCommonV4, { SplBuilder } from './spl-build-common';
import MainCompositePickerView from './views/MainCompositePickerView';
import Icp4dAuthenticationView from './views/icp4dAuth/Icp4dAuthenticationView';

import {
  StateSelector,
  KeychainUtils,
  StreamsUtils,
  SourceArchiveUtils,
  StreamsToolkitsUtils,
  StreamsRestUtils
} from './util';
import {
  setIcp4dUrl,
  queueAction,
  newBuild,
  submitApplicationsFromBundleFiles,
  setToolkitsCacheDir,
  setToolkitsPathSetting,
  setUsername,
  setRememberPassword,
  setFormDataField,
  setBuildOriginator,
  setUseIcp4dMasterNodeHost,
  resetAuth,
  packageActivated,
  refreshToolkits,
  checkIcp4dHostExists
} from './actions';
import getStore from './redux-store/configure-store';

import { version } from '../package.json';

const CONF_TOOLKITS_PATH = 'ide-ibmstreams.toolkitsPath';
const CONF_STREAMING_ANALYTICS_CREDENTIALS = 'build-ibmstreams.streamingAnalytics.credentials';
const CONF_ICP4D_URL = 'build-ibmstreams.icp4d.url';
const CONF_USE_ICP4D_MASTER_NODE_HOST = 'build-ibmstreams.icp4d.useMasterNodeHost';
const CONF_API_VERSION = 'build-ibmstreams.buildApiVersion';
const CONF_API_VERSION_V4 = 'v4';
const CONF_API_VERSION_V5 = 'v5';
const CONF_REQUEST_TIMEOUT = 'build-ibmstreams.requestTimeout';

function updateIcp4dUrl(urlString) {
  try {
    const url = new URL(urlString); /* eslint-disable-line compat/compat */
    const prunedUrl = `${url.protocol || 'https:'}//${url.host}`;
    getStore().dispatch(setIcp4dUrl(prunedUrl));
  } catch (err) {
    getStore().dispatch(setIcp4dUrl(null));
  }
}

export default {

  config: {
    buildApiVersion: {
      title: 'Build and submit system',
      type: 'string',
      default: CONF_API_VERSION_V4,
      order: 0,
      description: 'Building for Streams on IBM Cloud Pak for Data or Streaming analytics on public IBM Cloud',
      enum: [
        { value: CONF_API_VERSION_V4, description: 'IBM Cloud Streaming Analytics service' },
        { value: CONF_API_VERSION_V5, description: 'IBM Cloud Pak for Data Streams Add-on' }
      ]
    },
    requestTimeout: {
      title: 'Request timeout (seconds)',
      type: 'integer',
      default: 30,
      order: 1,
      description: 'Number of seconds before a request times out'
    },
    streamingAnalytics: {
      type: 'object',
      title: 'IBM Cloud Streaming Analytics',
      order: 3,
      properties: {
        credentials: {
          title: 'IBM Streaming Analytics Credentials',
          type: 'string',
          default: '',
          description: 'Credentials for an IBM Streaming Analytics service.'
        }
      }
    },
    icp4d: {
      type: 'object',
      title: 'IBM Cloud Pak for Data Streams Add-on',
      order: 2,
      properties: {
        url: {
          title: 'IBM Cloud Pak for Data url',
          type: 'string',
          default: '',
          description: 'Url for IBM Cloud Pak for Data - [Refresh toolkits](atom://build-ibmstreams/toolkits/refresh)'
        },
        useMasterNodeHost: {
          title: 'Use the IBM Cloud Pak for Data host for all requests',
          type: 'boolean',
          default: true,
          description: 'Use the host specified for the IBM Cloud Pak for Data url for builds'
        }
      }
    },
  },

  subscriptions: null,
  storeSubscription: null,
  mainCompositeSelectorPanel: null,
  mainCompositePickerView: null,
  icp4dAuthenticationPanel: null,
  icp4dAuthenticationView: null,

  linterService: null,
  consoleService: null,
  treeView: null,

  lintHandler: null,
  messageHandler: null,
  openUrlHandler: null,
  splBuilder: null,

  streamingAnalyticsCredentials: null,
  appRoot: null,
  toolkitRoot: null,
  action: null,
  apiVersion: null,
  atomIdeUiPackageInstalled: null,

  initialize(state) {},
  checkAtomIdeUiInstalled() {
    if (this.atomIdeUiPackageInstalled) {
      return true;
    }
    let notification;
    const button = [
      {
        label: 'Install',
        callbackFn: () => {
          atom.workspace.open('atom://config/packages/atom-ide-ui');
          notification.dismiss();
        }
      },
    ];
    const addedButtons = this.processButtons(button);
    const notificationOptions = {
      ...addedButtons,
      dismissable: true,
      description: 'The build-ibmstreams package requires the atom-ide-ui package to be installed for all features to work as intended. Reload Atom after the installation is complete.'
    };
    const available = atom.packages.getAvailablePackageNames();
    const isInstalled = available.includes('atom-ide-ui');
    if (!isInstalled) {
      notification = atom.notifications.addWarning('atom-ide-ui is not installed', notificationOptions);
      return notification;
    }
    this.atomIdeUiPackageInstalled = true;
  },
  processButtons(btns) {
    const buttons = {};
    if (Array.isArray(btns)) {
      buttons.buttons = btns.map(obj => ({ onDidClick: obj.callbackFn, text: obj.label }));
    }
    return buttons;
  },

  activate(state) {
    console.log('spl-build:activate');
    this.checkAtomIdeUiInstalled();
    this.subscriptions = new CompositeDisposable();

    this.registerCommands();
    this.registerContextMenu();

    MessageHandlerRegistry.setSendLspNotificationHandler((param) => this.toolkitInitService.updateLspToolkits(param));

    // migrate settings if old config is set
    const streamingAnalyticsOld = 'build-ibmstreams.streamingAnalyticsCredentials';
    if (atom.config.get(streamingAnalyticsOld)) {
      atom.config.set(CONF_STREAMING_ANALYTICS_CREDENTIALS, atom.config.get(streamingAnalyticsOld));
      atom.config.unset(streamingAnalyticsOld);
    }

    // Atom config listeners
    this.subscriptions.add(
      atom.config.onDidChange(CONF_ICP4D_URL, {}, (event) => {
        try {
          // clear any currently saved auth details
          getStore().dispatch(resetAuth());
          const parsedUrl = new URL(event.newValue); // eslint-disable-line compat/compat
          updateIcp4dUrl(parsedUrl);
        } catch (err) { /* do nothing */ }
      })
    );
    this.subscriptions.add(
      atom.config.onDidChange(CONF_USE_ICP4D_MASTER_NODE_HOST, {}, (event) => {
        getStore().dispatch(setUseIcp4dMasterNodeHost(event.newValue));
      })
    );
    this.subscriptions.add(
      atom.config.onDidChange(CONF_API_VERSION, {}, (event) => {
        this.apiVersion = event.newValue;
      })
    );
    this.subscriptions.add(
      atom.config.onDidChange(CONF_REQUEST_TIMEOUT, {}, (event) => {
        StreamsRestUtils.setTimeout(event.newValue);
        SplBuildCommonV4.setTimeout(event.newValue);
      })
    );

    // initialize from config values
    this.apiVersion = atom.config.get(CONF_API_VERSION);
    if (!StateSelector.getIcp4dUrl(getStore().getState())) {
      updateIcp4dUrl(atom.config.get(CONF_ICP4D_URL));
    }
    if (!StateSelector.getUseIcp4dMasterNodeHost(getStore().getState())) {
      getStore().dispatch(setUseIcp4dMasterNodeHost(atom.config.get(CONF_USE_ICP4D_MASTER_NODE_HOST)));
    }
    const timeout = atom.config.get(CONF_REQUEST_TIMEOUT);
    StreamsRestUtils.setTimeout(timeout);
    SplBuildCommonV4.setTimeout(timeout);


    this.storeSubscription = getStore().subscribe(() => {
      if (atom.inDevMode()) {
        console.log('Store subscription updated state: ', getStore().getState());
      }
    });

    this.openUrlHandler = url => electron.shell.openExternal(url);
    MessageHandlerRegistry.setOpenUrlHandler(this.openUrlHandler);

    this.mainCompositePickerView = new MainCompositePickerView(this.handleBuildCallback.bind(this), this.handleCancelCallback.bind(this));
    this.mainCompositeSelectorPanel = atom.workspace.addTopPanel({
      item: this.mainCompositePickerView.getElement(),
      visible: false
    });

    this.icp4dAuthenticationView = new Icp4dAuthenticationView(getStore(), () => {
      this.icp4dAuthenticationPanel.hide();
    });
    this.icp4dAuthenticationPanel = atom.workspace.addModalPanel({
      item: this.icp4dAuthenticationView.getElement(),
      visible: false
    });

    this.initializeToolkitCache();

    if (state) {
      if (state.username) {
        getStore().dispatch(setUsername(state.username));
      }
      if (state.rememberPassword) {
        getStore().dispatch(setRememberPassword(state.rememberPassword));
      }
    }

    getStore().dispatch(setBuildOriginator('atom', version));

    getStore().dispatch(packageActivated());
  },

  serialize() {
    const username = StateSelector.getUsername(getStore().getState());
    const rememberPassword = StateSelector.getRememberPassword(getStore().getState());
    let serializedData = {};
    serializedData = username ? { ...serializedData, username } : serializedData;
    serializedData = rememberPassword ? { ...serializedData, rememberPassword } : serializedData;
    return serializedData;
  },

  deactivate() {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
    if (this.statusBarTile) {
      this.statusBarTile.destroy();
      this.statusBarTile = null;
    }

    if (this.tooltipDisposable) {
      this.tooltipDisposable.dispose();
    }

    if (this.vcapInputView) {
      this.vcapInputView.destroy();
    }

    if (this.mainCompositeSelectorPanel) {
      this.mainCompositeSelectorPanel.destroy();
    }

    if (this.mainCompositePickerView) {
      this.mainCompositePickerView.destroy();
    }

    if (this.icp4dAuthenticationPanel) {
      this.icp4dAuthenticationPanel.destroy();
    }
    if (this.icp4dAuthenticationView) {
      this.icp4dAuthenticationView.destroy();
    }

    this.storeSubscription();
  },

  registerCommands() {
    this.subscriptions.add(
      atom.commands.add('atom-workspace', 'spl-build:build-submit', {
        displayName: 'IBM Streams: Build application and submit a job',
        description: 'Build a Streams application and submit job to the Streams instance',
        didDispatch: () => this.buildApp(StreamsUtils.BUILD_ACTION.SUBMIT)
      }),
      atom.commands.add('atom-workspace', 'spl-build:build-download', {
        displayName: 'IBM Streams: Build application and download application bundle',
        description: 'Build Streams application and download the compiled application bundle',
        didDispatch: () => this.buildApp(StreamsUtils.BUILD_ACTION.DOWNLOAD)
      }),
      atom.commands.add('atom-workspace', 'spl-build:build-make-submit', {
        displayName: 'IBM Streams: Build application(s) and submit job(s)',
        description: 'Build Streams application(s) and submit job(s) to the Streams instance',
        didDispatch: () => this.buildMake(StreamsUtils.BUILD_ACTION.SUBMIT)
      }),
      atom.commands.add('atom-workspace', 'spl-build:build-make-download', {
        displayName: 'IBM Streams: Build application(s) and download application bundle(s)',
        description: 'Build Streams application(s) and download the compiled application bundle(s)',
        didDispatch: () => this.buildMake(StreamsUtils.BUILD_ACTION.DOWNLOAD)
      }),
      atom.commands.add('atom-workspace', 'spl-build:submit', {
        displayName: 'IBM Streams: Submit application bundle to the Streams instance',
        description: 'Submit Streams application to the Streams instance',
        didDispatch: () => this.submit()
      }),
      atom.commands.add('atom-workspace', 'spl-build:open-streams-console', {
        displayName: 'IBM Streams: Open Streams Console',
        description: 'Streams Console instance and application management webpage',
        didDispatch: () => this.openConsole()
      }),
      atom.commands.add('atom-workspace', 'spl-build:open-public-cloud-dashboard', {
        displayName: 'IBM Streams: Open IBM Cloud Dashboard',
        description: 'IBM Cloud dashboard webpage for managing Streaming Analytics services',
        didDispatch: () => this.openCloudDashboard()
      }),
      atom.commands.add('atom-workspace', 'spl-build:open-icp4d-dashboard', {
        displayName: 'IBM Streams: Open IBM Cloud Pak for Data Dashboard',
        description: 'IBM Cloud Pak for Data Dashboard webpage for managing the IBM Streams add-on',
        didDispatch: () => this.openIcp4dDashboard()
      }),
      atom.commands.add('atom-workspace', 'spl-build:list-toolkits', {
        displayName: 'IBM Streams: List available toolkits',
        description: 'List available Streams toolkits',
        didDispatch: () => this.listToolkits()
      }),
    );
  },

  registerContextMenu() {
    const self = this;
    this.subscriptions.add(
      atom.contextMenu.add({
        'atom-workspace': [
          {
            type: 'separator'
          },
          {
            label: 'IBM Streams',
            shouldDisplay: self.shouldShowMenu,
            beforeGroupContaining: ['tree-view:open-selected-entry-up'],
            submenu: self.getContextMenu(self)
          },
          {
            type: 'separator'
          }
        ],
        'atom-text-editor': [
          {
            type: 'separator'
          },
          {
            label: 'IBM Streams',
            shouldDisplay: self.shouldShowMenu,
            beforeGroupContaining: ['core:undo'],
            submenu: self.getContextMenu(self)
          },
          {
            type: 'separator'
          }
        ]
      })
    );
  },

  getContextMenu(self) {
    const m = [
      {
        label: 'Build',
        command: 'spl-build:build-download',
        shouldDisplay: self.shouldShowMenuSpl
      },
      {
        label: 'Build and submit job',
        command: 'spl-build:build-submit',
        shouldDisplay: self.shouldShowMenuSpl
      },
      {
        label: 'Build',
        command: 'spl-build:build-make-download',
        shouldDisplay: self.shouldShowMenuMake
      },
      {
        label: 'Build and submit job(s)',
        command: 'spl-build:build-make-submit',
        shouldDisplay: self.shouldShowMenuMake
      },
      {
        label: 'Submit job',
        command: 'spl-build:submit',
        shouldDisplay: self.shouldShowMenuSubmit
      },
      {
        label: 'Open IBM Cloud Pak for Data dashboard',
        command: 'spl-build:open-icp4d-dashboard',
        shouldDisplay: self.shouldShowMenuV5.bind(self)
      },
      {
        label: 'Open IBM Cloud dashboard',
        command: 'spl-build:open-IBM-cloud-dashboard',
        shouldDisplay: self.shouldShowMenuV4.bind(self)
      },
      {
        label: 'Open IBM Streams Console',
        command: 'spl-build:open-streams-console',
        shouldDisplay: self.shouldShowMenu.bind(self)
      }
    ];
    return m;
  },
  consumeLinter(registerIndie) {
    this.linterService = registerIndie({
      name: 'SPL Build'
    });
    this.subscriptions.add(this.linterService);
  },

  consumeTreeView(treeView) {
    this.treeView = treeView;
  },

  consumeConsoleView(consumeConsoleService) {
    this.consumeConsoleService = (input) => {
      const newConsole = consumeConsoleService(input);
      return newConsole;
    };
    if (!MessageHandlerRegistry.getDefault()) {
      MessageHandlerRegistry.setDefault(new MessageHandler(this.consumeConsoleService({ id: 'IBM Streams Build', name: 'IBM Streams Build' })));
    }
  },

  consumeToolkitUpdater(consumeInitializeToolkit) {
    this.toolkitInitService = consumeInitializeToolkit;
  },

  shouldShowMenuSpl(event) {
    if (atom.workspace.getActiveTextEditor()) {
      return !!atom.workspace.getActiveTextEditor().getTitle().toLowerCase().endsWith('spl');
    }
    return !!event.target.innerText.toLowerCase().endsWith('.spl');
  },

  shouldShowMenuMake(event) {
    if (atom.workspace.getActiveTextEditor()) {
      return atom.workspace.getActiveTextEditor().getTitle().toLowerCase() === 'makefile';
    }
    return event.target.innerText.toLowerCase() === 'makefile';
  },
  shouldShowMenuSubmit(event) {
    if (atom.workspace.getActiveTextEditor()) {
      return !!atom.workspace.getActiveTextEditor().getTitle().toLowerCase().endsWith('.sab');
    }
    return !!event.target.innerText.toLowerCase().endsWith('.sab');
  },
  shouldShowMenu(event) {
    if (atom.workspace.getActiveTextEditor()) {
      return !!(atom.workspace.getActiveTextEditor().getTitle().toLowerCase() === 'makefile'
        || atom.workspace.getActiveTextEditor().getTitle().toLowerCase().endsWith('.spl')
        || atom.workspace.getActiveTextEditor().getTitle().toLowerCase().endsWith('.sab'));
    }
    return !!(event.target.innerText.toLowerCase() === 'makefile'
      || event.target.innerText.toLowerCase().endsWith('.spl')
      || event.target.innerText.toLowerCase().endsWith('.sab'));
  },
  shouldShowMenuV4(event) {
    return this.shouldShowMenu(event) && this.apiVersion === CONF_API_VERSION_V4;
  },
  shouldShowMenuV5(event) {
    return this.shouldShowMenu(event) && this.apiVersion === CONF_API_VERSION_V5;
  },
  handleBuildCallback(e) {
    if (this.atomIdeUiPackageInstalled) {
      const selectedComp = this.mainCompositePickerView.mainComposite;
      if (selectedComp) {
        this.mainCompositeSelectorPanel.hide();
        if (this.apiVersion === CONF_API_VERSION_V5) {
          const fqn = this.namespace ? `${this.namespace}::${selectedComp}` : `${selectedComp}`;
          const toolkitRootPath = atom.config.get(CONF_TOOLKITS_PATH);
          let messageHandler = MessageHandlerRegistry.get(fqn);
          if (!messageHandler) {
            this.consoleService = this.consumeConsoleService({ id: fqn, name: fqn });
            messageHandler = new MessageHandler(this.consoleService);
            MessageHandlerRegistry.add(fqn, messageHandler);
          }
          let lintHandler = LintHandlerRegistry.get(this.appRoot);
          if (!lintHandler) {
            lintHandler = new LintHandler(this.linterService, this.appRoot, this.apiVersion);
            LintHandlerRegistry.add(this.appRoot, lintHandler);
          }

          const newBuildAction = newBuild(
            {
              appRoot: this.appRoot,
              toolkitRootPath,
              fqn,
              postBuildAction: this.action
            }
          );
          if (!StateSelector.hasAuthenticatedToStreamsInstance(getStore().getState())) {
            getStore().dispatch(queueAction(newBuildAction));
            this.showAuthPanel();
          } else {
            getStore().dispatch(newBuildAction);
          }
        } else {
          const fqn = this.namespace ? `${this.namespace}::${selectedComp}` : `${selectedComp}`;

          let messageHandler = MessageHandlerRegistry.get(fqn);
          if (!messageHandler) {
            this.consoleService = this.consumeConsoleService({ id: fqn, name: fqn });
            messageHandler = new MessageHandler(this.consoleService);
            MessageHandlerRegistry.add(fqn, messageHandler);
          }
          this.lintHandler = new LintHandler(this.linterService, this.appRoot, this.apiVersion);
          this.splBuilder = new SplBuilder(messageHandler, this.lintHandler, this.openUrlHandler, { originator: 'atom', version, type: 'spl' }, { appRoot: this.appRoot, fqn });

          try {
            SourceArchiveUtils.buildSourceArchive(
              {
                appRoot: this.appRoot,
                toolkitPathSetting: this.toolkitRootDir,
                fqn,
                messageHandler: this.messageHandler
              }
            ).then(
              (sourceArchive) => this.splBuilder.build(this.action,
                this.streamingAnalyticsCredentials,
                { filename: sourceArchive.archivePath })
            );
          } finally {
            this.splBuilder.dispose();
          }
        }
      }
    }
  },

  handleCancelCallback(e) {
    this.mainCompositeSelectorPanel.hide();
  },

  buildMake(action) {
    if (this.apiVersion === CONF_API_VERSION_V5) {
      this.handleV5Action(() => this.buildMakeV5(action));
    } else {
      this.buildMakeV4(action);
    }
  },

  buildMakeV4(action) {
    this.action = action;

    const selectedMakefilePath = this.treeView.selectedPaths()[0];
    this.appRoot = SourceArchiveUtils.getApplicationRoot(atom.project.getPaths(), selectedMakefilePath);
    this.toolkitRootDir = atom.config.get(CONF_TOOLKITS_PATH);
    this.streamingAnalyticsCredentials = atom.config.get(CONF_STREAMING_ANALYTICS_CREDENTIALS);
    let messageHandler = MessageHandlerRegistry.get(selectedMakefilePath);
    if (!messageHandler) {
      this.consoleService = this.consumeConsoleService({ id: selectedMakefilePath, name: selectedMakefilePath });
      messageHandler = new MessageHandler(this.consoleService);
      MessageHandlerRegistry.add(selectedMakefilePath, messageHandler);
    }
    this.lintHandler = new LintHandler(this.linterService, this.appRoot, this.apiVersion);
    this.splBuilder = new SplBuilder(messageHandler, this.lintHandler, this.openUrlHandler, { originator: 'atom', version, type: 'make' }, { appRoot: this.appRoot, makefilePath: selectedMakefilePath });

    atom.workspace.open('atom://nuclide/console');

    try {
      SourceArchiveUtils.buildSourceArchive(
        {
          appRoot: this.appRoot,
          toolkitPathSetting: this.toolkitRootDir,
          makefilePath: selectedMakefilePath,
          messageHandler
        }
      ).then(
        (sourceArchive) => this.splBuilder.build(this.action,
          this.streamingAnalyticsCredentials,
          { filename: sourceArchive.archivePath })
      );
    } finally {
      this.splBuilder.dispose();
    }
  },

  buildMakeV5(action) {
    const selectedMakefilePath = this.treeView.selectedPaths()[0];
    const appRoot = SourceArchiveUtils.getApplicationRoot(atom.project.getPaths(), selectedMakefilePath);
    const toolkitRootPath = atom.config.get(CONF_TOOLKITS_PATH);
    let messageHandler = MessageHandlerRegistry.get(selectedMakefilePath);
    if (!messageHandler) {
      this.consoleService = this.consumeConsoleService({ id: selectedMakefilePath, name: selectedMakefilePath });
      this.subscriptions.add(this.consoleService);
      messageHandler = new MessageHandler(this.consoleService);
      MessageHandlerRegistry.add(selectedMakefilePath, messageHandler);
    }
    let lintHandler = LintHandlerRegistry.get(appRoot);
    if (!lintHandler) {
      lintHandler = new LintHandler(this.linterService, appRoot, this.apiVersion);
      LintHandlerRegistry.add(appRoot, lintHandler);
    }

    atom.workspace.open('atom://nuclide/console');
    const newBuildAction = newBuild(
      {
        appRoot,
        toolkitRootPath,
        makefilePath: selectedMakefilePath,
        postBuildAction: action
      }
    );
    if (!StateSelector.hasAuthenticatedToStreamsInstance(getStore().getState())) {
      getStore().dispatch(queueAction(newBuildAction));
      this.showAuthPanel();
    } else {
      getStore().dispatch(newBuildAction);
    }
  },

  buildApp(action) {
    if (this.apiVersion === CONF_API_VERSION_V5) {
      this.handleV5Action(() => this.buildAppV5(action));
    } else {
      this.buildAppV4(action);
    }
  },

  buildAppV4(action) {
    this.action = action;
    const selectedFilePath = this.treeView.selectedPaths()[0];
    const { fqn, namespace, mainComposites } = StreamsUtils.getFqnMainComposites(selectedFilePath);
    this.appRoot = SourceArchiveUtils.getApplicationRoot(atom.project.getPaths(), selectedFilePath);
    this.toolkitRootDir = atom.config.get(CONF_TOOLKITS_PATH);
    this.streamingAnalyticsCredentials = atom.config.get(CONF_STREAMING_ANALYTICS_CREDENTIALS);

    atom.workspace.open('atom://nuclide/console');

    // Only prompt user to pick a main composite if more/less than one main composite are found in the SPL file.
    if (mainComposites.length === 1) {
      let messageHandler = MessageHandlerRegistry.get(fqn);
      if (!messageHandler) {
        this.consoleService = this.consumeConsoleService({ id: fqn, name: fqn });
        messageHandler = new MessageHandler(this.consoleService);
        MessageHandlerRegistry.add(fqn, messageHandler);
      }
      this.lintHandler = new LintHandler(this.linterService, this.appRoot, this.apiVersion);
      this.splBuilder = new SplBuilder(messageHandler, this.lintHandler, this.openUrlHandler, { originator: 'atom', version, type: 'spl' }, { appRoot: this.appRoot, fqn });
      try {
        SourceArchiveUtils.buildSourceArchive(
          {
            appRoot: this.appRoot,
            toolkitPathSetting: this.toolkitRootDir,
            fqn,
            messageHandler
          }
        ).then(
          (sourceArchive) => this.splBuilder.build(this.action,
            this.streamingAnalyticsCredentials,
            { filename: sourceArchive.archivePath })
        );
      } finally {
        this.splBuilder.dispose();
      }
    } else {
      // this.messageHandler = messageHandler;
      this.namespace = namespace;
      this.mainCompositePickerView.updatePickerContent(this.namespace, mainComposites);
      this.mainCompositeSelectorPanel.show();
      // handling continued in handleBuildCallback() after user input
    }
  },

  buildAppV5(action) {
    const selectedFilePath = this.treeView.selectedPaths()[0];
    const { fqn, namespace, mainComposites } = StreamsUtils.getFqnMainComposites(selectedFilePath);

    atom.workspace.open('atom://nuclide/console');
    const appRoot = SourceArchiveUtils.getApplicationRoot(atom.project.getPaths(), selectedFilePath);

    // Only prompt user to pick a main composite if more/less than one main composite are found in the SPL file.
    if (mainComposites.length === 1) {
      const toolkitRootPath = atom.config.get(CONF_TOOLKITS_PATH);
      let messageHandler = MessageHandlerRegistry.get(fqn);
      if (!messageHandler) {
        this.consoleService = this.consumeConsoleService({ id: fqn, name: fqn });
        messageHandler = new MessageHandler(this.consoleService);
        MessageHandlerRegistry.add(fqn, messageHandler);
      }
      let lintHandler = LintHandlerRegistry.get(appRoot);
      if (!lintHandler) {
        lintHandler = new LintHandler(this.linterService, appRoot, this.apiVersion);
        LintHandlerRegistry.add(appRoot, lintHandler);
      }

      const newBuildAction = newBuild(
        {
          appRoot,
          toolkitRootPath,
          fqn,
          postBuildAction: action
        }
      );
      if (!StateSelector.hasAuthenticatedToStreamsInstance(getStore().getState())) {
        getStore().dispatch(queueAction(newBuildAction));
        this.showAuthPanel();
      } else {
        getStore().dispatch(newBuildAction);
      }
    } else {
      this.appRoot = appRoot;
      this.action = action;
      this.namespace = namespace;
      this.mainCompositePickerView.updatePickerContent(namespace, mainComposites);
      this.mainCompositeSelectorPanel.show();
      // handling continued in handleBuildCallback() after user input
    }
  },

  submitV5() {
    const selectedFilePaths = this.treeView.selectedPaths();
    const filteredPaths = selectedFilePaths.filter(filePath => filePath.toLowerCase().endsWith('.sab'));
    const bundles = filteredPaths.map(filteredPath => ({
      bundlePath: filteredPath,
      jobGroup: 'default',
      jobName: filteredPath.split(path.sep).pop().split('.sab')[0],
      jobConfig: null, // TODO: pass in job config file
    }));
    const submitAction = submitApplicationsFromBundleFiles(bundles);
    if (!StateSelector.hasAuthenticatedToStreamsInstance(getStore().getState())) {
      getStore().dispatch(queueAction(submitAction));
      this.icp4dAuthenticationPanel.show();
    } else {
      getStore().dispatch(submitAction);
    }
  },

  submitV4() {
    const selectedFilePath = this.treeView.selectedPaths()[0];

    if (!selectedFilePath || !selectedFilePath.toLowerCase().endsWith('.sab')) {
      return;
    }

    const name = path.basename(selectedFilePath).split('.sab')[0];

    let rootDir = path.dirname(selectedFilePath);
    if (path.basename(rootDir) === 'output') {
      rootDir = path.dirname(rootDir);
    }
    this.appRoot = rootDir;

    atom.workspace.open('atom://nuclide/console');

    this.streamingAnalyticsCredentials = atom.config.get(CONF_STREAMING_ANALYTICS_CREDENTIALS);
    this.consoleService = this.consumeConsoleService({ id: name, name });
    this.messageHandler = new MessageHandler(this.consoleService);
    this.lintHandler = new LintHandler(this.linterService, this.appRoot, this.apiVersion);
    this.splBuilder = new SplBuilder(this.messageHandler, this.lintHandler, this.openUrlHandler);

    this.splBuilder.submit(this.streamingAnalyticsCredentials, { filename: selectedFilePath });
  },

  /**
  * Submit a selected .sab bundle file to the instance
  */
  submit() {
    if (this.apiVersion === CONF_API_VERSION_V5) {
      this.handleV5Action(() => this.submitV5());
    } else {
      this.submitV4();
    }
  },

  handleIcp4dUrlNotSet() {
    MessageHandlerRegistry.getDefault().handleIcp4dUrlNotSet();
  },

  showAuthPanel() {
    const username = StateSelector.getFormUsername(getStore().getState()) || StateSelector.getUsername(getStore().getState());
    const rememberPassword = StateSelector.getFormRememberPassword(getStore().getState()) || StateSelector.getRememberPassword(getStore().getState());
    if (username && rememberPassword) {
      KeychainUtils.getCredentials(username).then(password => {
        getStore().dispatch(setFormDataField('password', password));
      });
    }
    this.icp4dAuthenticationPanel.show();
  },

  openConsole() {
    if (this.apiVersion === CONF_API_VERSION_V5) {
      const openConsoleFn = () => {
        const consoleUrlString = StateSelector.getStreamsConsoleUrl(getStore().getState());
        if (consoleUrlString) {
          try {
            const consoleUrl = new URL(consoleUrlString); /* eslint-disable-line compat/compat */
            MessageHandlerRegistry.openUrl(`${consoleUrl}`);
          } catch (err) { /* */ }
        }
      };
      this.handleV5Action(openConsoleFn);
    } else {
      this.streamingAnalyticsCredentials = atom.config.get(CONF_STREAMING_ANALYTICS_CREDENTIALS);
      this.consoleService = this.consumeConsoleService({ id: name, name });
      this.messageHandler = new MessageHandler(this.consoleService);
      this.lintHandler = new LintHandler(this.linterService, this.appRoot, this.apiVersion);
      this.splBuilder = new SplBuilder(this.messageHandler, this.lintHandler, this.openUrlHandler);
      this.splBuilder.openStreamingAnalyticsConsole(this.streamingAnalyticsCredentials);
    }
  },

  openCloudDashboard() {
    if (this.apiVersion === CONF_API_VERSION_V4) {
      this.streamingAnalyticsCredentials = atom.config.get(CONF_STREAMING_ANALYTICS_CREDENTIALS);
      this.consoleService = this.consumeConsoleService({ id: name, name });
      this.messageHandler = new MessageHandler(this.consoleService);
      this.splBuilder = new SplBuilder(this.messageHandler, null, this.openUrlHandler);
      this.splBuilder.openCloudDashboard();
    }
  },

  openIcp4dDashboard() {
    if (this.apiVersion === CONF_API_VERSION_V5) {
      const openDashboard = () => {
        try {
          const icp4dUrl = new URL(StateSelector.getIcp4dUrl(getStore().getState())); /* eslint-disable-line compat/compat */
          MessageHandlerRegistry.openUrl(`${icp4dUrl}/zen/#/homepage`);
        } catch (err) { /* */ }
      };
      this.handleV5Action(openDashboard);
    }
  },

  listToolkits() {
    const cachedToolkits = StreamsToolkitsUtils.getCachedToolkits(StateSelector.getToolkitsCacheDir(getStore().getState())).map(tk => tk.label);
    const cachedToolkitsStr = `Build service toolkits:\n\n${cachedToolkits.join('\n')}`;

    const localToolkitsPathSetting = atom.config.get(CONF_TOOLKITS_PATH);
    let localToolkitsStr = '';
    if (localToolkitsPathSetting && localToolkitsPathSetting.length > 0) {
      const localToolkits = StreamsToolkitsUtils.getLocalToolkits(localToolkitsPathSetting).map(tk => tk.label);
      localToolkitsStr = `\n\nLocal toolkits from ${localToolkitsPathSetting}:\n\n${localToolkits.join('\n')}`;
    }
    MessageHandlerRegistry.getDefault().handleInfo(
      'Streams Toolkits',
      {
        detail: `${cachedToolkitsStr}${localToolkitsStr}`,
        notificationAutoDismiss: false
      }
    );
  },

  handleV5Action(callbackFn) {
    const icp4dUrl = StateSelector.getIcp4dUrl(getStore().getState());
    if (icp4dUrl) {
      const successFn = callbackFn;
      const errorFn = () => this.handleIcp4dUrlNotSet(this.handleV5Action.bind(this, callbackFn));
      getStore().dispatch(checkIcp4dHostExists(successFn, errorFn));
    } else {
      this.handleIcp4dUrlNotSet(this.handleV5Action.bind(this, callbackFn));
    }
  },

  initializeToolkitCache() {
    if (atom.packages.isPackageLoaded('build-ibmstreams')) {
      const toolkitsCacheDir = `${atom.packages.getLoadedPackage('build-ibmstreams').path}${path.sep}toolkitsCache`;
      if (!fs.existsSync(toolkitsCacheDir)) {
        fs.mkdirSync(toolkitsCacheDir);
      }
      getStore().dispatch(setToolkitsCacheDir(toolkitsCacheDir));
    }
  },

  initializeToolkitsDirectory() {
    if (atom.packages.isPackageLoaded('ide-ibmstreams')) {
      const toolkitsDirectory = atom.config.get(CONF_TOOLKITS_PATH);
      getStore().dispatch(setToolkitsPathSetting(toolkitsDirectory));
    }
  },

  handleStreamsBuildUri(parsedUri) {
    if (parsedUri.host === 'build-ibmstreams') {
      // Handle a toolkit refresh request
      if (parsedUri.pathname === '/toolkits/refresh') {
        // MessageHandlerRegistry.getDefault().handleInfo('Refreshing toolkits');
        const toolkitPathSetting = atom.config.get(CONF_TOOLKITS_PATH);
        if (typeof toolkitPathSetting === 'string' && toolkitPathSetting.length > 0) {
          if (toolkitPathSetting.match(/[,;]/)) {
            const directories = toolkitPathSetting.split(/[,;]/);
            const directoriesInvalid = _.some(directories, dir => !fs.existsSync(dir));
            if (directoriesInvalid) {
              MessageHandlerRegistry.getDefault().handleError(
                'One or more toolkit paths do not exist or are not valid',
                {
                  detail: `Verify that the paths exist:\n${directories.join('\n')}`,
                  notificationButtons: [
                    {
                      label: 'Open settings',
                      callbackFn: () => MessageHandlerRegistry.getDefault().openIdePackageSettingsPage()
                    }
                  ]
                }
              );
              return;
            }
          } else if (!fs.existsSync(toolkitPathSetting)) {
            MessageHandlerRegistry.getDefault().handleError(
              'The specified toolkit path does not exist or is not valid',
              {
                detail: `Verify that the specified toolkit path ${toolkitPathSetting} exists.`,
                notificationButtons: [
                  {
                    label: 'Open settings',
                    callbackFn: () => MessageHandlerRegistry.getDefault().openIdePackageSettingsPage()
                  }
                ]
              }
            );
            return;
          }
          getStore().dispatch(setToolkitsPathSetting(toolkitPathSetting));
        }
        if (StateSelector.hasAuthenticatedToStreamsInstance(getStore().getState())) {
          getStore().dispatch(refreshToolkits());
        }
        const toolkitInitOptions = StreamsToolkitsUtils.getLangServerOptionForInitToolkits(StateSelector.getToolkitsCacheDir(getStore().getState()), StateSelector.getToolkitsPathSetting(getStore().getState()));
        MessageHandlerRegistry.sendLspNotification(toolkitInitOptions);
      }
    }
  },

};
