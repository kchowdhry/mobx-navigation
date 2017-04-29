import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';

import CachedScene from './CachedScene';

export const Tab2 = (props) => {
  const onPress = () => {
    props.navState.push(Tab2Scene1);
  };

  const onPress2 = () => {
    props.navState.push(CachedScene, { key: 'key1' });
  };

  const onPress3 = () => {
    props.navState.push(CachedScene, { key: 'key2' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Button title={'Tab 2'} onPress={onPress} />
      <Button title={'Cached scene'} onPress={onPress2} />
      <Button title={'Different scene'} onPress={onPress3} />
    </View>
  );
}

Tab2.navConfig = {
  tabAffinity: '2',
  tabBarVisible: true,
};

export const Tab2Scene1 = (props) => {
  return (
    <View style={{flex: 1, backgroundColor: 'white' }}>
      <Text>
        Tab 2 scene 1
      </Text>
    </View>
  )
}

Tab2Scene1.navConfig = {
  navBarVisible: true,
  tabAffinity: '2',
};
