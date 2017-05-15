import React, { Component } from 'react';
import { AppRegistry } from 'react-native';
import Root from './src/Root';

export default class example extends Component {
  render() {
    return (
      <Root />
    );
  }
}

AppRegistry.registerComponent('example', () => example);
