import React from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View
} from 'react-native';
import { inject, observer, Provider } from 'mobx-react';
import { autorun, observable } from 'mobx';
import PropTypes from 'prop-types';

import { Motion, NavNode, NavState } from './NavState';
import NavTabBar from './NavTabBar';
import NavBar from './NavBar';

const TransitionState = {
  NONE: 0,
  PUSH: 1,
  POP: 2,
};

const styles = StyleSheet.create({
  card: {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    position: 'absolute',
  }
});

// Top level container for all navigation elements and scenes
@observer
export default class NavContainer extends React.Component {
  static propTypes = {
    navBarHeight: PropTypes.number,
    tabBarHeight: PropTypes.number,
    tabStyle: View.propTypes.style,
  };

  @observable current: NavNode;
  @observable next: NavNode;
  @observable transitionState = TransitionState.NONE;
  // Fraction of the screen covered by the card on top
  @observable transitionValue;
  @observable width;
  @observable height;

  get nextStyle() {
    return [styles.card, {
      transform: [
        {
          translateX: this.transitionValue.interpolate({
            inputRange: [0, 1],
            outputRange: [this.width, 0],
          }),
        },
      ],
    }];
  }

  constructor(props) {
    super(props);
    this.navState = new NavState({
      navBarHeight: props.navBarHeight || 68,
      tabBarHeight: props.tabBarHeight || 50,
    }, props.initialScene, props.initialProps);
    this.current = this.navState.activeNode;
    const { height, width } = Dimensions.get('window');
    this.width = width;
    this.height = height;
  }

  componentWillMount() {
    this.sceneDisposer = autorun('nav state listener', () => {
      // At any given moment, we need to determine what the desired scene is, and whether or not
      // a transition animation needs to take place.
      if (this.navState.activeNode !== this.current) {
        // Handle transitions while a transition is currently occurring
        if (this.navState.motion === Motion.SLIDE_ON) {
          this.next = this.navState.activeNode;
          this.transitionValue = new Animated.Value(0);
          Animated.timing(this.transitionValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            this.current = this.next;
            this.next = null;
          });
        } else if (this.navState.motion === Motion.SLIDE_OFF) {
          this.next = this.current;
          this.current = this.navState.activeNode;
          this.transitionValue = new Animated.Value(1);
          Animated.timing(this.transitionValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            this.next = null;
          })
        } else {
          this.current = this.navState.activeNode;
        }
      }
    });

    Dimensions.addEventListener('change', (event) => {
      const { height, width } = event.window;
      this.width = width;
      this.height = height;
    });
  }

  componentWillUnmount() {
    this.sceneDisposer();
    Dimensions.removeEventListener('change');
  }

  cards() {
    const currentInstance = this.current.instance;
    const nextInstance = this.next ? this.next.instance : null;
    return this.navState.instancePool.instances().map((element) => {
      if (element.instance === currentInstance) {
        return (
          <View key={element.key} style={[styles.card, this.current.cardStyle]}>
            {element.instance}
          </View>
        )
      } else if (nextInstance && element.instance === nextInstance) {
        return (
          <Animated.View key={element.key} style={[this.nextStyle, this.next.cardStyle]}>
            {element.instance}
          </Animated.View>
        )
      }
      return (
        <View key={element.key} style={{ transform: [{ translateX: 100000 }] }}>
          {element.instance}
        </View>
      )
    });
  }

  render() {
    return (
      <Provider navState={this.navState}>
        <View style={{ flex: 1 }}>
          {this.cards()}
          <NavBar height={this.height} />
          <NavTabBar style={this.props.tabStyle} height={this.height}>
            {this.props.children}
          </NavTabBar>
        </View>
      </Provider>
    )
  }
}
