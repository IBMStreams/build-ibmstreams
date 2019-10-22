'use babel';
'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import {
  TextInput,
  Button,
  Form,
  FormGroup,
} from 'carbon-components-react';
import Collapsible from 'react-collapsible';

export default class SubmissionTimeView {
  constructor(closePanel, submissionTimeValues, input) {
    this.element = document.createElement('div');
    this.state = {
      isCollapsed: false
    };
    this.submissionParams = {};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.input = input;
    let inputs = [];
    const sections = [];
    let isFirst = true;
    let title;
    submissionTimeValues.sort((a, b) => a.attr.index - b.attr.index);
    const boolComposites = {};
    let sec = 0;
    let name;
    let compositeName;
    for (let i = 0, item = 0; i < submissionTimeValues.length; i += 1, item += 1) {
      compositeName = submissionTimeValues[i].attr.compositeName;
      let defaultValue = submissionTimeValues[i].attr.defaultValue;
      name = submissionTimeValues[i].attr.name;
      if (defaultValue) {
        defaultValue = defaultValue.replace(/^"/, '');
        defaultValue = defaultValue.replace(/"$/, '');
        this.submissionParams[`${compositeName}.${name}`] = {
          name: `${compositeName}.${name}`,
          value: defaultValue
        };
      }
      if (!boolComposites[compositeName]) {
        if (!isFirst) {
          sections[sec] = React.createElement(Collapsible, {
            trigger: title,
            open: true,
            key: `collapsible ${sec}`,
          }, inputs);
          sec += 1;
          item = 0;
          inputs = [];
        } else {
          isFirst = false;
        }
        title = <h2 className="block stvHover h2Style">{compositeName}</h2>;
        boolComposites[compositeName] = true;
      }
      inputs[item] = (
        <div className="inputDivStyle" key={`${compositeName}${name} -- ${i}`}>
          <h3 className="svtH3">{name}</h3>
          <TextInput name={`${compositeName}.${name}`} className="input-text inputSyle" id={`${compositeName}${name}`} defaultValue={defaultValue} required placeholder="input value" onChange={this.handleChange} />
        </div>
      );
    }
    sections[sec] = React.createElement(Collapsible, {
      trigger: title,
      open: true,
      key: `collapsible ${sec}`,
    }, inputs);
    this.textInputs = React.createElement('div', [], sections);
    this.closePanel = closePanel;
    this.render();
  }

  setSubmissionParams(index, value) {
    this.submissionParams[index] = value;
  }

  handleChange(event) {
    this.setSubmissionParams(event.target.name, { name: event.target.name, value: event.target.value });
  }


  handleSubmit(event) {
    const params = [];
    const state = this.getSubmissionTimeParams();
    Object.keys(state).forEach(key => {
      params.push(state[key]);
    });
    if (this.input.type === 'V4') {
      this.input.submissionObservableInput.submissionTimeValues = JSON.stringify(params);
      this.submitFunc(this.input.submissionObservableFunc, this.input.submissionObservableInput);
    } else {
      this.input.submitCallback(params);
    }
    this.closePanel();
  }

  render() {
    ReactDOM.render(
      <div>
        <h1>Submission time parameters</h1>
        <Form className="native-key-bindings" onSubmit={this.handleSubmit}>
          <FormGroup className="formStyle" legendText="">
            {this.textInputs}
          </FormGroup>
          <Button className="btn btn-sm buttonStyle" type="reset" onClick={this.closePanel} size="small">Cancel</Button>
          <Button className="btn btn-primary btn-sm submitButtonStyle" type="submit" size="small">Submit</Button>
        </Form>
      </div>,
      this.element
    );
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this.element);
  }

  getElement() {
    return this.element;
  }

  getSubmissionTimeParams() {
    return this.submissionParams;
  }
}
