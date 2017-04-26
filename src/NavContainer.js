import React from 'react';
import {
  Dimensions,
  View
} from 'react-native';
import { observer, Provider } from 'mobx-react';
import { autorun, observable } from 'mobx';
import PropTypes from 'prop-types';

import { NavState } from './NavState';
import NavTabBar from './NavTabBar';
import NavCard from './NavCard';

const TransitionState = {
  NONE: 0,
  PUSH: 1,
  POP: 2,
};

// Top level container for all navigation elements and scenes
@observer
export default class NavContainer extends React.Component {
  static propTypes = {
    navBarHeight: PropTypes.number,
    tabBarHeight: PropTypes.number,
    tabStyle: View.propTypes.style,
  };

  @observable width;
  @observable height;

  constructor(props) {
    super(props);
    this.navState = new NavState({
      navBarHeight: props.navBarHeight || 68,
      tabBarHeight: props.tabBarHeight || 50,
    }, props.initialScene, props.initialProps);
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
    return this.navState.elementPool.elements().map(
      element => <NavCard key={element.key} element={element} height={this.height} width={this.width} />);
  }

  render() {
    return (
      <Provider navState={this.navState}>
        <View style={{flex: 1}}>
          {this.cards()}
          <NavTabBar style={this.props.tabStyle} height={this.height} width={this.width}>
            {this.props.children}
          </NavTabBar>
        </View>
      </Provider>
    )
  }
}
