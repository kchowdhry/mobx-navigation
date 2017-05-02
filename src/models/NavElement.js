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
    console.log(i);
    Log.trace(`Nav element ${i.type.displayName || i.type.name} created with config: `, this.navConfig);
  }

  constructor(navState, navProps, navConfig) {
    this.navState = navState;
    this.navProps = navProps;
    this.navConfig = navState.mergeNodeConfig(navConfig);
    this.key = elementCount;
    elementCount += 1;
  }

  get tabBarVisible(): boolean {
    return this.navConfig.tabBarVisible;
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
    return this.navState.front.element === this;
  }

  get isBack(): boolean {
    return this.navState.back && this.navState.back.element === this;
  }

  get isOffscreen(): boolean {
    return !this.isFront && !this.isBack;
  }
}