import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';
import { observer } from 'mobx-react'

import { scene } from '../..';

import UniqueScene from './Unique';

@scene('SceneOne')
class SceneOne extends React.Component {
  static navConfig = {
    tabAffinity: '3',
    navBarVisible: true,
  };

  render() {
    return (
      <View>
        <Text>
          One
      </Text>
      </View>
    );
  }
}

@scene('SceneTwo')
class SceneTwo extends React.Component {
  static navConfig = {
    navBarVisible: true,
  };

  render() {
    return (
      <View>
        <Text>
          Two
      </Text>
      </View>
    );
  }
}

@scene('DeepLink') @observer
export default class DeepLink extends React.Component {
  static navConfig = {
    cardStyle: {
      backgroundColor: 'red',
    },
    navBarVisible: true,
    tabBarVisible: true,
  };

  onPress = () => {
    const navState = this.props.navState;
    navState.multistep([
      () => navState.push('SceneOne'),
      () => navState.push('SceneTwo'),
    ]);
  }

  onPress2 = () => {
    this.props.navState.push('UniqueScene', { text: 'From tab 4' });
  }

  render() {
    return (
      <View>
        <Button title='Deeplink to two' onPress={this.onPress} />
        <Button title='Link to unique' onPress={this.onPress2} />
      </View>
    )
  }
}