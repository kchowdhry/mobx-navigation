import React from 'react';

import {
  Animated,
  Keyboard,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { observable } from 'mobx';
import { observer } from 'mobx-react';

import PropTypes from 'prop-types';

import Log from './Logger';
import NavTab from './NavTab';

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
    bottom: 0,
    backgroundColor: 'white',
  },
  offscreen: {
    transform: [
      {
        translateX: 100000,
      },
    ],
  }
});

@observer
export default class NavTabBar extends React.Component {
  static propTypes = {
    children: function(props, propName, componentName) {
      if (!props[propName]) {
        return;
      }

      // All children to the NavTabBar must be React elements of type NavTab
      if (props[propName].length > 0) {
        props[propName].forEach((child) => {
          if (child.type !== 'NavTab') {
            return new Error(`Invalid child ${child.type} passed as a child of ${componentName}.
            All children are expected to be NavTabs.`);
          }
        });
      }
    },
    height: PropTypes.number,
    style: View.propTypes.style,
  };


  get xform() {
    if (!this.props.navState.front) {
      return null;
    }

    // If the keyboard is visible, never display the tab bar
    if (this.props.navState.keyboardVisible) {
      return styles.offscreen;
    }

    // if both the front and the back scenes have a tab bar, simply show
    const front = this.props.navState.front.element;
    const back = this.props.navState.back ? this.props.navState.back.element : null;
    if (front.tabBarVisible && back && back.tabBarVisible) {
      // display and do not animate
      return null;
    } else if (front.tabBarVisible && (!back || !back.tabBarVisible)) {
      // The front scene shows the tab bar and the back scene either doesn't exist or doesn't show the tab
      // bar
      return {
        transform: [
          {
            translateX: this.props.navState.transitionValue.interpolate({
              inputRange: [0, 1],
              outputRange: [this.props.width, 0],
            }),
          },
        ],
      };
    }

    // Neither the front or back scene displays the tab bar
    return {
      transform: [
        {
          translateX: 65536,
        }
      ]
    };
  }

  get tabs() {
    return React.Children.map(this.props.children, child => React.cloneElement(child, { ...this.props }));
  }

  componentWillMount() {
    // TODO: Hack, both events should be the "Will" variant of the event whenever the RN team manages to get around to
    // fixing the "Will" events on Android.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    this.keyboardVisibleListener = Keyboard.addListener(showEvent, () => {
      this.props.navState.keyboardVisible = true;
    });
    this.keyboardNotVisibleListener = Keyboard.addListener(hideEvent, () => {
      this.props.navState.keyboardVisible = false;
    });
  }

  componentWillUnmount() {
    this.keyboardVisibleListener.remove();
    this.keyboardNotVisibleListener.remove();
  }

  render() {
    if (React.Children.count(this.props.children) === 0) {
      return null;
    }

    const style = {
      top: this.props.height - this.props.navState.config.tabBarHeight,
    };

    return (
      <Animated.View style={[styles.container, style, this.props.style, this.xform]}>
        <View style={styles.buttons}>
          {this.tabs}
        </View>
      </Animated.View>
    )
  }
}
