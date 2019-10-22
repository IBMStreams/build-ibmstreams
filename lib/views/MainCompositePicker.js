'use babel';
'use strict';

import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Button, ButtonToolbar, Modal } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';

export default class MainCompositePicker extends React.Component {
  mainComposites = [];

  namespace = '';

  chosenMainComposite = '';

  constructor(props) {
    super(props);
    this.state = { mainComposites: [] };
  }

  render() {
    const style = {
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px',
      borderLeftStyle: 'solid',
      borderLeftWidth: '1px',
      borderRightStyle: 'solid',
      borderRightWidth: '1px',
      fontWeight: 'bold',
      padding: '12px'
    };

    const { handleBuild, handleCancel } = this.props;
    const { show, mainComposites } = this.state;

    return (
      <Modal.Dialog
        show={show}
        style={style}
      >
        <Modal.Header>
          <Modal.Title>Main Composite</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CreatableSelect
            className="main-composite-select"
            isClearable
            onChange={this.handleChange.bind(this)}
            options={mainComposites.map(a => ({ label: a, value: a }))}
            placeholder="Select the main composite to build..."
          />
        </Modal.Body>
        <Modal.Footer>
          <ButtonToolbar style={{ paddingTop: '5px' }}>
            <Button variant="primary" onClick={handleBuild}>
              Build
            </Button>
            <Button variant="default" onClick={handleCancel}>
              Cancel
            </Button>
          </ButtonToolbar>
        </Modal.Footer>

      </Modal.Dialog>
    );
  }

  handleChange = (newValue, actionMeta) => {
    const { handleUpdate } = this.props;
    const { namespace } = this.state;
    if (newValue) {
      handleUpdate(namespace, newValue.value);
    } else {
      handleUpdate('', '');
    }
  }
}

MainCompositePicker.propTypes = {
  handleUpdate: PropTypes.func.isRequired,
  handleBuild: PropTypes.func.isRequired,
  handleCancel: PropTypes.func.isRequired
};
