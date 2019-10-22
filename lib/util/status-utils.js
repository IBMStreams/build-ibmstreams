'use babel';
'use strict';

import * as path from 'path';
import * as clipboardy from 'clipboardy';

import MessageHandlerRegistry from '../message-handler-registry';
import MessageHandler from '../MessageHandler';
import getStore from '../redux-store/configure-store';
import {
  downloadAppBundles,
  getSubmissionTimeParamsFromAdl,
  openStreamingAnalyticsConsole
} from '../actions';
import StateSelector from './state-selectors';
import StreamsUtils from './streams-utils';
import LintHandlerRegistry from '../lint-handler-registry';

function buildStatusUpdate(action, state) {
  const { buildId } = action;
  const buildStatus = StateSelector.getBuildStatus(state, buildId);
  const logMessages = StateSelector.getBuildLogMessages(state, buildId);
  const displayIdentifier = StateSelector.getBuildDisplayIdentifier(state, buildId);
  const messageHandler = getMessageHandlerForBuildId(state, buildId);
  if (buildStatus === 'built') {
    messageHandler.handleSuccess(`Build succeeded - ${displayIdentifier}`, {

    });
  } else if (buildStatus === 'failed') {
    messageHandler.handleError(`Build failed - ${displayIdentifier}`, { detail: logMessages, showNotification: true });
    const lintHandler = getLintHandlerForBuildId(state, buildId);
    if (lintHandler) lintHandler.lint(logMessages);
  } else if (buildStatus === 'building') {
    messageHandler.handleInfo(`Building ${displayIdentifier}...`, { detail: logMessages.join('\n'), showNotification: true });
  }
}
function submitStatusUpdate(action, state) {
  const { id } = action;
  const submitStatus = StateSelector.getSubmitStatus(state, id);
  const logMessages = StateSelector.getSubmitLogMessages(state, id);
  const displayIdentifier = action.identifier;
  const messageHandler = getMessageHandlerForSubmitId(state, id);
  if (submitStatus === 'submission.complete') {
    messageHandler.handleSuccess(`Submit succeeded - ${displayIdentifier}`, {

    });
  } else if (submitStatus === 'submission.failedProcessingBuild' || submitStatus === 'submission.failedProcessingJob' || submitStatus === 'job.submitFailed') {
    messageHandler.handleError(`Submit failed - ${displayIdentifier}`, { detail: logMessages, showNotification: true });
    const lintHandler = getLintHandlerForBuildId(state, id);
    if (lintHandler) lintHandler.lint(logMessages);
  } else if (submitStatus === 'job.submitting') {
    messageHandler.handleInfo(`Submitting ${displayIdentifier}...`, { detail: logMessages.join('\n'), showNotification: true });
  } else if (submitStatus === 'job.applicationBundleUploading') {
    messageHandler.handleInfo(`application bundle uploading - ${displayIdentifier}...`, { detail: logMessages.join('\n'), showNotification: true });
  }
}

function appBundleDownloaded(state, buildId, artifactName, artifactOutputPath) {
  const messageHandler = getMessageHandlerForBuildId(state, buildId);
  const outputDir = path.dirname(artifactOutputPath);
  messageHandler.handleSuccess(
    `Application ${artifactName} bundle downloaded to output directory`,
    {
      detail: artifactOutputPath,
      notificationButtons: [
        {
          label: 'Copy output path',
          callbackFn: () => clipboardy.writeSync(outputDir)
        }
      ]
    }
  );
}

