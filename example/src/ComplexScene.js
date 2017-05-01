import React from 'react';

import {
  Button,
  Text,
  View,
} from 'react-native';

import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { scene } from '../..'

const NavBarCenter = observer((props) => {
  return (
    <View style={{ backgroundColor: props.navProps.color }}>
      <Text style={{ color: 'white' }}>
        {props.navProps.title}
      </Text>
    </View>
  )
});

@scene('ComplexScene') @observer
export default class ComplexScene extends React.Component {
  static navConfig = {
    template: 'test',
    tabAffinity: '3',
    tabBarVisible: false,
    navBarVisible: true,
    initNavProps: (props) => {
      return observable({
        title: props.title,
        color: 'red',
      });
    },
    navBarCenter: NavBarCenter,
  }

  @observable numClicks;

  componentWillMount() {
    this.numClicks = 0;
  }

  onPress = () => {
    this.props.navProps.title = 'Pressed';
    this.props.navProps.color = this.numClicks % 2 === 0 ? 'blue' : 'red';
    this.numClicks += 1;
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <Button title={'change'} onPress={this.onPress} />
        <Text>
          {this.numClicks}
        </Text>
      </View>
    );
  }
}
