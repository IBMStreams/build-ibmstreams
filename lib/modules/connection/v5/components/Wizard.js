'use babel';
'use strict';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import {
  authenticateIcp4d,
  authenticateIcp4dStreamsInstance,
  authenticateStandaloneStreamsInstance,
  connectionV5Selectors as ConnV5Selectors
} from '..';

class Wizard extends React.Component {
  render() {
    const {
      currentStep,
      closePanel,
    } = this.props;

    return (
      <div className="native-key-bindings">
        <Step1
          authFunc={authenticateIcp4d}
          currentStep={currentStep}
          closePanel={closePanel}
        />
        <Step2
          currentStep={currentStep}
          closePanel={closePanel}
        />
        <Step3
          currentStep={currentStep}
          closePanel={closePanel}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentStep: ConnV5Selectors.getCurrentLoginStep(state) || 1
  };
};

Wizard.propTypes = {
  currentStep: PropTypes.number.isRequired,
  closePanel: PropTypes.func.isRequired
};

export default connect(
  mapStateToProps,
  { authenticateIcp4d, authenticateIcp4dStreamsInstance, authenticateStandaloneStreamsInstance }
)(Wizard);
