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

export const Tab3 = scene('Tab3')((props) => {
  const onPress = () => {
    props.navState.push('Tab3Scene1');
  };

  const onPress2 = () => {
    props.navState.push('ComplexScene', { title: 'start' });
  }

  const onPress3 = () => {
    props.navState.push('CachedScene', { key: 'key1' });
  }

  const onPress4 = () => {
    props.navState.push('CachedScene2', { key: 'key1' });
  }

  return (
    <View style={{ flex: 1 }}>
      <Button title={'Tab 3'} onPress={onPress} />
      <Button title={'Complex'} onPress={onPress2} />
      <Button title={'Cached scene'} onPress={onPress3} />
      <Button title={'Different scene with same key'} onPress={onPress4} />
      <TabDisplay />
    </View>
  );
});

Tab3.navConfig = {
  tabAffinity: '3',
  tabBarVisible: true,
  template: 'test',
};

export const Tab3Scene1 = scene('Tab3Scene1')((props) => {
  return (
    <View style={{flex: 1, backgroundColor: 'white' }}>
      <Text>
        Tab 2 scene 1
      </Text>
    </View>
  )
});

Tab3Scene1.navConfig = {
  tabAffinity: '3',
  tabBarVisible: true,
};
