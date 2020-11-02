// @flow
import * as React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { runSpring } from './AnimationController'
import Video from 'react-native-video';

import {
  PanGestureHandler,
  NativeViewGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import VideoContent from './VideoContent';
import PlayerControls from './PlayerControls';
import Animated, { add, Clock, Extrapolate, interpolate, lessThan, multiply } from 'react-native-reanimated'
const { width, height } = Dimensions.get('window');
const shadow = {
  alignItems: 'center',
  elevation: 1,
  shadowColor: 'black',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.18,
  shadowRadius: 2,
};
const { event, Value, stopClock, set, eq, cond } = Animated

export default class VideoModal extends React.PureComponent {
  translationY = new Value(0)
  velocityY = new Value(0)
  offsetY = new Value(0)
  clockY = new Clock()
  gestureState = new Value(State.UNDETERMINED)
  constructor(props) {
    super(props)
    const { translationY, velocityY, gestureState: state, clockY, offsetY } = this
    this.onGestureEvent = event([
      {
        nativeEvent: {
          translationY,
          velocityY,
          state
        }
      }
    ], { useNativeDriver: true })
    const finalTranslateY = add(translationY, multiply(0.2, velocityY), offsetY)
    const translationThreshold = height / 2
    const snappPoint = cond(
      lessThan(finalTranslateY, translationThreshold),
      0,
      height - 3 * 64
    )
    this.translateY = cond(
      eq(state, State.END),
      [
        set(translationY, runSpring(clockY, add(translationY, offsetY), snappPoint)),
        set(offsetY, translationY),
        translationY
      ],
      cond(
        eq(state, State.BEGAN),
        [stopClock(clockY), add(translationY, offsetY)],
        add(translationY, offsetY)
      )
    );
  }
  render() {
    const { video } = this.props;
    const { translationY, onGestureEvent, translateY } = this
    const contentOpacity = interpolate(translateY, {
      inputRange: [0, height - 3 * 64],
      outputRange: [1, 0],
      extrapolate: Extrapolate.CLAMP
    })
    const contentWidth = interpolate(translateY, {
      inputRange: [0, height - 3 * 64],
      outputRange: [width, width - 16],
      extrapolate: Extrapolate.CLAMP
    })
    return (
      <>
        <View
          style={{
            height: 24,
            backgroundColor: 'black',
          }}
        />
        <PanGestureHandler
          onHandlerStateChange={onGestureEvent}
          {...{ onGestureEvent }}
        >
          <Animated.View
            style={{
              ...shadow,
              transform: [
                {
                  translateY: translateY
                }
              ],
              borderWidth: 1,
              borderColor: 'red',
              backgroundColor: 'white'
            }}
          >
            <View style={{
              backgroundColor: 'white', width: width - 2
            }}>
              <View style={{ ...StyleSheet.absoluteFillObject }}>
                <PlayerControls title={video.title} onPress={() => true} />
              </View>
              <Video
                source={video.video}
                style={{ width, height: width / 1.78 }}
                shouldPlay
                controls={true}
              />
            </View>
            <Animated.View style={{ backgroundColor: 'white', width: contentWidth, height, opacity: contentOpacity }}>
              <View>
                <VideoContent {...{ video }} />
              </View>
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>

      </>
    );
  }
}
