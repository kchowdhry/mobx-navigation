import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';
import { inject, observer } from 'mobx-react';

import { child, scene } from '../..';

@child class Child1 extends React.Component {
  componentWillHide() {
    console.log('Child 1 hiding');
  }

  componentDidHide() {
    console.log('Child 1 hid');
  }

  componentWillShow() {
    console.log('Child 1 showing');
  }

  componentDidShow() {
    console.log('Child 1 shown');
  }

  render() {
    return (
      <View>
        <Text>
          {'Child 1'}
        </Text>
      </View>
    );
  }
}

@child class Child2 extends React.Component {
  componentWillHide() {
    console.log('Child 2 hiding');
  }

  componentDidHide() {
    console.log('Child 2 hid');
  }

  componentWillShow() {
    console.log('Child 2 showing');
  }

  componentDidShow() {
    console.log('Child 2 shown');
  }

  render() {
    return (
      <View>
        <Text>
          {'Child 2'}
        </Text>
      </View>
    );
  }
}

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
        <Child1 />
        <Child2 />
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
