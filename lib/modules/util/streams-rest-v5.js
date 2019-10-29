'use babel';
'use strict';

import { sep as _pathSep } from 'path';
import { createReadStream } from 'fs';
import { Observable } from 'rxjs';

import { ideSelectors as IdeStateSelectors } from '../ide';
import { connectionV5Selectors as ConnStateSelector } from '../connection/v5';

const request = require('request');

const baseRequestOptions = {
  method: 'GET',
  json: true,
  gzip: true,
  agentOptions: {
    rejectUnauthorized: false
  },
  ecdhCurve: 'auto',
  strictSSL: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
};

const baseRequest = request.defaults(baseRequestOptions);

function setTimeout(timeoutInSeconds) {
  baseRequest.defaults.timeout = timeoutInSeconds * 1000;
}

/**
 *  StreamsRestUtils.build
 */
function getAll(state) {
  const options = {
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}`,
    auth: getStreamsAuth(state)
  };
  return observableRequest(baseRequest, options);
}

function getStatus(state, buildId) {
  const options = {
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}`,
    auth: getStreamsAuth(state)
  };
  return observableRequest(baseRequest, options);
}

function create(
  state,
  {
    inactivityTimeout,
    incremental,
    name,
    type
  } = {
    inactivityTimeout: 15,
    incremental: true,
    name: 'myBuild',
    type: 'application'
  }
) {
  const options = {
    method: 'POST',
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}`,
    auth: getStreamsAuth(state),
    body: {
      inactivityTimeout,
      incremental,
      name,
      originator: IdeStateSelectors.getBuildOriginator(state) || 'unknown',
      type
    }
  };
  return observableRequest(baseRequest, options);
}

function deleteBuild(state, buildId) {
  const options = {
    method: 'DELETE',
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}`,
    auth: getStreamsAuth(state),
    headers: {
      Accept: '*/*'
    }
  };
  return observableRequest(baseRequest, options);
}

function uploadSource(state, buildId, sourceZipPath) {
  const options = {
    method: 'PUT',
    json: false,
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}`,
    auth: getStreamsAuth(state),
    headers: {
      'Content-Type': 'application/zip'
    },
    encoding: null,
    body: createReadStream(sourceZipPath)
  };
  return observableRequest(baseRequest, options);
}

function updateSource(state, buildId, sourceZipPath) {
  const options = {
    method: 'PATCH',
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}`,
    auth: getStreamsAuth(state),
    headers: {
      'Content-Type': 'application/zip'
    },
    formData: {
      file: {
        value: createReadStream(sourceZipPath),
        options: {
          filename: sourceZipPath.split(_pathSep).pop(),
          contentType: 'application/zip'
        }
      }
    }
  };
  return observableRequest(baseRequest, options);
}

function getLogMessages(state, buildId) {
  const options = {
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}/logmessages`,
    auth: getStreamsAuth(state),
    json: false,
    headers: {
      Accept: 'text/plain'
    }
  };
  return observableRequest(baseRequest, options);
}

function start(state, buildId, { buildConfigOverrides = {} } = {}) {
  const options = {
    method: 'POST',
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}/actions`,
    auth: getStreamsAuth(state),
    body: {
      type: 'submit',
      buildConfigOverrides
    }
  };
  return observableRequest(baseRequest, options);
}

function cancel(state, buildId, { buildConfigOverrides = {} } = {}) {
  const options = {
    method: 'POST',
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}/actions`,
    auth: getStreamsAuth(state),
    body: {
      type: 'cancel',
      buildConfigOverrides
    }
  };
  return observableRequest(baseRequest, options);
}

function getSnapshots(state) {
  const options = {
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/snapshot`,
    auth: getStreamsAuth(state),
  };
  return observableRequest(baseRequest, options);
}

/**
 *  StreamsRestUtils.artifact
 */

function getArtifacts(state, buildId) {
  const options = {
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}/artifacts`,
    auth: getStreamsAuth(state),
  };
  return observableRequest(baseRequest, options);
}

function getArtifact(state, buildId, artifactId) {
  const options = {
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}/artifacts/${artifactId}`,
    auth: getStreamsAuth(state),
  };
  return observableRequest(baseRequest, options);
}

