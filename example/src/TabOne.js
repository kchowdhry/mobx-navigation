import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';

import { Tab2Scene1 } from './TabTwo';

export class Tab1 extends React.Component {
  static navConfig = {
    tabAffinity: '1',
    tabBarVisible: true,
    navBarVisible: true,
  };

  onPress = () => {
    this.props.navState.push(Tab1Scene1);
  };

  onPress2 = () => {
    this.props.navState.push(Tab2Scene1);
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Button title={'scene 1'} onPress={this.onPress} />
        <Button title={'Tab 2 scene 1'} onPress={this.onPress2} />
      </View>
    );
  }
}

export const Tab1Scene1 = (props) => {
  return (
    <View style={{flex: 1, backgroundColor: 'white' }}>
      <Text>
        Tab 1 scene 1
      </Text>
    </View>
  )
}

Tab1Scene1.navConfig = {
  tabAffinity: '1',
  tabBarVisible: true,
  navBarVisible: true,
};
