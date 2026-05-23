// src/controllers/navigation/CustomTabBar.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';


const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { height: Platform.OS === 'ios' ? 68 + (insets.bottom > 0 ? 34 : 0) : 70 }]}>
      <View style={[styles.inContainer, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0 }]} >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        // Updated icon mapping
        let iconName;
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Tutors') iconName = 'search';
        else if (route.name === 'AIChat') iconName = 'chatbubbles';
        else if (route.name === 'Profile') iconName = 'person';
        else if (route.name === 'Scheduled') iconName = 'calendar';
        else if (route.name === 'Messages') iconName = 'chatbox';

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={styles.tab}
          >
            <View style={[styles.iconOutContainer, isFocused && styles.activeOutIconContainer]}>
            <View style={[isFocused && styles.activeOutIconContainertop
                ,{position:'absolute'}]}/>
                <View style={[isFocused && styles.activeOutIconContainerCrv
                ,{position:'absolute'}]}/>
              <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                <Icon 
                  name={iconName as string} 
                  size={24} 
                  color={isFocused ? '#10A8DA' : '#9DB2CE'} 
                />
              </View>
            </View>
            <View style={styles.leftShadow}/>
            <Text style={[styles.label, isFocused && styles.focusedLabel]}>
              {label as string}
            </Text>
          </TouchableOpacity>
        );
      })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    // Height is dynamically set based on platform and insets
  },
  inContainer: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#F2F4F7',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  iconOutContainer: {
    width: 66,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    zIndex: 1,
    backgroundColor: '#F2F4F7',
    borderRadius: 20,
   // transform: [{ rotate: '-45deg' }],
  },
  activeOutIconContainer: {
   // backgroundColor: '#fff',
   // borderBottomLeftRadius: 15,
    borderBottomRightRadius: 35,
   // transform: [{ rotate: '45deg' }],
    bottom: 25,
  },
  activeOutIconContainertop: {
    width: 66,
    height: 33,
    bottom: 0,
    backgroundColor: '#fff',
    borderBottomRightRadius: 35,
    borderBottomLeftRadius: 35,
  },
  activeOutIconContainerCrv: {
    zIndex: 1,
    width: 70,
    height: 30,
    bottom: 3,
    backgroundColor: '#fff',
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
  },
  label: {
    color: '#9DB2CE',
    fontSize: 12,
    bottom: 15,
   // position:'absolute',
  },
  focusedLabel: {
    color: '#10A8DA',
  },
  leftShadow: {
    position: 'absolute',
    width: 15,
    height: 70,
    backgroundColor: '#F2F4F7',
    //borderBottomLeftRadius: 30,
    transform: [{ rotate: '-5deg' }],
    borderTopRightRadius: 30,
    top: 6,
    left: '0%',
  },
  // rightShadow: {
  //   position: 'absolute',
  //   width: 15,
  //   height: 120,
  //   backgroundColor: '#F2F4F7',
  //   //borderBottomLeftRadius: 30,
  //   transform: [{ rotate: '5deg' }],
  //   borderTopLeftRadius: 30,
  //   right: '0%',
  // }
});

export default CustomTabBar;
