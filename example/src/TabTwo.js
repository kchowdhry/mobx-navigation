import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';
import { inject, observer } from 'mobx-react';

import { scene } from '../..';

@scene('Tab2')
export class Tab2 extends React.Component {
  static navConfig = {
    tabAffinity: '2',
    tabBarVisible: true,
  };

  onPress = () => {
    this.props.navState.push('Tab2Scene1');
  };

  onPress2 = () => {
    this.props.navState.push('CachedScene', { key: 'key1' });
  };

  onPress3 = () => {
    this.props.navState.push('CachedScene', { key: 'key2' });
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Button title={'Tab 2'} onPress={this.onPress} />
        <Button title={'Cached scene'} onPress={this.onPress2} />
        <Button title={'Different scene'} onPress={this.onPress3} />
      </View>
    );
  }
}

@scene('Tab2Scene1') @inject('testStore') @observer
export class Tab2Scene1 extends React.Component {
  static navConfig = {
    navBarVisible: true,
    tabAffinity: '2',
  };

  onPress = () => {
    this.props.navState.tabRoot('3');
  }

  onPress2 = () => {
    this.props.navState.tabRoot();
  }

  componentWillHide() {
    console.log('Tab2Scene1 hiding');
  }

  componentDidHide() {
    console.log('Tab2Scene1 hid');
  }

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Text>
          {this.props.testStore.data}
          {this.props.custom}
        </Text>
        <Button title={'Reset Tab 3'} onPress={this.onPress} />
        <Button title={'Reset Tab 2'} onPress={this.onPress2} />
      </View>
    );
  }
}