function getAdl(state, buildId, artifactId) {
  const options = {
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}/artifacts/${artifactId}/adl`,
    auth: getStreamsAuth(state),
    headers: {
      Accept: 'text/xml'
    }
  };
  return observableRequest(baseRequest, options);
}

function downloadApplicationBundle(state, buildId, artifactId) {
  const options = {
    url: `${ConnStateSelector.getStreamsBuildRestUrl(state)}/${buildId}/artifacts/${artifactId}/applicationbundle`,
    auth: getStreamsAuth(state),
    encoding: null,
    headers: {
      Accept: 'application/x-jar',
    }
  };
  return observableRequest(baseRequest, options);
}

function uploadApplicationBundleToInstance(state, applicationBundlePath) {
  const options = {
    method: 'POST',
    url: `${ConnStateSelector.getStreamsRestUrl(state)}/applicationbundles`,
    auth: getStreamsAuth(state),
    headers: {
      'Content-Type': 'application/x-jar',
      Accept: 'application/json'
    },
    json: false,
    body: createReadStream(applicationBundlePath)
  };
  return observableRequest(baseRequest, options);
}

/**
 * StreamsRestUtils.submit
 */

function submitJob(
  state,
  applicationBundleIdOrUrl,
  {
    applicationCredentials,
    jobConfig,
    jobGroup,
    jobName,
    submitParameters
  } = {
    jobGroup: 'default',
    jobName: 'myJob',
    submitParameters: [],
    jobConfig: {},
    applicationCredentials: {}
  }
) {
  const options = {
    method: 'POST',
    url: `${ConnStateSelector.getStreamsRestUrl(state)}/jobsubmissions`,
    auth: getStreamsAuth(state),
    body: {
      application: applicationBundleIdOrUrl,
      jobGroup,
      jobName,
      submitParameters,
      jobConfigurationOverlay: jobConfig,
      applicationCredentials: {
        bearerToken: ConnStateSelector.getStreamsBearerToken(state)
      }
    }
  };
  return observableRequest(baseRequest, options);
}

function getJobSubmissions(state) {
  const options = {
    url: `${ConnStateSelector.getStreamsRestUrl(state)}/jobsubmissions`,
    auth: getStreamsAuth(state)
  };
  return observableRequest(baseRequest, options);
}

function deleteJobSubmission(state, submissionId) {
  const options = {
    method: 'DELETE',
    url: `${ConnStateSelector.getStreamsRestUrl(state)}/jobsubmissions/${submissionId}`,
    auth: getStreamsAuth(state),
  };
  return observableRequest(baseRequest, options);
}

function getJobSubmission(state, submissionId) {
  const options = {
    url: `${ConnStateSelector.getStreamsRestUrl(state)}/jobsubmissions/${submissionId}`,
    auth: getStreamsAuth(state),
  };
  return observableRequest(baseRequest, options);
}

function uploadAndSubmit(state, submissionId, sourceZipPath) {
  const options = {
    method: 'PUT',
    json: false,
    url: `${ConnStateSelector.getStreamsRestUrl(state)}/jobsubmissions/${submissionId}`,
    auth: getStreamsAuth(state),
    headers: {
      'Content-Type': 'application/zip'
    },
    encoding: null,
    body: createReadStream(sourceZipPath)
  };
  return observableRequest(baseRequest, options);
}

function getSubmissionLogMessages(state, submissionId) {
  const options = {
    url: `${ConnStateSelector.getStreamsRestUrl(state)}/jobsubmissions/${submissionId}/logmessages`,
    auth: getStreamsAuth(state),
    json: false,
    headers: {
      Accept: 'text/plain'
    }
  };
  return observableRequest(baseRequest, options);
}

/**
 *  StreamsRestUtils.toolkit
 */

function getToolkits(state) {
  const options = {
    url: `${ConnStateSelector.getStreamsToolkitRestUrl(state)}`,
    auth: getStreamsAuth(state),
  };
  return observableRequest(baseRequest, options);
}

function getToolkit(state, toolkitId) {
  const options = {
    url: `${ConnStateSelector.getStreamsToolkitRestUrl(state)}/${toolkitId}`,
    auth: getStreamsAuth(state),
  };
  return observableRequest(baseRequest, options);
}

function addToolkit(state, toolkitZipPath) {
  const options = {
    method: 'POST',
    url: `${ConnStateSelector.getStreamsToolkitRestUrl(state)}`,
    auth: getStreamsAuth(state),
    headers: {
      'Content-Type': 'application/zip'
    },
    formData: {
      file: {
        value: createReadStream(toolkitZipPath),
        options: {
          filename: toolkitZipPath.split(_pathSep).pop(),
          contentType: 'application/x-jar'
        }
      }
    }
  };
  return observableRequest(baseRequest, options);
}

function deleteToolkit(state, toolkitId) {
  const options = {
    method: 'DELETE',
    url: `${ConnStateSelector.getStreamsToolkitRestUrl(state)}/${toolkitId}`,
    auth: getStreamsAuth(state),
  };
  return observableRequest(baseRequest, options);
}

function getToolkitIndex(state, toolkitId) {
  const options = {
    url: `${ConnStateSelector.getStreamsToolkitRestUrl(state)}/${toolkitId}/index`,
    auth: getStreamsAuth(state),
    headers: {
      Accept: 'text/xml'
    }
  };
  return observableRequest(baseRequest, options);
}

/**
 * StreamsRestUtil.streams
 */

function getStreamsResources(state, username, password) {
  const auth = getStreamsAuth(state) || { username, password };
  const options = {
    url: ConnStateSelector.getStreamsRestResourcesUrl(state),
    auth
  };
  return observableRequest(baseRequest, options);
}

function getStreamsInstanceRestResources(state) {
  let url = ConnStateSelector.getStreamsInstancesRootRestUrl(state);
  try {
    // eslint-disable-next-line compat/compat
    const tempUrl = new URL(url);
    tempUrl.pathname = '/streams/rest/instances';
    url = tempUrl.toString();
  } catch (err) { /* ignore */ }
  const options = {
    url,
    auth: getStreamsAuth(state)
  };
  return observableRequest(baseRequest, options);
}

function getStreamsStandaloneAuthToken(state, username, password) {
  const auth = getStreamsAuth(state) || { username, password };
  const options = {
    method: 'POST',
    url: `${ConnStateSelector.getStreamsAccessTokenUrl(state)}`,
    body: {
      audience: 'streams'
    },
    auth
  };
  return observableRequest(baseRequest, options);
}

/**
 * StreamsRestUtils.icp4d
 */

function getIcp4dToken(state, username, password) {
  const options = {
    method: 'POST',
    url: `${ConnStateSelector.getIcp4dUrl(state)}/icp4d-api/v1/authorize`,
    body: {
      username,
      password
    },
    ecdhCurve: 'auto'
  };
  return observableRequest(baseRequest, options);
}

function getServiceInstances(state) {
  const options = {
    url: `${ConnStateSelector.getIcp4dUrl(state)}/zen-data/v2/serviceInstance`,
    auth: getIcp4dAuth(state),
  };
  return observableRequest(baseRequest, options);
}

function getStreamsAuthToken(state, instanceName) {
  const options = {
    method: 'POST',
    auth: getIcp4dAuth(state),
    url: `${ConnStateSelector.getIcp4dUrl(state)}/zen-data/v2/serviceInstance/token`,
    body: {
      serviceInstanceDisplayname: instanceName
    }
  };
  return observableRequest(baseRequest, options);
}

/**
 *  Helper functions
 */
function getStreamsAuth(state) {
  const token = ConnStateSelector.getStreamsBearerToken(state);
  return token ? { bearer: token } : undefined;
}

function getIcp4dAuth(state) {
  const token = ConnStateSelector.getIcp4dBearerToken(state);
  return token ? { bearer: token } : undefined;
}

function hostExists(url) {
  const options = {
    method: 'HEAD',
    url,
    timeout: 2000
  };
  return observableRequest(baseRequest, options);
}

function observableRequest(requestInst, options) {
  if (atom.inDevMode()) {
    console.log('request options: ', options);
  }
  return Observable.create((req) => {
    requestInst(options, (err, resp, body) => {
      if (err) {
        req.error(err);
      } else if (body && Array.isArray(body.errors)) {
        req.error(body.errors.map(err1 => err1.message).join('\n'));
      } else if (resp.statusCode < 200 && resp.statusCode >= 300) {
        req.error(resp.statusMessage);
      } else {
        req.next({ resp, body });
      }
      req.complete();
    });
  });
}

/**
 *  Exports
 */
const submit = {
  submitJob,
  getJobSubmissions,
  getJobSubmission,
  deleteJobSubmission,
  uploadAndSubmit,
  getSubmissionLogMessages
};

const build = {
  getAll,
  getStatus,
  create,
  deleteBuild,
  uploadSource,
  updateSource,
  getLogMessages,
  start,
  cancel,
  getSnapshots
};

const artifact = {
  getArtifacts,
  getArtifact,
  getAdl,
  downloadApplicationBundle,
  uploadApplicationBundleToInstance,
};

const toolkit = {
  getToolkits,
  getToolkit,
  addToolkit,
  deleteToolkit,
  getToolkitIndex
};

const icp4d = {
  getServiceInstances,
  getIcp4dToken,
  getStreamsAuthToken
};

const streams = {
  getStreamsResources,
  getStreamsInstanceRestResources,
  getStreamsStandaloneAuthToken
};

const StreamsRestUtils = {
  build,
  artifact,
  toolkit,
  submit,
  icp4d,
  streams,
  setTimeout,
  hostExists,
};

export default StreamsRestUtils;
