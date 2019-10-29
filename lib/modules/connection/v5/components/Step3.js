'use babel';
'use strict';

import PropTypes from 'prop-types';
import React from 'react';
import { Button, ButtonToolbar, Alert } from 'react-bootstrap';
import { connect } from 'react-redux';
import {
  setCurrentLoginStep,
  connectionV5Selectors as ConnV5Selectors,
} from '..';

const buttonContainerStyle = {
  paddingTop: '20px'
};

class Step3 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderStreamsAuthError = () => {
    const {
      streamsAuthError,
      selectedInstanceName,
      setCurrentStep,
      closePanel,
      currentStep
    } = this.props;
    if (!streamsAuthError) {
      return null;
    }
    return (
      <Alert key="StreamsAuthErrorAlert" variant="danger">
        {`Error authenticating to Streams instance ${selectedInstanceName}`}

        <div className="buttonContainer" style={buttonContainerStyle}>
          <ButtonToolbar className="justify-content-between">
            <Button
              variant="outline-secondary"
              size="sm"
              type="submit"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </Button>

            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => closePanel()}
            >
              Close
            </Button>
          </ButtonToolbar>
        </div>
      </Alert>
    );
  }

  renderStreamsAuthSuccess = () => {
    const {
      streamsAuthError,
      selectedInstanceName,
      setCurrentStep,
      currentStep,
      closePanel
    } = this.props;
    if (streamsAuthError) {
      return null;
    }
    return (
      <Alert key="StreamsAuthSuccessAlert" variant="success">
        {`Successfully authenticated to Streams instance ${selectedInstanceName}`}

        <div className="buttonContainer" style={buttonContainerStyle}>
          <ButtonToolbar className="justify-content-between">
            <Button
              variant="outline-secondary"
              size="sm"
              type="submit"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </Button>

            <Button
              variant="outline-success"
              size="sm"
              onClick={() => closePanel()}
            >
              Close
            </Button>
          </ButtonToolbar>
        </div>
      </Alert>
    );
  }

  render() {
    const {
      currentStep
    } = this.props;
    if (currentStep !== 3) {
      return null;
    }
    return (
      <div className="native-key-bindings">
        {this.renderStreamsAuthError()}
        {this.renderStreamsAuthSuccess()}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    streamsAuthError: ConnV5Selectors.getStreamsAuthError(state) || null,
    selectedInstanceName: ConnV5Selectors.getSelectedInstanceName(state) || ''
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentStep: (newStep) => dispatch(setCurrentLoginStep(newStep))
  };
};

Step3.defaultProps = {
  streamsAuthError: null
};

Step3.propTypes = {
  currentStep: PropTypes.number.isRequired,
  selectedInstanceName: PropTypes.string.isRequired,
  streamsAuthError: PropTypes.string,
  closePanel: PropTypes.func.isRequired,
  setCurrentStep: PropTypes.func.isRequired,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Step3);
