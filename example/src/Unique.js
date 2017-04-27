import React from 'react';

import {
  Button,
  Text,
  View,
} from 'react-native';

class OtherScene extends React.Component {
  static navConfig = {
    navBarVisible: true,
    tabBarVisible: true,
  };

  onPress = () => {
    this.props.navState.push(UniqueScene, { text: 'from other' });
  }

  onPress2 = () => {
    this.props.navState.replace(UniqueScene, { text: 'replaced other' });
  }

  render() {
    return (
      <View>
        <Text>
          I am another scene
      </Text>
        <Button title='Push unique scene' onPress={this.onPress} />
        <Button title='Replace with unique scene' onPress={this.onPress2} />
      </View>
    );
  }
}

export default class UniqueScene extends React.Component {
  static navConfig = {
    navBarVisible: true,
    tabBarVisible: true,
    // Unique scenes, when pushed onto a stack will search downwards from the
    // top of the stack and if it encounters a screen with the same component
    // type, it will replace it
    unique: true,
  };

  onPress = () => {
    this.props.navState.push(OtherScene);
  }

  render() {
    return (
      <View>
        <Button title='To other' onPress={this.onPress} />
        <Text>
          I am a unique scene
        </Text>
        <Text>
          {this.props.text}
        </Text>
      </View>
    );
  }
}
