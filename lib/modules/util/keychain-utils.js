'use babel';
'use strict';

import * as keytar from 'keytar';

const SERVICE_ID = 'ibm-icp4d-streams';

const getCredentials = async (username) => {
  const creds = await keytar.getPassword(SERVICE_ID, username);
  return creds;
};

const addCredentials = async (username, password) => {
  await keytar.setPassword(SERVICE_ID, username, password);
};

const deleteCredentials = async (username) => {
  await keytar.deletePassword(SERVICE_ID, username);
};

const getAllCredentials = async () => {
  const creds = await keytar.findCredentials(SERVICE_ID);
  return creds;
};

const deleteAllCredentials = async () => {
  const credentials = await KeychainUtils.getAllCredentials();
  credentials.forEach((credential: { account: string, password: string }) => {
    KeychainUtils.deleteCredentials(credential.account);
  });
};

const credentialsExist = async () => {
  const credentials = await KeychainUtils.getAllCredentials();
  return credentials.length > 0;
};


const KeychainUtils = {
  getCredentials,
  addCredentials,
  deleteCredentials,
  getAllCredentials,
  deleteAllCredentials,
  credentialsExist
};

export default KeychainUtils;
