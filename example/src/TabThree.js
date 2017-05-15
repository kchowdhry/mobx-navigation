import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';
import { inject, observer } from 'mobx-react';
import { scene } from '../..';

@inject('navState') @observer
export class TabDisplay extends React.Component {
  render() {
    return (
      <View style={{ marginTop: 20 }}>
        <Text style={{ color: 'red' }}>
          {this.props.navState.activeTab}
        </Text>
      </View>
    )
  }
}

@scene('Tab3')
export class Tab3 extends React.Component {
  static navConfig = {
    tabAffinity: '3',
    tabBarVisible: true,
    template: 'test',
  };

  onPress = () => {
    this.props.navState.push('Tab3Scene1');
  };

  onPress2 = () => {
    this.props.navState.push('ComplexScene', { title: 'start' });
  }

  onPress3 = () => {
    this.props.navState.push('CachedScene', { key: 'key1' });
  }

  onPress4 = () => {
    this.props.navState.push('CachedScene2', { key: 'key1' });
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Button title={'Tab 3'} onPress={this.onPress} />
        <Button title={'Complex'} onPress={this.onPress2} />
        <Button title={'Cached scene'} onPress={this.onPress3} />
        <Button title={'Different scene with same key'} onPress={this.onPress4} />
        <TabDisplay />
      </View>
    );
  }
}

@scene('Tab3Scene1')
export class Tab3Scene1 extends React.Component {
  static navConfig = {
    tabAffinity: '3',
    tabBarVisible: true,
  };
  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Text>
          Tab 2 scene 1
      </Text>
      </View>
    );
  }
}

