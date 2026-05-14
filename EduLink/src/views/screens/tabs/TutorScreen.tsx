import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Background from '../components/Background';
import Icon from 'react-native-vector-icons/Ionicons';
import { TutorCard } from '../components/TutorCourses';
import FilterModal from '../components/FilterModal';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../../models/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

type TutorScreenNavigationProp = BottomTabNavigationProp<
TabParamList,
  'Tutors'
>;

const TutorScreen = ({navigation}: {navigation: TutorScreenNavigationProp}) => {
  const tutors = useSelector((state: RootState) => state.tutors.tutors) || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ country: '', interest: '' });

  // Compute unique filter options from real tutor data
  const availableCountries = useMemo(
    () => [...new Set(tutors.map(t => t.country).filter(Boolean))].sort(),
    [tutors]
  );
  const availableInterests = useMemo(
    () => [...new Set(tutors.flatMap(t => t.interests).filter(Boolean))].sort(),
    [tutors]
  );

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = searchQuery === '' || 
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = !showAvailableOnly || tutor.isAvailable;
    const matchesCountry = !filters.country || tutor.country === filters.country;
    const matchesInterest = !filters.interest || 
      tutor.interests.some(interest => interest.toLowerCase() === filters.interest.toLowerCase());
    
    return matchesSearch && matchesAvailability && matchesCountry && matchesInterest;
  });

  return (
    <Background>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
          <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.filterButton}>
            <Icon name="options-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.availableButton, showAvailableOnly && styles.filterButtonActive]}
          onPress={() => setShowAvailableOnly(!showAvailableOnly)}
        >
          <Icon 
            name="checkmark-circle-outline" 
            size={16} 
            color={showAvailableOnly ? '#fff' : '#666'} 
            style={{ marginRight: 4 }} 
          />
          <Text style={[styles.filterButtonText, showAvailableOnly && styles.filterButtonTextActive]}>
            Available Now
          </Text>
        </TouchableOpacity>

        <ScrollView style={styles.tutorList}>
          {filteredTutors.map(tutor => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </ScrollView>

        <FilterModal 
          visible={showFilter} 
          onClose={() => setShowFilter(false)}
          onApplyFilters={setFilters}
          countries={availableCountries}
          interests={availableInterests}
        />
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 44,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  filterButton: {
    padding: 8,
  },
  availableButton: {
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#10A7DA',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'SF-Pro-Display-Medium',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  tutorList: {
    flex: 1,
  },
});

export default TutorScreen;