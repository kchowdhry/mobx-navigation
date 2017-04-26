import React from 'react';

import {
  Button,
  Text,
  View,
} from 'react-native';

import { observable } from 'mobx';
import { observer } from 'mobx-react';

const ref = null;

@observer
export default class CachedScene extends React.Component {
  static navConfig = {
    tabBarVisible: true,
    navBarVisible: true,
    cacheHint: props => props.key,
  }

  componentWillMount() {
    if (!ref) {
      ref = this;
      this.message = 'hurray';
    } else {
      this.message = 'error';
    }
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <Text>
          {this.message}
        </Text>
      </View>
    )
  }
}
