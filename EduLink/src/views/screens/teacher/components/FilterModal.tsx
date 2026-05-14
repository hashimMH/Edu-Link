import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { status: string; day: string }) => void;
  onReset: () => void;
  initialFilters?: {
    status: string;
    day: string;
  };
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  onReset,
  initialFilters = { status: '', day: '' },
}) => {
  const [statusFilter, setStatusFilter] = useState(initialFilters.status);
  const [dayFilter, setDayFilter] = useState(initialFilters.day);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dayDropdownOpen, setDayDropdownOpen] = useState(false);

  // Status options for filter
  const statusOptions = ['All', 'Completed', 'Canceled', 'Upcoming'];

  // Day options for filter
  const dayOptions = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleStatusDropdown = () => {
    setStatusDropdownOpen(!statusDropdownOpen);
    if (dayDropdownOpen) setDayDropdownOpen(false);
  };

  const toggleDayDropdown = () => {
    setDayDropdownOpen(!dayDropdownOpen);
    if (statusDropdownOpen) setStatusDropdownOpen(false);
  };

  const selectStatus = (status: string) => {
    setStatusFilter(status);
    setStatusDropdownOpen(false);
  };

  const selectDay = (day: string) => {
    setDayFilter(day);
    setDayDropdownOpen(false);
  };

  const handleApply = () => {
    onApply({ status: statusFilter, day: dayFilter });
  };

  const handleReset = () => {
    setStatusFilter('');
    setDayFilter('');
    onReset();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={onClose}
      >
        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#1F2A37" />
            </TouchableOpacity>
          </View>
          
          {/* Status Filter */}
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={toggleStatusDropdown}
          >
            <Text style={styles.dropdownButtonText}>
              {statusFilter || 'Status'}
            </Text>
            <Icon name={statusDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#1F2A37" />
          </TouchableOpacity>
          
          {statusDropdownOpen && (
            <View style={styles.dropdownContent}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.dropdownItem}
                  onPress={() => selectStatus(status)}
                >
                  <Text style={styles.dropdownItemText}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Day Filter */}
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={toggleDayDropdown}
          >
            <Text style={styles.dropdownButtonText}>
              {dayFilter || 'Day'}
            </Text>
            <Icon name={dayDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#1F2A37" />
          </TouchableOpacity>
          
          {dayDropdownOpen && (
            <View style={styles.dropdownContent}>
              {dayOptions.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={styles.dropdownItem}
                  onPress={() => selectDay(day)}
                >
                  <Text style={styles.dropdownItemText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Filter Actions */}
          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'SF-Pro-Display-Semibold',
    color: '#1F2A37',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Regular',
    color: '#1F2A37',
  },
  dropdownContent: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: -12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Regular',
    color: '#1F2A37',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Medium',
    color: '#1F2A37',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#10A7DA',
    borderRadius: 12,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Medium',
    color: '#FFFFFF',
  },
});

export default FilterModal;
