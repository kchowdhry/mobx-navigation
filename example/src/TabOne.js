import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';
import { inject, observer } from 'mobx-react';
import { scene } from '../..';

@scene('Tab1') @inject('testStore') @observer
export class Tab1 extends React.Component {
  static navConfig = {
    tabAffinity: '1',
    tabBarVisible: true,
    navBarVisible: true,
    templates: ['test'],
  };

  onPress = () => {
    this.props.navState.push('Tab1Scene1');
  };

  onPress2 = () => {
    this.props.navState.push('Tab2Scene1', { custom: ' there' });
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Button title={'scene 1'} onPress={this.onPress} style={{ backgroundColor: 'white' }} />
        <Button title={'Tab 2 scene 1'} onPress={this.onPress2} style={{ backgroundColor: 'white' }} />
        <Text style={{ color: 'white' }} >
          {this.props.testStore.data}
        </Text>
      </View>
    );
  }
}

export const Tab1Scene1 = scene('Tab1Scene1')((props) => {
  return (
    <View style={{ flex: 1 }}>
      <Text>
        Tab 1 scene 1
      </Text>
    </View>
  )
});

Tab1Scene1.navConfig = {
  tabAffinity: '1',
  tabBarVisible: true,
  navBarVisible: true,
  templates: ['test', 'test2'],
};
