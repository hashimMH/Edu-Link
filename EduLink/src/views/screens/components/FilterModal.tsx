import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  countries: string[];
  interests: string[];
}

interface FilterState {
  country: string;
  interest: string;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible, onClose, onApplyFilters, countries, interests,
}) => {
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedInterest, setSelectedInterest] = useState('');

  const handleApply = () => {
    onApplyFilters({
      country: selectedCountry,
      interest: selectedInterest,
    });
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => {
                setShowCountryDropdown(!showCountryDropdown);
                setShowInterestDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>
                {selectedCountry || 'Country'}
              </Text>
              <Icon name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {showCountryDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => { setSelectedCountry(''); setShowCountryDropdown(false); }}
                  >
                    <Text style={[styles.dropdownItemText, { color: '#999' }]}>All Countries</Text>
                  </TouchableOpacity>
                  {countries.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={styles.dropdownItem}
                      onPress={() => { setSelectedCountry(c); setShowCountryDropdown(false); }}
                    >
                      <Text style={styles.dropdownItemText}>{c.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => {
                setShowInterestDropdown(!showInterestDropdown);
                setShowCountryDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>
                {selectedInterest || 'Interest'}
              </Text>
              <Icon name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {showInterestDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => { setSelectedInterest(''); setShowInterestDropdown(false); }}
                  >
                    <Text style={[styles.dropdownItemText, { color: '#999' }]}>All Interests</Text>
                  </TouchableOpacity>
                  {interests.map((int) => (
                    <TouchableOpacity
                      key={int}
                      style={styles.dropdownItem}
                      onPress={() => { setSelectedInterest(int); setShowInterestDropdown(false); }}
                    >
                      <Text style={styles.dropdownItemText}>{int}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(223, 228, 234, 0.95)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 10,
  },
  filterDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#666',
  },
  dropdownList: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },
  applyButton: {
    backgroundColor: '#10A7DA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FilterModal;
