import React from 'react';
import {
  Animated,
  StyleSheet,
  View
} from 'react-native';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';

import NavBar from './NavBar';

// This component encapsulates the transition of the scene component with an optional nav bar
// If the component is active, it is rendered with its nav bar in the main view as part of the transition
// If the component used to be active, it is rendered in the active viewport but will be rendered
// in the back by the parent container.
// If the component is inactive, it is rendered with its nav bar far outside the viewport.

@observer
export default class NavCard extends React.Component {
  static propTypes = {
    element: PropTypes.object,
    height: PropTypes.number,
    width: PropTypes.number,
  };

  get xform() {
    if (this.props.element.isFront) {
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
    } else if (this.props.element.isOffscreen) {
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

  get config() {
    return this.props.element.navConfig;
  }

  get cardStyle() {
    return this.props.element.cardStyle;
  }

  get navProps() {
    return this.props.element.navProps;
  }

  get navBar() {
    if (!this.props.element.navBarVisible) {
      return null;
    }

    const left = this.config.navBarLeft;
    const center = this.config.navBarCenter;
    const right = this.config.navBarRight;

    let node = null;
    if (this.props.element.isFront) {
      node = this.props.navState.front;
    } else if (this.props.element.isBack) {
      node = this.props.navState.back;
    }

    return (
      <NavBar
        navState={this.props.navState}
        height={this.props.height}
        element={this.props.element}
        backImage={this.props.navBarBackImage}
        backImageStyle={this.props.navBarBackImageStyle}
        left={left}
        leftProps={this.config.navBarLeftProps}
        rightProps={this.config.navBarRightProps}
        centerProps={this.config.navBarCenterProps}
        center={center}
        right={right}
        navProps={this.navProps}
        style={this.config.navBarStyle}
        leftStyle={this.config.navBarLeftStyle}
        rightStyle={this.config.navBarRightStyle}
        centerStyle={this.config.navBarCenterStyle}
        titleStyle={this.config.navBarTitleStyle}
        subtitleStyle={this.config.navBarSubtitleStyle}
      />
    )
  }

  render() {
    return (
      <Animated.View style={[StyleSheet.absoluteFill, this.xform]}>
        <View style={[StyleSheet.absoluteFill, this.cardStyle]}>
          {this.props.element.instance}
        </View>
        {this.navBar}
      </Animated.View>
    );
  }
}