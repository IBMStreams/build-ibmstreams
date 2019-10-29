'use babel';
'use strict';

import PropTypes from 'prop-types';
import React from 'react';
import { Button, ButtonToolbar, Form } from 'react-bootstrap';
import { ReactLoading } from 'react-loading';
import Select from 'react-select';
import { connect } from 'react-redux';
import {
  setSelectedCp4dStreamsInstance,
  setCurrentLoginStep,
  connectionV5Selectors as ConnV5Selectors
} from '..';

const buttonBarStyle = {
  display: 'flex',
  width: '100%'
};

class Step2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      localSelection: null
    };
  }

  onInstanceSelectionChange = (selectedInstance) => {
    this.setState({ localSelection: selectedInstance });
  }

  setInstanceSelection = () => {
    const { setInstance } = this.props;
    const { localSelection } = this.state;
    setInstance(localSelection);
  }

  renderLoadingSpinner = () => {
    const { isAuthenticating } = this.state;
    return isAuthenticating ? (
      <ReactLoading className="loadingSpinner" type="spin" height="10%" width="10%" />
    ) : null;
  }

  render() {
    const {
      currentStep,
      streamsInstances,
      setCurrentStep,
      closePanel
    } = this.props;

    const {
      localSelection
    } = this.state;

    if (currentStep !== 2) {
      return null;
    }

    return (
      <div className="native-key-bindings">
        {this.renderLoadingSpinner()}
        <Form>
          <Form.Group controlId="formInstanceSelection">
            <Form.Label>Streams instance</Form.Label>
            <Select
              isSearchable
              options={streamsInstances.map(streamsInstance => ({ value: streamsInstance, label: streamsInstance.ServiceInstanceDisplayName }))}
              onChange={this.onInstanceSelectionChange}
              value={localSelection}
              placeholder="Select a Streams instance"
            />
          </Form.Group>

          <ButtonToolbar className="justify-content-between" style={buttonBarStyle}>
            <ButtonToolbar className="justify-content-start" style={buttonBarStyle}>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!localSelection}
                onClick={this.setInstanceSelection}
              >
                Next
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="submit"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            </ButtonToolbar>
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
  return {
    streamsInstances: ConnV5Selectors.getStreamsInstances(state) ? ConnV5Selectors.getStreamsInstances(state).toJS() : [],
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setInstance: (selectedInstance) => dispatch(setSelectedCp4dStreamsInstance(selectedInstance.value)),
    setCurrentStep: (newStep) => dispatch(setCurrentLoginStep(newStep))
  };
};

Step2.propTypes = {
  currentStep: PropTypes.number.isRequired,
  streamsInstances: PropTypes.arrayOf(PropTypes.any).isRequired,
  setInstance: PropTypes.func.isRequired,
  setCurrentStep: PropTypes.func.isRequired,
  closePanel: PropTypes.func.isRequired
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Step2);
