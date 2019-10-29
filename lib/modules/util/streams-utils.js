'use babel';
'use strict';

import * as path from 'path';
import * as fs from 'fs';
import * as tar from 'tar-fs';
import * as xmldoc from 'xmldoc';
import * as fse from 'fs-extra';

import {
  SPL_MAIN_COMPOSITE_REGEX,
  SPL_NAMESPACE_REGEX
} from '..';

const extract = require('extract-zip');

/* eslint compat/compat: 0 */

function getFqnMainComposites(selectedFilePath) {
  let fileContents = '';
  if (selectedFilePath) {
    fileContents = fs.readFileSync(selectedFilePath, 'utf-8');
  }

  // Parse selected SPL file to find namespace and main composites
  const namespaces = [];
  let m = '';
  while ((m = SPL_NAMESPACE_REGEX.exec(fileContents)) !== null) { namespaces.push(m[1]); }
  const mainComposites = [];
  while ((m = SPL_MAIN_COMPOSITE_REGEX.exec(fileContents)) !== null) { mainComposites.push(m[1]); }

  let fqn = '';
  let namespace = '';
  if (namespaces && namespaces.length > 0) {
    fqn = `${namespaces[0]}::`;
    namespace = namespaces[0];
  }
  if (mainComposites.length === 1) {
    fqn = `${fqn}${mainComposites[0]}`;
  }
  return { fqn, namespace, mainComposites };
}


/**
 * read VCAP_SERVICES env variable, process the file it refers to.
 * Expects VCAP JSON format,
 * eg: {"streaming-analytics":[{"name":"service-1","credentials":{apikey:...,v2_rest_url:...}}]}
 */
function parseV4ServiceCredentials(streamingAnalyticsCredentials) {
  const vcapServicesPath = process.env.VCAP_SERVICES;
  if (streamingAnalyticsCredentials && typeof (streamingAnalyticsCredentials) === 'string') {
    const serviceCreds = JSON.parse(streamingAnalyticsCredentials);
    if (serviceCreds && serviceCreds.apikey && serviceCreds.v2_rest_url) {
      return serviceCreds;
    }
  } else if (vcapServicesPath && typeof (vcapServicesPath) === 'string') {
    try {
      if (fs.existsSync(vcapServicesPath)) {
        const vcapServices = JSON.parse(fs.readFileSync(vcapServicesPath, 'utf8'));
        if (vcapServices.apikey && vcapServices.v2_rest_url) {
          return { apikey: vcapServices.apikey, v2_rest_url: vcapServices.v2_rest_url };
        }
        const streamingAnalytics = vcapServices['streaming-analytics'];
        if (streamingAnalytics && streamingAnalytics[0]) {
          const { credentials } = streamingAnalytics[0];
          if (credentials) {
            return { apikey: credentials.apikey, v2_rest_url: credentials.v2_rest_url };
          }
          console.log('Credentials not found in streaming-analytics service in VCAP');
        } else {
          console.log('streaming-analytics service not found in VCAP');
        }
      } else {
        console.log(`The VCAP file does not exist: ${vcapServicesPath}`);
      }
    } catch (error) {
      console.log(`Error processing VCAP file: ${vcapServicesPath}`, error);
    }
  }
  return {};
}

function extractSab(bundlePath, input) {
  return new Promise(resolve => {
    const extractedPath = bundlePath.replace('.sab', 'extracted');
    extract(bundlePath, { dir: extractedPath }, (err) => {
      if (err) {
        console.log(err);
      }
      fs.createReadStream(`${extractedPath}${path.sep}tar${path.sep}bundle.tar`).pipe(
        tar.extract(`${extractedPath}${path.sep}tar${path.sep}bundle`,
          {
            finish: () => {
              resolve(getSubmissionTimeParamsFromAdlFile(bundlePath, extractedPath, input));
            }
          })
      );
    });
  });
}

function getSubmissionTimeParamsFromAdlFile(bundlePath, extractedPath, input) {
  if (fs.existsSync(`${extractedPath}${path.sep}tar${path.sep}bundle`)) {
    let adlFileName = bundlePath.split(path.sep);
    adlFileName = adlFileName[adlFileName.length - 1].replace('.sab', '.adl');
    const xml = fs.readFileSync(`${extractedPath}${path.sep}tar${path.sep}bundle${path.sep}output${path.sep}${adlFileName}`);
    const submissionTimeValues = getSubmissionTimeParams(xml);
    fse.removeSync(extractedPath);
    return submissionTimeValues;
  }
}

function getSubmissionTimeParams(xml) {
  const doc = new xmldoc.XmlDocument(xml);
  const submissionTimeValues = doc.childNamed('splApplication').childNamed('submissionTimeValues');
  return submissionTimeValues;
}

// function getSubmissionTimeParams(bundlePath, extractedPath, input) {
//   if (fs.existsSync(`${extractedPath}${path.sep}tar${path.sep}bundle`)) {
//     let adlFileName = bundlePath.split(path.sep);
//     adlFileName = adlFileName[adlFileName.length - 1].replace('.sab', '.adl');
//     const xml = fs.readFileSync(`${extractedPath}${path.sep}tar${path.sep}bundle${path.sep}output${path.sep}${adlFileName}`);
//     const doc = new xmldoc.XmlDocument(xml);
//     const submissionTimeValues = doc.childNamed('splApplication').childNamed('submissionTimeValues');
//     if (submissionTimeValues) {
//       this.submissionTimeView = new SubmissionTimeView(() => {
//         this.submissionTimePanel.hide();
//       }, submissionTimeValues.childrenNamed('submissionTimeValue'), input);
//       this.submissionTimePanel = atom.workspace.addModalPanel({
//         item: this.submissionTimeView.getElement(),
//         visible: false
//       });
//     } else {
//       this.submissionTimePanel = null;
//     }
//   }
//   fse.removeSync(extractedPath);
//   return this.submissionTimePanel;
// }

const StreamsUtils = {
  parseV4ServiceCredentials,
  getFqnMainComposites,
  extractSab,
  getSubmissionTimeParams,
  getSubmissionTimeParamsFromAdlFile
};

export default StreamsUtils;
