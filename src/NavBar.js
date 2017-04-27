import React from 'react';
import {
  Button,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import PropTypes from 'prop-types';

import { inject, observer } from 'mobx-react';

const IS_IOS = Platform.OS === 'ios';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingTop: IS_IOS ? 20 : 0,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: StyleSheet.hairlineWidth,
    shadowOffset: {
      height: StyleSheet.hairlineWidth,
    },
    elevation: 4,
  },
  backButton: {
    position: 'absolute',
    justifyContent: 'center',
    width: 100,
    top: 0,
    paddingTop: IS_IOS ? 20 : 0,
    left: 0,
    bottom: 0,
    paddingLeft: 15,
  },
  title: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: IS_IOS ? 20 : 0,
  },
  titleText: {
    alignItems: 'center',
  },
  rightButton: {
    position: 'absolute',
    width: 100,
    top: 0,
    right: 0,
    paddingRight: 15,
    bottom: 0,
    justifyContent: 'center',
    paddingTop: IS_IOS ? 20 : 0,
  },
});

@inject('navState') @observer
class BackButton extends React.Component {
  render() {
    const inner = this.props.left ?
      React.createElement(this.props.left, this.props) :
      (
        <Text>
          {'<'}
        </Text>
      );
    return (
      <View style={styles.backButton}>
        <TouchableOpacity onPress={this.props.navState.pop}>
          {inner}
        </TouchableOpacity>
      </View>
    );
  }
}

const Title = (props) => {
  return (
    <View style={styles.title}>
      <Text style={styles.titleText}>
        {props.navProps && props.navProps.title ? props.navProps.title : ''}
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
    navProps: PropTypes.object,
    style: View.propTypes.style,
  };

  render() {
    const center = this.props.center ? this.props.center : Title;

    const style = {
      bottom: this.props.height - this.props.navState.config.navBarStyle.height,
    };

    const props = { ...this.props, navProps: this.props.navProps };

    const back = this.props.node && this.props.node.previous ?
      (
        <BackButton {...props} />
      )
      : null;

    return (
      <View style={[styles.container, style, this.props.style]}>
        {React.createElement(center, props)}
        {back}
        {this.props.right ? React.createElement(this.props.right, props) : null}
      </View>
    )
  }
}
