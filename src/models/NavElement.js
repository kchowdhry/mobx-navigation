import { observable } from 'mobx';

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
  instance: object;
  @observable ref: object = null;

  constructor(navState, navProps, navConfig) {
    this.navState = navState;
    this.navProps = navProps;
    this.navConfig = navConfig;
    this.key = elementCount;
    elementCount += 1;
  }

  get tabBarVisible(): boolean {
    return this.navConfig && this.navConfig.tabBarVisible;
  }

  get navBarVisible(): boolean {
    return this.navConfig && this.navConfig.navBarVisible;
  }

  get cardStyle(): Object {
    const style = {};
    if (this.navConfig) {
      if (this.navBarVisible && !this.navConfig.navBarTransparent) {
        style.marginTop = this.navState.config.navBarStyle.height;
      }
      if (this.tabBarVisible && !this.navConfig.tabBarTransparent) {
        style.marginBottom = this.navState.config.tabBarStyle.height;
      }
    }

    return [style, this.navConfig.cardStyle];
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