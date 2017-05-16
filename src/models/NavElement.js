import React from 'react';
import { Platform } from 'react-native';
import { observable } from 'mobx';

import Log from '../Logger';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;

const elementCount = 1;

export default class NavElement {
  // NOTE: The nav element must not contain any back references to nav nodes so as not
  // to introduce a circular dependency
  refCount: number = 1;
  navState: NavState;
  key: number;
  navProps: object;
  navConfig: object;

  // The instance and ref are set shortly after the NavElement is constructed
  _instance: object;
  @observable ref: object = null;
  // This is set when the NavCard encapsulating the element is mounted
  @observable mounted: boolean = false;

  get instance() {
    return this._instance;
  }

  get wrappedRef() {
    if (!this.ref) {
      return null;
    }

    return this.ref.wrappedInstance || this.ref;
  }

  set instance(i) {
    this._instance = i;
    Log.trace(`Nav element ${i.type.displayName || i.type.name} created with config: `, this.navConfig);
  }

  constructor(navState, node) {
    this.navState = navState;
    this.navConfig = node.config ? node.config : {};
    navState.mergeNodeConfig(this.navConfig);
    this.navProps = this.navConfig.initNavProps ? this.navConfig.initNavProps(node.props) : null;
    this.instance = this.createInstance(node.component, node.props);
    this.key = elementCount;
    elementCount += 1;
  }

  createInstance(component, props) {
    // Careful! We want to store a ref to the underlying element but we have to be careful not to
    // prevent the caller from grabbing the ref as well
    // The conditional expression here ensures we don't try to grab the ref of a stateless component
    // as this is disallowed in React
    const ref = component.prototype.render ?
      (r) => {
        if (typeof props.ref === 'function') {
          props.ref(r);
        }
        this.ref = r;
      } : undefined;

    return React.createElement(component, {
      navState: this.navState,
      navProps: this.navProps,
      ...props,
      ref,
    });
  }

  get tabBarVisible(): boolean {
    return this.navConfig.tabBarVisible && !this.navState.keyboardVisible;
  }

  get navBarVisible(): boolean {
    return this.navConfig.navBarVisible;
  }

  get cardStyle(): Object {
    const style = {};
    if (this.navBarVisible && !this.navConfig.navBarTransparent) {
      style.paddingTop = this.navConfig.navBarStyle.height;
    }
    if (this.tabBarVisible && !this.navConfig.tabBarTransparent) {
      style.paddingBottom = this.navConfig.tabBarStyle.height;
    }

    return [this.navConfig.cardStyle, style];
  }

  get isFront(): boolean {
    return this.navState.front && this.navState.front.element === this;
  }

  get isBack(): boolean {
    return this.navState.back && this.navState.back.element === this;
  }

  get isOffscreen(): boolean {
    return !this.isFront && !this.isBack;
  }
}