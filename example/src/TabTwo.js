import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';
import { inject, observer } from 'mobx-react';

import { scene } from '../..';

export const Tab2 = scene('Tab2')((props) => {
  const onPress = () => {
    props.navState.push('Tab2Scene1');
  };

  const onPress2 = () => {
    props.navState.push('CachedScene', { key: 'key1' });
  };

  const onPress3 = () => {
    props.navState.push('CachedScene', { key: 'key2' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Button title={'Tab 2'} onPress={onPress} />
      <Button title={'Cached scene'} onPress={onPress2} />
      <Button title={'Different scene'} onPress={onPress3} />
    </View>
  );
});

Tab2.navConfig = {
  tabAffinity: '2',
  tabBarVisible: true,
};

@scene('Tab2Scene1') @inject('testStore') @observer
export class Tab2Scene1 extends React.Component {
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

Tab2Scene1.navConfig = {
  navBarVisible: true,
  tabAffinity: '2',
};
