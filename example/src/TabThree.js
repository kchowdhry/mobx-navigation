import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';

import CachedScene from './CachedScene';
import ComplexScene from './ComplexScene';

export const Tab3 = (props) => {
  const onPress = () => {
    props.navState.push(Tab3Scene1);
  };

  const onPress2 = () => {
    props.navState.push(ComplexScene, { title: 'start' });
  }

  const onPress3 = () => {
    props.navState.push(CachedScene, { key: 'key1' });
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Button title={'Tab 3'} onPress={onPress} />
      <Button title={'Complex'} onPress={onPress2} />
      <Button title={'Cached scene'} onPress={onPress3} />
    </View>
  );
}

Tab3.navConfig = {
  tabAffinity: '3',
  tabBarVisible: true,
};

export const Tab3Scene1 = (props) => {
  return (
    <View style={{flex: 1, backgroundColor: 'white' }}>
      <Text>
        Tab 2 scene 1
      </Text>
    </View>
  )
}

Tab3Scene1.navConfig = {
  tabAffinity: '3',
  tabBarVisible: true,
};
