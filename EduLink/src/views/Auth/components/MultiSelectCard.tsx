import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ImageBackground, Dimensions, TouchableOpacity } from 'react-native';
import TextComponent from './TextComponent';

const { width } = Dimensions.get('window');
const itemWidth = width * 0.3; // Width of each item
const numColumns = Math.floor(width / itemWidth); // Calculate the number of columns

interface Item {
    id: number;
    selected: boolean;
    name: string;
    // Add other properties of the item here
}

interface MultiSelectCardProps {
    items: Item[] | any;
}

export default function MultiSelectCard({ items }: MultiSelectCardProps) {
    const [itemsList, setItems] = useState(items);
    // const [selected, setSelected] = useState(items);

    const handleSelect = (index: number) => {
        // Update the `selected` property of the item at the given index
        const updatedItems = [...itemsList];
        updatedItems[index].selected = !updatedItems[index].selected;
        setItems(updatedItems);  // Update the state
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={itemsList}
                numColumns={numColumns}
                keyExtractor={(item, index) => `${itemsList}-${index}`}
                renderItem={({ item,index }) => (
                    <TouchableOpacity key={index} style={[styles.itemContainer, item.selected && styles.selectedItem,]} 
                    onPress={()=>{handleSelect(index)}} 
                    >
                        <ImageBackground
                            source={require('../../../../assets/interest_goal.png')}
                            style={styles.imageBackground}
                            imageStyle={styles.imageStyle}
                            
                        >
                            <Text style={styles.itemText}>{item.name}</Text>
                        </ImageBackground>
                    </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
            />
            <TextComponent titleStyle={styles.termsAndConditions} title='By creating an account, I accept the ActingConnect’s Terms and Conditions and Privacy Policy.' />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height:'95%',
        justifyContent: 'space-around',
    },
    listContainer: {
        paddingHorizontal: 10,
    },
    itemContainer: {
        marginHorizontal: 5,
        marginVertical: 10,
        alignItems: 'center',
        width: itemWidth - 10,
    },
    imageBackground: {
        width: '100%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageStyle: {
        borderRadius: 10,
    },
    selectedItem: {
        borderColor: '#0E92BE', // Example of border when selected
        borderWidth: 4,
        borderRadius: 10,

    },
    itemText: {
        fontSize: 20,
        fontFamily: 'SF-Pro-Display-Semibold',
        fontStyle: 'normal',
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    termsAndConditions:{
        fontSize:12, 
        fontFamily: 'SF-Pro-Display-Regular'
    }
});
