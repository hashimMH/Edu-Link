import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = 'Are you sure Delete',
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <View style={styles.modalIconContainer}>
            <View style={styles.trashIconWrapper}>
              <Icon name="trash" size={40} color="#fff" />
            </View>
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: 'rgba(52, 52, 52, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#FF4D12',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '15deg' }],
    marginBottom: 20,
  },
  trashIconWrapper: {
    transform: [{ rotate: '-15deg' }],
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 28,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    paddingHorizontal: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#10A7DA',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#10A7DA',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#10A7DA',
    fontSize: 17,
    fontWeight: '500',
  },
});
