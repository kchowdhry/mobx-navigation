import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { inject, observer } from 'mobx-react';

const styles = StyleSheet.create({
  buttons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  backButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: 'white',
  },
  title: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: 'white',
  },
  rightButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: 'white',
  },
});

const BackButton = (props) => {
  return (
    <View style={styles.backButton}>
      <Text>
        {'<'}
      </Text>
    </View>
  )
}

const Title = (props) => {
  return (
    <View style={styles.title}>
      <Text>
        Placeholder
      </Text>
    </View>
  )
}

const RightButton = (props) => {
  return (
    <View style={styles.rightButton}>
      <Text>
        Placeholder
      </Text>
    </View>
  )
}

@inject('navState') @observer
export default class NavBar extends React.Component {
  static propTypes = {
    style: View.propTypes.style,
  };

  render() {
    const left = this.props.left ? this.props.left : BackButton;
    const center = this.props.center ? this.props.center : Title;
    const right = this.props.right ? this.props.right : RightButton;

    const style = {
      bottom: this.props.height - this.props.navState.config.navBarHeight,
    };

    const hide = this.props.navState.activeNode.navBarVisible ? null : {
      transform: [
        {
          translateX: 100000
        }
      ]
    }

    return (
      <View style={[styles.container, style, this.props.style, hide]}>
        <View style={styles.buttons}>
          {React.createElement(left, this.props)}
          {React.createElement(center, this.props)}
          {React.createElement(right, this.props)}
        </View>
      </View>
    )
  }
}
