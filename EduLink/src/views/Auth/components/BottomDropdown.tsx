import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, Dimensions, StyleProp, TextStyle } from 'react-native';
import TextInputField from './TextInputField';

const { height } = Dimensions.get('window');

interface BottomDropdownProps {
    title?: string;
    placeholder?: string;
    titleStyle?: StyleProp<TextStyle>;
    isPassword?: boolean;
    items?: any[];
    errorMessage?: string;
    onSelect?: (value: string) => void;
    value?: string;
}

const BottomDropdown: React.FC<BottomDropdownProps> = ({
    title,
    placeholder,
    titleStyle,
    isPassword = false,
    items = [],
    errorMessage,
    onSelect,
    value,
    ...props
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || "Select an option");

    const options = items || [];

    return (
        <View style={styles.container}>
            {/* Trigger Button */}
            <TouchableOpacity style={styles.overlay}
                onPress={() => setModalVisible(true)}
            >
                <TextInputField
                    title={title} placeholder={placeholder} readOnly onPress={() => setModalVisible(true)}
                    value={selectedValue}

                />
            </TouchableOpacity>


            {/* Bottom Modal */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    onPress={() => setModalVisible(false)}
                />
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Choose an option</Text>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.option,
                                    item === selectedValue ? styles.optionSelected : null,
                                ]}
                                onPress={() => {
                                    setSelectedValue(item);
                                    setModalVisible(false);
                                    if (onSelect) onSelect(item);
                                }}
                            >
                                <Text style={[
                                    styles.optionText,
                                    item === selectedValue ? styles.optionSelected : null,
                                ]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    dropdown: {
        padding: 15,
        backgroundColor: '#ddd',
        borderRadius: 5,
        width: '80%',
        alignItems: 'center'
    },
    overlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        //backgroundColor: '#F9FAFB'
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.4,
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center'
    },
    option: {
        paddingVertical: 15,
        borderBottomColor: '#ddd',
    },
    optionSelected: {
        paddingVertical: 15,
        color: "white",
        backgroundColor: '#10A7DA',
        width: '100%',
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: {
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'SF-Pro-Display-Semibold',
        fontStyle: 'normal',
        lineHeight: 24,
        fontWeight: '400',
        color: '#8899A8',
    },
});

export default BottomDropdown;