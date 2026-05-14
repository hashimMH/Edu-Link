import React, { useRef, useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Background from '../components/Background_Auth';
import { View, FlatList, Dimensions, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../models/types';
import TextComponent from '../components/TextComponent';
import RegStyle from './style';
import TextInputField from '../components/TextInputField';
import ButtonComponent from '../components/ButtonComponent';
import ValidationCheck from '../resets/components/ValidationCheck';
import BottomDropdown from '../components/BottomDropdown';
import { FieldType } from '../../../enums/field_type';
import * as validation from '../components/validation';
import MultiSelectCard from '../components/MultiSelectCard';
import { api } from '../../../services/api';
import { storage } from '../../../services/storage';

const { width } = Dimensions.get('window');
const validatePassword = (value: string) => ({
    lengthValid: validation.isLongEnough(value),
    numberValid: validation.hasNumber(value),
    specialCharValid: validation.hasSymbol(value),
});
interface Field {
    textInputTitle?: string;
    placeholder?: string;
    validation?: (value: string, inputValues?: Record<string, string>) => string;
    type: FieldType;
    isPassword?: boolean;
    items?: { name: string; selected: boolean }[] | string[];
}

interface Step {
    title: string;
    subtitle: string;
    fields: Field[];
    buttonText: string;
}
const steps:Step[] = [
    {
        title: 'Add Your Email',
        subtitle:
            'Enter your email below to get started. This helps us get in touch with you to verify sensitive information.',
        fields: [
            {
                textInputTitle: 'Email *',
                placeholder: 'Enter Your Email',
                validation: (value: string) =>
                    value.includes('@') ? '' : 'Please enter a valid email.',
                type:FieldType.Input
            },
        ],
        buttonText: 'Continue',
    },
    {
        title: 'Create your password ',
        subtitle:
            'Your password must be at least 8 characters long, and contain at least one number and one symbol.',
        fields: [
            {
                textInputTitle: 'Password *',
                placeholder: 'Enter Your Password',
                isPassword: true,
                type:FieldType.Input,
                validation: (value: string) => {
                    const lengthValid = validation.isLongEnough(value);
                    const numberValid = validation.hasNumber(value);
                    const specialCharValid = validation.hasSymbol(value);
                    if (!lengthValid) return 'Password must be at least 8 characters long.';
                    if (!numberValid) return 'Password must include at least one number.';
                    if (!specialCharValid) return 'Password must include at least one special character.';
                    return '';
                }
            },
        ],
        buttonText: 'Continue',
    },
    {
        title: 'Who you are',
        subtitle: 'Enter your details below to get started.',
        fields: [
            {
                textInputTitle: 'First Name',
                placeholder: 'First Name',
                validation: (value: any) => (value ? '' : 'First name is required.'),
                type:FieldType.Input
            },
            {
                textInputTitle: 'Last Name',
                placeholder: 'Last Name',
                validation: (value: any) => (value ? '' : 'Last name is required.'),
                type:FieldType.Input
            },
            {
                textInputTitle: 'Iam..',
                placeholder: 'Iam..',
                type: FieldType.Dropdown,
                items: ['Teacher', 'Student'],
            },
        ],
        buttonText: 'Continue',
    },
    {
        title: 'Choose your interests and goals ',
        subtitle: 'We\'ll tailor your experience to match your interests and goals.',
        fields: [
            {
                textInputTitle: 'Iam..',
                placeholder: 'Iam..',
                type: FieldType.MultiSelect,
                items: [
                    { name: 'Alphabets', selected: false },
                    { name: 'Grammar', selected: false },
                    { name: 'Vocabulary', selected: false },
                    { name: 'Reading', selected: false },
                    { name: 'Writing', selected: false },
                    { name: 'Listen and Talk', selected: false }
                  ],
            },
        ],
        buttonText: 'Finish',
    },
];

type RegistrationScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'RegistrationScreen'
>;

type RegistrationProps = {
    navigation: RegistrationScreenNavigationProp;
};

export default function Registration({ navigation }: RegistrationProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputValues, setInputValues] = useState<Record<string, string>>({});
    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
    const [passwordValidationStatus, setPasswordValidationStatus] = useState({
        lengthValid: false,
        numberValid: false,
        specialCharValid: false,
    });
    const [loading, setLoading] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    // Track selected interests
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const validateInput = () => {
        const currentStep = steps[currentIndex];
        const newErrors: Record<string, string> = {};

        currentStep.fields.forEach((field, fieldIndex) => {
            const fieldKey = `${currentIndex}-${fieldIndex}`;
            const value = inputValues[fieldKey] || '';
            const error = field.validation
                ? field.validation(value, inputValues)
                : '';
            if (error) newErrors[fieldKey] = error;
        });

        setErrorMessages(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = async () => {
        if (validateInput()) {
            if (currentIndex < steps.length - 1) {
                const nextIndex = currentIndex + 1;
                setCurrentIndex(nextIndex);
                flatListRef.current?.scrollToIndex({ index: nextIndex });
            } else {
                // Final step - submit registration
                await handleRegister();
            }
        }
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            // Collect values from all steps
            // Step 0: email (field 0-0)
            // Step 1: password (field 1-0)
            // Step 2: first name (field 2-0), last name (field 2-1), role (field 2-2)
            // Step 3: interests (from selectedInterests)
            const email = inputValues['0-0'] || '';
            const password = inputValues['1-0'] || '';
            const firstName = inputValues['2-0'] || '';
            const lastName = inputValues['2-1'] || '';
            const role = (inputValues['2-2'] || 'student').toLowerCase();

            const interests = selectedInterests.length > 0
                ? selectedInterests
                : undefined;

            const res = await api.register({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                role,
                interests,
            });

            await storage.setToken(res.token);
            await storage.setUser(res.user);

            if (res.user.role === 'teacher') {
                navigation.reset({ index: 0, routes: [{ name: 'TeacherTabs' }] });
            } else {
                navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
            }
        } catch (err: any) {
            const msg = err.message || 'Registration failed';
            const detail = err.errors
                ? err.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n')
                : '';
            Alert.alert('Registration Failed', detail || msg);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (value: string, fieldKey: string) => {
        setInputValues(prevValues => ({ ...prevValues, [fieldKey]: value }));
        if (fieldKey === `${currentIndex}-0` && steps[currentIndex].fields[0].isPassword) {
            const validationStatus = validatePassword(value);
            setPasswordValidationStatus(validationStatus);
        }
    };

    const insets = useSafeAreaInsets();

    const handleBackPress = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            flatListRef.current?.scrollToIndex({ index: prevIndex });
        } else {
            navigation.goBack();
        }
    };

    return (
        <Background>
            <SafeAreaView style={{flex:1}}>
                <View style={[{flex:1, padding:16}, { paddingTop: Platform.OS === 'ios' ? 0 : 16 }]}>
                    <View style={[RegStyle.container, { marginTop: Platform.OS === 'ios' ? insets.top > 0 ? 0 : 10 : 0 }]}>
                        <TouchableOpacity style={RegStyle.backButton} onPress={handleBackPress}>
                            <Icon name="arrow-back" size={25} color="#10A7DA" />
                        </TouchableOpacity>

                        <View style={{ position: 'absolute', left: 0, right: 0 }}>
                            <TextComponent
                                title={`Step ${currentIndex + 1} of ${steps.length}`}
                                style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}
                            />
                        </View>
                    </View>

            <View>
                <FlatList
                    ref={flatListRef}
                    data={steps}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    scrollEnabled={false}
                    renderItem={({ item, index }) => (
                        <View style={{ width: width - 32, flex: 1 }}>
                            <View style={{ flex: 1, paddingTop: 32 }}>
                                <TextComponent title={item.title} subtitle={item.subtitle} />
                                {item.fields?.map((field:Field, fieldIndex: number) => {
                                    const fieldKey = `${index}-${fieldIndex}`;
                                    return (
                                        field.type == FieldType.Dropdown ? (
                                            <BottomDropdown
                                                key={fieldKey}
                                                placeholder={field.placeholder}
                                                title={field.textInputTitle}
                                                items={field.items}
                                                onSelect={(value: string) =>
                                                    handleInputChange(value, fieldKey)
                                                }
                                            />
                                        ) : field.type == FieldType.MultiSelect ? (
                                            <MultiSelectCard
                                                key={fieldKey}
                                                items={field.items}
                                                onSelectionChange={(selected: string[]) =>
                                                    setSelectedInterests(selected)
                                                }
                                            />
                                        ) : (
                                            <View key={fieldKey}>
                                                <TextInputField
                                                    key={fieldKey}
                                                    title={field.textInputTitle}
                                                    placeholder={field.placeholder}
                                                    value={inputValues[fieldKey] || ''}
                                                    onChangeText={text => handleInputChange(text, fieldKey)}
                                                    warning={!!errorMessages[fieldKey]}
                                                    errorMessage={errorMessages[fieldKey]}
                                                    secureTextEntry={field.isPassword || false}
                                                />
                                                {field.isPassword && <View>
                                                    <ValidationCheck isValid={passwordValidationStatus.lengthValid} message='Minimum 8 characters' />
                                                    <ValidationCheck isValid={passwordValidationStatus.numberValid} message='At least one number' />
                                                    <ValidationCheck isValid={passwordValidationStatus.specialCharValid} message='At least one symbol' /></View>}
                                            </View>
                                    ));
                                })}
                            </View>
                            <View style={{ alignItems: 'center' }}>
                                <ButtonComponent
                                    style={{marginVertical: '20%'}}
                                    title={loading && currentIndex === steps.length - 1 ? 'Registering...' : item.buttonText}
                                    onPress={handleNext}
                                    disabled={loading}
                                />
                            </View>
                        </View>
                    )}
                    onScrollToIndexFailed={() => { }}
                />
            </View>
                </View>
            </SafeAreaView>
        </Background>
    );
}
