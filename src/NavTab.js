import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

import { observer } from 'mobx-react';

import PropTypes from 'prop-types';

const styles = StyleSheet.create({

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'column',
    marginBottom: 6,
  },
  selectedTab: {
    tintColor: 'rgb(105, 179, 231)',
  },
  tabText: {
    fontSize: 10,
    letterSpacing: 0.1,
    color: 'rgb(134, 134, 134)',
  },
  selectedTabText: {
    color: 'rgb(105, 179, 231)',
  },
  tabIcon: {
    marginBottom: 4,
    tintColor: 'rgb(134, 134, 134)',
  },



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
  let selectedStyle;
  let selectedTextStyle;
  if (props.active) {
    selectedStyle = styles.selectedTab;
    selectedTextStyle = styles.selectedTabText;
  }

  return (
    <View style={styles.tabButton}>
      <Image
        source={props.source}
        style={[styles.tabIcon, selectedStyle]}
      />
      <Text style={[styles.tabText, selectedTextStyle]}>
        {props.name}
      </Text>
    </View>
  )







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
