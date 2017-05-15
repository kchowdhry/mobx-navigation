import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';
import { Provider } from 'mobx-react';

import { scene, NavContainer, NavTab } from '../..';
import './CachedScene';
import './ComplexScene';

import DeepLink from './DeepLink';

import { Tab1 } from './TabOne';
import { Tab2 } from './TabTwo';
import { Tab3 } from './TabThree';

@scene('TestScene')
class TestScene extends React.Component {
  static navConfig = {
    // Root scenes are housed on the root stack prior to the existence of the tab bar
    isRootScene: true
  };

  onPress = () => {
    this.props.navState.push('TestScene2');
  };

  onPress2 = () => {
    this.props.navState.replace('TestScene3');
  };

  onPress3 = () => {
    this.props.navState.tabs();
  }

  render() {

    return (
      <View style={{ flex: 1, backgroundColor: 'orange' }}>
        <Button title={this.props.text} onPress={this.onPress} />
        <Button title={'Test replace'} onPress={this.onPress2} />
        <Button title={'Tabs!'} onPress={this.onPress3} />
      </View>
    );
  }
}

@scene('TestScene2')
class TestScene2 extends React.Component {
  static navConfig = {
    tabBarVisible: true,
  };

  onPress = () => {
    this.props.navState.pop();
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Button title={'Test 2'} onPress={this.onPress} />
      </View>
    );
  }
}

@scene('TestScene3')
class TestScene3 extends React.Component {
  onPress = () => {
    this.props.navState.push('TestScene', { text: 'came from 3' });
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'orange' }}>
        <Button title={'Test 3'} onPress={onPress} />
      </View>
    );
  }
}

const TabCommon = (props) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Button title={'Tab Common'} onPress={onPress} />
    </View>
  );
}

const testStore = {
  data: 'hello',
};

const testTemplate = {
  cardStyle: {
    backgroundColor: 'grey',
  },
};

const secondTemplate = {
  navBarStyle: {
    backgroundColor: 'grey',
  },
};

export default class Root extends React.Component {
  render() {
    return (
      <Provider testStore={testStore}>
        <NavContainer
          templates={{
            test: testTemplate,
            test2: secondTemplate,
          }}
          initialScene={TestScene}
          initialProps={{ text: 'hello world' }}
          logLevel={0}
        >
          <NavTab initialScene={Tab1} name={'1'} isInitial />
          <NavTab initialScene={Tab2} name={'2'} />
          <NavTab initialScene={Tab3} name={'3'} initialProps={{ color: 'red' }} />
          <NavTab initialScene={DeepLink} name={'4'} />
        </NavContainer>
      </Provider>
    )
  }
}