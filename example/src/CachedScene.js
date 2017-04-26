import React from 'react';

import {
  Button,
  Text,
  View,
} from 'react-native';

import { observable } from 'mobx';
import { observer } from 'mobx-react';

const createdCount = 0;

@observer
export default class CachedScene extends React.Component {
  static navConfig = {
    tabBarVisible: true,
    navBarVisible: true,
    cacheHint: props => props.key,
  }

  @observable counter = 0;

  constructor(props) {
    super(props);
    createdCount += 1;
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
