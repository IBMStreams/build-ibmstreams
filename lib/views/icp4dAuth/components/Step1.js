'use babel';
'use strict';

import * as React from 'react';
import {
  Alert, Button, Form, ButtonToolbar
} from 'react-bootstrap';
import ReactLoading from 'react-loading';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  authenticateIcp4d,
  setFormDataField,
  setIcp4dAuthError
} from '../../../actions';
import { StateSelector } from '../../../util';
import MessageHandlerRegistry from '../../../message-handler-registry';

const errorInputStyle = {
  borderColor: '#b78e92',
  boxShadow: '0 0 0 0.2rem rgba(234,151,159,.25'
};

const buttonBarStyle = {
  display: 'flex',
  width: '100%'
};

class Step1 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticating: false,
      touched: {
        username: false,
        password: false
      }
    };
  }

  onTextChange = (e) => {
    const { updateFormDataField } = this.props;
    updateFormDataField(e.target.name, e.target.value);
  }

  onCheckboxChange = (e) => {
    const { updateFormDataField } = this.props;
    updateFormDataField(e.target.name, e.target.checked);
  }

  onBlur = (e) => {
    const { touched } = this.state;
    this.setState({
      touched: {
        ...touched,
        [e.target.name]: true
      }
    });
  }

  static getDerivedStateFromProps(props, currentState) {
    const { currentStep } = props;
    if (currentStep !== 1) { // if we end up on a different step, we have authenticated
      return ({ isAuthenticating: false });
    }
    return null;
  }

  renderErrorHeader = () => {
    const { icp4dAuthError } = this.props;
    if (!icp4dAuthError) {
      return null;
    }
    switch (icp4dAuthError) {
      case 401:
        return (
          <Alert dismissible variant="danger">
            Incorrect username or password.
          </Alert>
        );
      default:
        return (
          <Alert dismissible variant="danger">
            An error occurred while authenticating.
          </Alert>
        );
    }
  }

  renderLoadingSpinner = () => {
    const { icp4dAuthError } = this.props;
    const { isAuthenticating } = this.state;
    return (isAuthenticating && !icp4dAuthError) ? (
      <ReactLoading type="spin" height="10%" width="10%" />
    ) : null;
  }

  validate = (username, password) => ({
    username: username.length === 0,
    password: password.length === 0
  });

  showError = (errors, touched, field) => {
    const hasError = errors[field];
    const shouldShow = touched[field];
    return hasError ? shouldShow : false;
  };

  renderIcp4dUrlNotSetError = () => {
    const { icp4dUrl, closePanel } = this.props;
    if (!icp4dUrl) {
      return (
        <Alert dismissible variant="danger">
          IBM Cloud Pak for Data URL not specified. Go to build-ibmstreams package settings to specify it.
          <Button
            variant="primary"
            size="sm"
            type="submit"
            onClick={() => {
              MessageHandlerRegistry.getDefault().openPackageSettingsPage();
              closePanel();
            }}
          >
            Open package settings
          </Button>
        </Alert>
      );
    }
  }

  render() {
    const {
      currentStep,
      username,
      password,
      rememberPassword,
      closePanel,
      setAuthError,
      authenticate,
      icp4dUrl
    } = this.props;

    const {
      touched
    } = this.state;

    if (currentStep !== 1) {
      return null;
    }

    const errors = this.validate(username, password);

    const isEnabled = !Object.keys(errors).some(field => errors[field]) && icp4dUrl;

    return (
      <div className="native-key-bindings">
        {this.renderErrorHeader()}

        {this.renderIcp4dUrlNotSetError()}

        {this.renderLoadingSpinner()}

        <Form>
          <Form.Group controlId="formUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control
              style={this.showError(errors, touched, 'username') ? errorInputStyle : {}}
              size="sm"
              type="text"
              name="username"
              placeholder="Your username"
              ref={e => this.usernameInput = e}
              onBlur={this.onBlur}
              onChange={this.onTextChange}
              value={username}
            />
          </Form.Group>

          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              style={this.showError(errors, touched, 'password') ? errorInputStyle : {}}
              size="sm"
              type="password"
              name="password"
              placeholder="Your password"
              onBlur={this.onBlur}
              onChange={this.onTextChange}
              value={password}
            />
          </Form.Group>

          <Form.Group controlId="formCheckbox">
            <Form.Check
              name="rememberPassword"
              checked={rememberPassword}
              type="checkbox"
              label="Remember my password"
              onChange={this.onCheckboxChange}
            />
          </Form.Group>

          <ButtonToolbar className="justify-content-between" style={buttonBarStyle}>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!isEnabled}
              onClick={() => {
                this.setState({ isAuthenticating: true });
                setAuthError(null);
                authenticate(username, password, rememberPassword);
              }
              }
            >
              Log in
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="submit"
              onClick={() => closePanel()}
            >
              Cancel
            </Button>
          </ButtonToolbar>

        </Form>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  let username = StateSelector.getFormUsername(state);
  if (typeof username !== 'string') {
    username = StateSelector.getUsername(state) || '';
  }
  let rememberPassword = StateSelector.getFormRememberPassword(state);
  if (typeof rememberPassword !== 'boolean') {
    rememberPassword = StateSelector.getRememberPassword(state);
    if (typeof rememberPassword !== 'boolean') {
      rememberPassword = true;
    }
  }
  const password = StateSelector.getFormPassword(state) || '';

  return {
    icp4dUrl: StateSelector.getIcp4dUrl(state) || null,
    loginFormInitialized: StateSelector.getLoginFormInitialized(state) || false,
    icp4dAuthError: StateSelector.getIcp4dAuthError(state) || null,
    username,
    password,
    rememberPassword,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    authenticate: (username, password, rememberPassword) => dispatch(authenticateIcp4d(username, password, rememberPassword)),
    updateFormDataField: (key, value) => dispatch(setFormDataField(key, value)),
    setAuthError: (authError) => dispatch(setIcp4dAuthError(authError))
  };
};

Step1.defaultProps = {
  icp4dAuthError: null
};

Step1.propTypes = {
  closePanel: PropTypes.func.isRequired,
  authenticate: PropTypes.func.isRequired,
  updateFormDataField: PropTypes.func.isRequired,
  icp4dAuthError: PropTypes.number,
  setAuthError: PropTypes.func.isRequired,

  icp4dUrl: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  rememberPassword: PropTypes.bool.isRequired,
  currentStep: PropTypes.number.isRequired
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Step1);
