import React from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View
} from 'react-native';
import { observer, Provider } from 'mobx-react';
import { autorun, observable } from 'mobx';
import PropTypes from 'prop-types';

import { NavState } from './models/NavState';
import NavTabBar from './NavTabBar';
import NavCard from './NavCard';

import Log from './Logger';

const TransitionState = {
  NONE: 0,
  PUSH: 1,
  POP: 2,
};

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;

export const defaultConfig = {
  navBarVisible: false,
  tabBarVisible: false,
  cardStyle: {
    bottom: 0,
    left: 0,
    right: 0,
    top: STATUSBAR_HEIGHT,
    position: 'absolute',
    backgroundColor: 'white',
  },
  navBarStyle: {
    backgroundColor: 'white',
    paddingTop: STATUSBAR_HEIGHT,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#828287',
    height: 68,
  },
  navBarCenterStyle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: STATUSBAR_HEIGHT,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navBarLeftStyle: {
    position: 'absolute',
    justifyContent: 'center',
    paddingTop: STATUSBAR_HEIGHT,
    width: 100,
    top: 0,
    left: 0,
    bottom: 0,
    paddingLeft: 15,
  },
  navBarRightStyle: {
    position: 'absolute',
    justifyContent: 'center',
    paddingTop: STATUSBAR_HEIGHT,
    width: 100,
    top: 0,
    right: 0,
    bottom: 0,
    paddingRight: 15,
  },
  navBarTitleStyle: {
    alignItems: 'center',
  },
  navBarSubtitleStyle: {

  },
  statusBarStyle: 'default', // One of 'default' or stylesheet object
  tabBarStyle: {
    height: 50,
  },
  logLevel: Log.Level.INFO,
}

// Top level container for all navigation elements and scenes
@observer
export default class NavContainer extends React.Component {
  static propTypes = {
    cardStyle: View.propTypes.style,
    navBarStyle: View.propTypes.style,
    tabStyle: View.propTypes.style,
    logLevel: PropTypes.number,
  };

  @observable width;
  @observable height;

  constructor(props) {
    super(props);
    const config = { ...defaultConfig, ...props };

    this.navState = new NavState(config);
    Log.debug('Initializing nav container with configuration: ', config);
    const { height, width } = Dimensions.get('window');
    this.width = width;
    this.height = height;
  }

  componentWillMount() {
    Dimensions.addEventListener('change', (event) => {
      const { height, width } = event.window;
      this.width = width;
      this.height = height;
    });
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change');
  }

  cards() {
    return this.navState.elementPool.orderedElements().map(
      element => <NavCard key={element.key} element={element} height={this.height} width={this.width} />);
  }

  render() {
    return (
      <Provider navState={this.navState}>
        <View style={{ flex: 1 }}>
          {this.cards()}
          <NavTabBar style={this.props.tabStyle} height={this.height} width={this.width}>
            {this.props.children}
          </NavTabBar>
        </View>
      </Provider>
    )
  }
}
