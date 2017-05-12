import 'react-native';
import React from 'react';

import { defaultConfig, NavContainer, scene } from '..';
import { observable, when } from 'mobx';

import renderer from 'react-test-renderer';

jest.mock('Animated', () => {
  const ActualAnimated = require.requireActual('Animated');
  return {
    ...ActualAnimated,
    timing: (value, config) => {
      return {
        start: (callback) => {
          value.setValue(config.toValue);
          callback && callback();
        },
      };
    },
  };
});

const NullScene = scene('null1')((props) => {
  return null;
});

const NullScene2 = scene('null2')((props) => {
  return null;
});

@scene('unique')
class Unique extends React.Component {
  static navConfig = {
    unique: true,
    rootScene: true,
  };
  render() {
    return null;
  }
}

const navStateBox = observable.box();

const container = renderer.create(
  <NavContainer navStateRef={(ref) => { navStateBox.set(ref); }} initialScene={NullScene} />
);

let navState = null;
beforeAll((done) => {
  when('scene mounted', () => navStateBox.get() !== null, () => {
    navState = navStateBox.get();
    done();
  });
});

describe('NavState', () => {
  it('should construct a state with one scene', () => {
    expect(navState.front).toBeDefined();
    expect(navState.front.component).toBe(NullScene);
    expect(navState.front.componentName).toBe('null1');
  });

  it('should push a new scene onto the stack', () => {
    const oldFront = navState.front;
    return new Promise((resolve) => {
      navState.push('null2').then(() => {
        expect(navState.front.component).toBe(NullScene2);
        expect(navState.front.componentName).toBe('null2');
        resolve();
      }).catch(fail);
    });
  });

  it('should replace an existing scene on the stack', () => {
    const oldPrevious = navState.front.previous;
    return new Promise((resolve) => {
      navState.replace('null1').then(() => {
        expect(navState.front.component).toBe(NullScene);
        expect(navState.front.previous).toBe(oldPrevious);
        resolve();
      }).catch(fail);
    });
  });

  it('should only push a unique scene once', () => {
    return new Promise((resolve) => {
      navState.push('unique').then(() => {
        expect(navState.front.componentName).toBe('unique');
        expect(navState.front.isUnique).toBeTruthy();
        navState.push('unique').then(() => {
          expect(navState.front.componentName).toBe('unique');
          expect(navState.front.previous.componentName).not.toBe('unique');
          resolve();
        }).catch(fail);
      }).catch(fail);
    });
  });

  it('should pop to the first occurrence of a unique scene', () => {
    return new Promise((resolve) => {
      navState.push('unique').then(() => {
        navState.push('null1').then(() => {
          navState.push('null2').then(() => {
            navState.push('unique').then(() => {
              expect(navState.front.componentName).toBe('unique');
              expect(navState.front.next).not.toBeDefined();
              resolve();
            }).catch(fail);
          }).catch(fail);
        }).catch(fail);
      }).catch(fail);
    });
  });
});