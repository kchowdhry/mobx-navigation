// The purpose of this file is to demonstrate the relationship between a parent and a child where the child
// exposes static nav configuration to the parent but the child is included first

import React from 'react';

import { CircularChild } from './TabOne';
import { scene } from '../..';

@scene
class Circular extends React.Component {
  // This line WILL NOT WORK because we attempt to resolve a reference to a static property when a cyclic
  // dependency exists.
  // static navConfig = CircularChild.navConfig;

  // Instead we have to do the following:
  static navConfig = () => CircularChild.navConfig;

  static multiNavConfig = {
    Circular: {
      navBarVisible: true,
    },
    CircularAlt: {
      navBarVisible: true,
      navBarStyle: {
        backgroundColor: 'green',
      }
    },
  }

  render() {
    return (
      <CircularChild message="test" />
    );
  }
}
