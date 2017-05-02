import React from 'react';

import {
  Button,
  Text,
  View,
} from 'react-native';

import { observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import { scene } from '../..'

const createdCount = 0;

@scene('CachedScene') @inject('testStore') @observer
export class CachedScene extends React.Component {
  static navConfig = {
    tabBarVisible: true,
    navBarVisible: true,
    cacheHint: props => props.key,
  }

  @observable counter;

  constructor(props) {
    super(props);
    createdCount += 1;
    this.counter = 0;
  }

  componentWillShow() {
    console.log('Cached scene coming online');
  }

  componentDidShow() {
    console.log('Cached scene came online');
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <Text>
          {this.counter}
        </Text>
        <Button title='increment!' onPress={() => this.counter += 1} />
        <Text>
          {`There have been ${createdCount} created instance(s).`}
        </Text>
      </View>
    )
  }
}

@scene('CachedScene2') @observer
export class CachedScene2 extends React.Component {
  static navConfig = {
    tabBarVisible: true,
    navBarVisible: true,
    cacheHint: props => props.key,
  }

  @observable counter;

  constructor(props) {
    super(props);
    createdCount += 1;
    this.counter = 0;
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <Text>
          {this.counter}
        </Text>
        <Button title='increment!' onPress={() => this.counter += 1} />
        <Text>
          {`There have been ${createdCount} created instance(s). (Note this is CachedScene2)`}
        </Text>
      </View>
    )
  }
}
