import React from 'react';
import {
  Button,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ViewPropTypes,
} from 'react-native';

import PropTypes from 'prop-types';

import { observer } from 'mobx-react';

@observer
class BackButton extends React.Component {
  get contents() {
    if (this.props.left) {
      return React.createElement(this.props.left, { ...this.props, ...this.props.leftProps });
    }

    if (this.props.backImage) {
      return (
        <Image style={this.props.backImageStyle} source={this.props.backImage} />
      );
    }

    return (
      <Text>
        {'<'}
      </Text>
    );
  }

  onPress = () => {
    this.props.navState.pop();
  }

  render() {
    return (
      <TouchableOpacity
        style={this.props.leftStyle}
        onPress={this.onPress}
      >
        {this.contents}
      </TouchableOpacity>
    );
  }
}

const Title = (props) => {
  return (
    <View style={props.centerStyle}>
      <Text style={props.titleStyle}>
        {props.navProps && props.navProps.title ? props.navProps.title : ''}
      </Text>
    </View>
  )
}

const Right = (props) => {
  return (
    <View style={props.rightStyle}>
      {React.createElement(props.right, { ...props, ...props.rightProps })}
    </View>
  )
}

@observer
export default class NavBar extends React.Component {
  static propTypes = {
    navProps: PropTypes.object,
    style: ViewPropTypes.style,
  };

  get node() {
    if (this.props.element.isFront) {
      return this.props.navState.front;
    }

    if (this.props.element.isBack) {
      return this.props.navState.back;
    }
  }

  get hasBack() {
    if (!this.node || this.node.config.navBarLeftDisabled) {
      // This element is offscreen or the left button is disabled
      return false;
    }
    return !!this.props.left || !!this.node.previous;
  }

  render() {
    const center = this.props.center ? this.props.center : Title;

    const style = {
      bottom: this.props.height - this.props.navState.config.navBarStyle.height,
    };

    const props = {
      centerStyle: this.props.centerStyle,
      titleStyle: this.props.titleStyle,
      ...this.props.centerProps,
      navProps: this.props.navProps
    };

    const back = this.hasBack ? (<BackButton {...this.props}  navProps={this.props.navProps} />) : null;

    const right = this.props.right ? (<Right {...this.props} navProps={this.props.navProps} />) : null;

    return (
      <View style={[style, this.props.style]}>
        {React.createElement(center, props)}
        {back}
        {right}
      </View>
    )
  }
}
