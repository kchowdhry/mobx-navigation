import React from 'react';
import {
  Animated,
  StyleSheet,
  View
} from 'react-native';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';

import NavBar from './NavBar';
import { Motion } from './NavState';

// This component encapsulates the transition of the scene component with an optional nav bar
// If the component is active, it is rendered with its nav bar in the main view as part of the transition
// If the component used to be active, it is rendered in the active viewport but will be rendered
// in the back by the parent container.
// If the component is inactive, it is rendered with its nav bar far outside the viewport.

const styles = StyleSheet.create({
  card: {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    position: 'absolute',
  }
});

@observer
export default class NavCard extends React.Component {
  static propTypes = {
    element: PropTypes.object,
    height: PropTypes.number,
    width: PropTypes.number,
  };

  componentWillMount() {
    if (this.node.config && this.node.config.initNavProps) {
      this.navProps = this.node.config.initNavProps(this.props);
    }
  }

  get xform() {
    if (this.node.isFront) {
      return {
        transform: [
          {
            translateX: this.node.navState.transitionValue.interpolate({
              inputRange: [0, 1],
              outputRange: [this.props.width, 0],
            }),
          },
        ],
      };
    } else if (this.node.isOffscreen) {
      return {
        transform: [
          {
            translateX: 65536,
          },
        ],
      }
    }
    // We're in the back, render as normal
    return null;
  }

  get navConfig() {
    return this.node.component.navConfig;
  }

  get navProps() {
    return this.props.element.navProps;
  }

  get node() {
    return this.props.element.node;
  }

  get navBar() {
    if (!this.node.navBarVisible) {
      return null;
    }

    let left = null;
    let center = null;
    let right = null;
    if (this.navConfig) {
      left = this.navConfig.navBarLeft;
      center = this.navConfig.navBarCenter;
      right = this.navConfig.navBarRight;
    }

    return (
      <NavBar
        height={this.props.height}
        left={left}
        center={center}
        right={right}
        navProps={this.navProps}
      />
    )
  }

  render() {
    return (
      <Animated.View style={[styles.card, this.xform]}>
        <View style={[styles.card, this.node.cardStyle]}>
          {this.props.element.instance}
        </View>
        {this.navBar}
      </Animated.View>
    );
  }
}