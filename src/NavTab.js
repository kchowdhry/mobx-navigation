import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { observer } from 'mobx-react';

import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'column',
    height: 50, // TODO
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  buttonText: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

const TabButton  = (props) => {
  const style = {
    backgroundColor: props.active ? 'blue' : 'white',
  };

  return (
    <View style={[styles.button, style]}>
      <Text style={styles.buttonText}>
        {props.name}
      </Text>
    </View>
  )
}

@observer
export default class NavTab extends React.Component {
  static propTypes = {
    isInitial: PropTypes.bool,
    disableQuickReset: PropTypes.bool,
    button: PropTypes.element,
    name: PropTypes.string.isRequired,
    initialScene: PropTypes.func.isRequired,
    initalProps: PropTypes.object,
    navState: PropTypes.object
  };

  componentWillMount() {
    this.props.navState.addTabConfig(this.props);
  }

  onPress = () => {
    this.props.navState.tab(this.props.name);
  }

  render() {
    const content = this.props.button ? this.props.button : TabButton;
    const active = this.props.navState.activeTab === this.props.name;

    return (
      <View style={styles.button}>
        <TouchableOpacity onPress={this.onPress} style={styles.button}>
          {React.createElement(content, { ...this.props, active })}
        </TouchableOpacity>
      </View>
    )
  }
}
