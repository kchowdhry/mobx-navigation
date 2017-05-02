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
    this.props.navState.push('Tab1Scene1Alt');
  };

  onPress3 = () => {
    this.props.navState.push('Tab2Scene1', { custom: ' there' });
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Button title={'scene 1'} onPress={this.onPress} style={{ backgroundColor: 'white' }} />
        <Button title={'scene 1 alt'} onPress={this.onPress2} style={{ backgroundColor: 'white' }} />
        <Button title={'Tab 2 scene 1'} onPress={this.onPress3} style={{ backgroundColor: 'white' }} />
        <Text style={{ color: 'white' }} >
          {this.props.testStore.data}
        </Text>
      </View>
    );
  }
}

@scene
class Tab1Scene1 extends React.Component {
  static navConfig = {
    custom: {
      myCustomConfig: 'custom config',
    },
    navBarCenter: (props) => {
      return (
        <View>
          <Text>
            {'Common config'}
          </Text>
        </View>
      );
    }
  };

  static multiNavConfig = {
    Tab1Scene1: {
      tabAffinity: '1',
      tabBarVisible: true,
      navBarVisible: true,
    },
    Tab1Scene1Alt: {
      tabAffinity: '1',
      tabBarVisible: true,
      navBarVisible: true,
      navBarStyle: {
        backgroundColor: 'red',
      }
    }
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Text>
          {this.props.navState.frontCustomConfig.myCustomConfig}
        </Text>
        <Button title="Tab1Scene2" onPress={() => this.props.navState.push('Tab1Scene2')} />
      </View>
    );
  }
}


export const Tab1Scene2 = scene('Tab1Scene2')((props) => {
  return (
    <View style={{ flex: 1 }}>
      <Text>
        Tab 1 scene 2
      </Text>
      <Button title="Tab1Scene3" onPress={() => props.navState.push('Tab1Scene3')} />
    </View>
  )
});

Tab1Scene2.navConfig = {
  tabAffinity: '1',
  tabBarVisible: true,
  navBarVisible: true,
};

export const Tab1Scene3 = scene('Tab1Scene3')((props) => {
  return (
    <View style={{ flex: 1 }}>
      <Text>
        Tab 1 scene 3
      </Text>
      <Button title="Pop to scene 1" onPress={() => props.navState.popTo('Tab1Scene1')} />
      <Button title="Pop three times" onPress={() => props.navState.pop(3)} />
    </View>
  )
});

Tab1Scene3.navConfig = {
  tabAffinity: '1',
  tabBarVisible: true,
  navBarVisible: true,
};
