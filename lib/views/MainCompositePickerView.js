'use babel';
'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import MainCompositePicker from '../modules/build/components/MainCompositePicker';

export default class MainCompositePickerView {
  handleBuild;

  handleCancel;

  mainComposite: string;

  namespace: string;

  picker: MainCompositePicker;

  constructor(handleBuild, handleCancel) {
    this.element = document.createElement('div');
    this.element.classList.add('main-composite-picker');
    this.element.classList.add('native-key-bindings');
    this.handleBuild = handleBuild;
    this.handleCancel = handleCancel;
    this.render();
  }

  render() {
    ReactDOM.render(
      <MainCompositePicker
        ref={(picker) => this.picker = picker}
        handleUpdate={this.updateSelectedValue.bind(this)}
        handleBuild={this.handleBuild}
        handleCancel={this.handleCancel}
      />, this.element
    );
  }

  /**
   * callback to keep track of user selection in the picker component.
   */
  updateSelectedValue(namespace, mainComposite) {
    this.namespace = namespace;
    this.mainComposite = mainComposite;
  }

  /**
   * Update picker component state with the parsed namespace and main composites
   */
  updatePickerContent(namespace, mainComposites) {
    this.picker.setState({ namespace, mainComposites });
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this.element);
    this.element.remove();
  }

  getElement() {
    return this.element;
  }
}