function downloadOrSubmit(state, buildId) {
  const buildStatus = StateSelector.getBuildStatus(state, buildId);
  if (buildStatus === 'built') {
    const artifacts = StateSelector.getBuildArtifacts(state, buildId);
    const messageHandler = getMessageHandlerForBuildId(state, buildId);
    const identifier = StateSelector.getMessageHandlerIdentifier(state, buildId);
    const postBuildAction = StateSelector.getPostBuildAction(state, buildId);

    if (StreamsUtils.BUILD_ACTION.SUBMIT === postBuildAction) {
      const submissionTarget = identifier.includes('/') ? 'the application(s) for the Makefile' : identifier;
      if (Array.isArray(artifacts) && artifacts.length > 0) {
        messageHandler.handleInfo(`Job submission - ${identifier}`, {
          detail: `Submit ${submissionTarget} to your service instance with default configuration or use the Streams Console to customize the submission time configuration.`,
          notificationAutoDismiss: false,
          notificationButtons: [
            {
              label: 'Submit',
              callbackFn: () => {
                // messageHandler.handleInfo('Submitting application');
                getStore().dispatch(getSubmissionTimeParamsFromAdl(buildId, true, identifier));
              }
            },
            {
              label: 'Submit via Streams Console',
              callbackFn: () => {
                // messageHandler.handleInfo('Downloading application bundle(s)');
                getStore().dispatch(downloadAppBundles(buildId));
                getStore().dispatch(openStreamingAnalyticsConsole());
              }
            }
          ]
        });
      }
    } else {
      getStore().dispatch(downloadAppBundles(buildId));
    }
  }
}

function submitJobStart(state, artifactName, buildId) {
  const messageHandler = buildId ? getMessageHandlerForBuildId(state, buildId) : MessageHandlerRegistry.getDefault();
  if (messageHandler) {
    const submitStartNotification = messageHandler.handleInfo(`Submitting application ${artifactName} to the Streams Instance...`, { notificationAutoDismiss: false });
    messageHandler.setSubmitStartedNotification(submitStartNotification);
  }
}

function jobSubmitted(state, submitInfo, buildId) {
  const messageHandler = buildId ? getMessageHandlerForBuildId(state, buildId) : MessageHandlerRegistry.getDefault();
  messageHandler.closeSubmitStartedNotification();
  if (submitInfo.status === 'running') {
    messageHandler.handleSuccess(
      `Job ${submitInfo.name} has been successfully submitted to the ${StateSelector.getSelectedInstanceName(state)} instance`,
      {
        detail: 'To monitor or manage the job, use the IBM Cloud Pak for Data Manage Jobs webpage or the Streams Console.',
        notificationAutoDismiss: false,
        notificationButtons: [
          {
            label: 'Open ICP4D Console',
            callbackFn: () => {
              const icp4dUrlStr = StateSelector.getIcp4dUrl(state);
              const icp4dUrl = new URL(icp4dUrlStr); /* eslint-disable-line compat/compat */
              const icp4dUrlBase = `${icp4dUrl.protocol}//${icp4dUrl.host}`;
              const jobDetailsUrl = `${icp4dUrlBase}/streams/webpage/#/streamsJobDetails/streams-${StateSelector.getServiceInstanceId(state)}-${submitInfo.id}`;
              MessageHandlerRegistry.openUrl(jobDetailsUrl);
            }
          },
          {
            label: 'Open Streams Console',
            callbackFn: () => {
              const consoleUrl = StateSelector.getStreamsConsoleUrl(state);
              const jobName = submitInfo.name;
              MessageHandlerRegistry.openUrl(`${consoleUrl}#application/dashboard/Application%20Dashboard?job=${jobName}`);
            }
          }
        ]
      }
    );
  }
}

function getMessageHandlerForBuildId(state, buildId) {
  const identifier = StateSelector.getMessageHandlerIdentifier(state, buildId);
  return MessageHandlerRegistry.get(identifier);
}

function getLintHandlerForBuildId(state, buildId) {
  const appRoot = StateSelector.getBuildAppRoot(state, buildId);
  return LintHandlerRegistry.get(appRoot);
}

function getMessageHandlerForSubmitId(state, submitId) {
  if (!MessageHandlerRegistry.get(submitId)) {
    const ms = new MessageHandler(console);
    MessageHandlerRegistry.add(submitId, ms);
  }
  return MessageHandlerRegistry.get(submitId);
}


const StatusUtils = {
  buildStatusUpdate,
  submitStatusUpdate,
  downloadOrSubmit,
  appBundleDownloaded,
  submitJobStart,
  jobSubmitted,
  getMessageHandlerForBuildId
};

export default StatusUtils;
