import React from 'react';

import {
  StyleSheet,
  View,
} from 'react-native';

import { inject, observer } from 'mobx-react';

import PropTypes from 'prop-types';

import { NavState, NavNode } from './NavState';
import NavTab from './NavTab';

const styles = StyleSheet.create({
  buttons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

@inject('navState') @observer
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

  render() {
    if (React.Children.count(this.props.children) === 0) {
      return null;
    }

    const style = {
      top: this.props.height - this.props.navState.config.tabBarHeight,
    };

    // Check if the active scene should hide the tab bar
    const hide = this.props.navState.activeNode && this.props.navState.activeNode.tabBarVisible ? null : {
      transform: [
        {
          translateX: 100000
        }
      ],
    };

    return (
      <View style={[styles.container, style, this.props.style, hide]}>
        <View style={styles.buttons}>
          {this.props.children}
        </View>
      </View>
    )
  }
}
