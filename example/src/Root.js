import React from 'react';
import {
  Button,
  Text,
  View
} from 'react-native';

import { NavContainer, NavTab } from '../..';

const TestScene = (props) => {
  const onPress = () => {
    props.navState.push(TestScene2);
  };

  const onPress2 = () => {
    props.navState.replace(TestScene3);
  };

  const onPress3 = () => {
    props.navState.tabs();
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'orange', marginTop: 20 }}>
      <Button title={props.text} onPress={onPress} />
      <Button title={'Test replace'} onPress={onPress2} />
      <Button title={'Tabs!'} onPress={onPress3} />
    </View>
  )
};
TestScene.navConfig = {
  // Root scenes are housed on the root stack prior to the existence of the tab bar
  isRootScene: true
};

const TestScene2 = (props) => {
  const onPress = () => {
    props.navState.pop();
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Button title={'Test 2'} onPress={onPress} />
    </View>
  )
};
TestScene2.navConfig = {
  tabBarVisible: true,
}

const TestScene3 = (props) => {
  const onPress = () => {
    props.navState.push(TestScene, { text: 'came from 3' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'orange' }}>
      <Button title={'Test 3'} onPress={onPress} />
    </View>
  )
};

// ES6 style scene component example
class Tab1 extends React.Component {
  static navConfig = {
    tabAffinity: '1',
    tabBarVisible: true,
    navBarVisible: true,
  };

  onPress = () => {
    this.props.navState.push(Tab1Scene1);
  };

  onPress2 = () => {
    this.props.navState.push(Tab2Scene1);
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', marginTop: 20 }}>
        <Button title={'scene 1'} onPress={this.onPress} />
        <Button title={'Tab 2 scene 1'} onPress={this.onPress2} />
      </View>
    );
  }
}

const Tab1Scene1 = (props) => {
  return (
    <View style={{flex: 1, backgroundColor: 'white', marginTop: 20}}>
      <Text>
        Tab 1 scene 1
      </Text>
    </View>
  )
}

Tab1Scene1.navConfig = {
  tabAffinity: '1',
  tabBarVisible: true,
  navBarVisible: true,
};

const Tab2 = (props) => {
  const onPress = () => {
    props.navState.push(Tab2Scene1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', marginTop: 20 }}>
      <Button title={'Tab 2'} onPress={onPress} />
    </View>
  );
}

Tab2.navConfig = {
  tabAffinity: '2',
  tabBarVisible: true,
};

const Tab2Scene1 = (props) => {
  return (
    <View style={{flex: 1, backgroundColor: 'white', marginTop: 20}}>
      <Text>
        Tab 2 scene 1
      </Text>
    </View>
  )
}

Tab2Scene1.navConfig = {
  tabAffinity: '2',
};

const Tab3 = (props) => {
  const onPress = () => {
    props.navState.push(Tab3Scene1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', marginTop: 20 }}>
      <Button title={'Tab 3'} onPress={onPress} />
    </View>
  );
}

Tab3.navConfig = {
  tabAffinity: '3',
  tabBarVisible: true,
};

const Tab3Scene1 = (props) => {
  return (
    <View style={{flex: 1, backgroundColor: 'white', marginTop: 20}}>
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

const TabCommon = (props) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', marginTop: 20 }}>
      <Button title={'Tab Common'} onPress={onPress} />
    </View>
  );
}

export default class Root extends React.Component {
  render() {
    return (
      <NavContainer initialScene={TestScene} initialProps={{ text: 'hello world' }}>
        <NavTab initialScene={Tab1} name={'1'} isInitial />
        <NavTab initialScene={Tab2} name={'2'} />
        <NavTab initialScene={Tab3} name={'3'} initialProps={{ color: 'red' }} />
      </NavContainer>
    )
  }
}