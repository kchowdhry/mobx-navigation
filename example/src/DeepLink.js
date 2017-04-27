import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';
import { observer } from 'mobx-react'

import UniqueScene from './Unique';

const SceneOne = (props) => {
  return (
    <View>
      <Text>
        One
      </Text>
    </View>
  )
};
SceneOne.navConfig = {
  tabAffinity: '3',
  navBarVisible: true,
};

const SceneTwo = (props) => {
  return (
    <View>
      <Text>
        Two
      </Text>
    </View>
  )
};
SceneTwo.navConfig = {
  navBarVisible: true,
};

@observer
export default class DeepLink extends React.Component {
  static navConfig = {
    navBarVisible: true,
    tabBarVisible: true,
  };

  onPress = () => {
    const navState = this.props.navState;
    navState.multistep([
      () => navState.push(SceneOne),
      () => navState.push(SceneTwo),
    ]);
  }

  onPress2 = () => {
    this.props.navState.push(UniqueScene, { text: 'From tab 4' });
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