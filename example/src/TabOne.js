import React from 'react';
import {
  Button,
  Text,
  TextInput,
  StyleSheet,
  View
} from 'react-native';
import { inject, observer } from 'mobx-react';
import { scene } from '../..';
import Circular from './Circular';

const styles = StyleSheet.create({
  test: {
    backgroundColor: 'green',
  },
});

@scene('Tab1') @inject('testStore') @observer
export class Tab1 extends React.Component {
  static navConfig = {
    tabAffinity: '1',
    tabBarVisible: true,
    navBarVisible: true,
    cardStyle: styles.test,
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

  onPress4 = () => {
    this.props.navState.push('Circular');
  }

  onPress5 = () => {
    this.props.navState.reset();
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Button title={'scene 1'} onPress={this.onPress} style={{ backgroundColor: 'white' }} />
        <Button title={'scene 1 alt'} onPress={this.onPress2} style={{ backgroundColor: 'white' }} />
        <Button title={'Tab 2 scene 1'} onPress={this.onPress3} style={{ backgroundColor: 'white' }} />
        <Button title={'Circular'} onPress={this.onPress4} />
        <Button title={'reset'} onPress={this.onPress5} />
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
        <TextInput style={{ height: 40, borderColor: 'blue', borderWidth: 1 }} value="Test tab bar visibility" />
        <Button title="Tab1Scene2" onPress={() => this.props.navState.push('Tab1Scene2')} />
      </View>
    );
  }
}

@scene('Tab1Scene2')
export class Tab1Scene2 extends React.Component {
  static navConfig = {
    tabAffinity: '1',
    tabBarVisible: true,
    navBarVisible: true,
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Text>
          Tab 1 scene 2
      </Text>
        <Button title="Tab1Scene3" onPress={() => this.props.navState.push('Tab1Scene3')} />
      </View>
    )
  }
}

@scene('Tab1Scene3')
class Tab1Scene3 extends React.Component {
  static navConfig = {
    tabAffinity: '1',
    tabBarVisible: true,
    navBarVisible: true,
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Text>
          Tab 1 scene 3
      </Text>
        <Button title="Pop to scene 1" onPress={() => this.props.navState.popTo('Tab1Scene1')} />
        <Button title="Pop three times" onPress={() => this.props.navState.pop(3)} />
      </View>
    );
  }
}

export const CircularChild = (props) => {
  return (
    <View>
      <Text>
        {props.message}
      </Text>
    </View>
  )
}
