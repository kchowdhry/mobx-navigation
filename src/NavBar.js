import React from 'react';
import {
  Button,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import PropTypes from 'prop-types';

import { observer } from 'mobx-react';

@observer
class BackButton extends React.Component {
  render() {
    const inner = this.props.left ?
      React.createElement(this.props.left, { ...this.props, ...this.props.leftProps }) :
      (
        <Text>
          {'<'}
        </Text>
      );
    return (
      <View style={this.props.leftStyle}>
        <TouchableOpacity onPress={this.props.navState.pop}>
          {inner}
        </TouchableOpacity>
      </View>
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
    style: View.propTypes.style,
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
    return this.node && this.node.previous;
  }

  render() {
    const center = this.props.center ? this.props.center : Title;

    const style = {
      bottom: this.props.height - this.props.navState.config.navBarStyle.height,
    };

    const props = { ...this.props, navProps: this.props.navProps };

    const back = this.hasBack ? (<BackButton {...props} />) : null;

    const right = this.props.right ? (<Right {...props} />) : null;

    return (
      <View style={[style, this.props.style]}>
        {React.createElement(center, props)}
        {back}
        {right}
      </View>
    )
  }
}
