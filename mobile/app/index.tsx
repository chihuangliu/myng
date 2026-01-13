import { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Text, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const CITIES = ['Taipei', 'London', 'New York'];

export default function LandingScreen() {
    const router = useRouter();
    const [cityQuery, setCityQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [showCityList, setShowCityList] = useState(false);

    const [birthDate, setBirthDate] = useState(new Date());
    const [mode, setMode] = useState<'date' | 'time'>('date');
    const [showPicker, setShowPicker] = useState(false);

    // Initial state matching the "placeholder" look until selected, 
    // but for this mockup we can default to showing the date if the user interacts.
    // To match the image "Select Date" / "Select Time" vs values:
    const [dateSelected, setDateSelected] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const savedCity = await AsyncStorage.getItem('user_city');
                const savedDate = await AsyncStorage.getItem('user_birth_date');

                if (savedCity) {
                    setCityQuery(savedCity);
                    setSelectedCity(savedCity);
                }
                if (savedDate) {
                    setBirthDate(new Date(savedDate));
                    setDateSelected(true);
                }
            } catch (e) {
                console.error('Failed to load user data', e);
            }
        };
        loadUserData();
    }, []);

    // Filter cities based on query
    const filteredCities = CITIES.filter(c =>
        c.toLowerCase().includes(cityQuery.toLowerCase())
    );

    const handleCitySelect = (city: string) => {
        setSelectedCity(city);
        setCityQuery(city);
        setShowCityList(false);
    };

    const onChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || birthDate;
        setBirthDate(currentDate);
        setDateSelected(true);
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
    };

    const togglePicker = (currentMode: 'date' | 'time') => {
        if (showPicker && mode === currentMode) {
            setShowPicker(false);
        } else {
            setMode(currentMode);
            setShowPicker(true);
        }
    };

    const handleContinue = async () => {
        try {
            if (selectedCity) {
                await AsyncStorage.setItem('user_city', selectedCity);
                
                // Resolve coordinates
                try {
                    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/location/resolve?city=${encodeURIComponent(selectedCity)}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.coordinates) {
                            await AsyncStorage.setItem('user_coordinates', data.coordinates);
                        }
                    } else {
                        console.warn('Failed to resolve coordinates');
                    }
                } catch (err) {
                    console.error('Error resolving location:', err);
                }
            }
            await AsyncStorage.setItem('user_birth_date', birthDate.toISOString());
        } catch (e) {
            console.error('Failed to save user data', e);
        }

        router.replace({
            pathname: '/(tabs)',
            params: {
                city: selectedCity,
                datetime: birthDate.toISOString()
            }
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <Text style={styles.title}>Welcome to Myng</Text>

                    {/* City Section */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Where were you born?</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter city to search..."
                                placeholderTextColor="#999"
                                value={cityQuery}
                                onChangeText={(text) => {
                                    setCityQuery(text);
                                    setShowCityList(true);
                                    setSelectedCity(null); // Reset selection on edit
                                }}
                                onFocus={() => setShowCityList(true)}
                            />
                        </View>
                        {showCityList && cityQuery.length > 0 && filteredCities.length > 0 && (
                            <View style={styles.dropdownList}>
                                {filteredCities.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.dropdownItem}
                                        onPress={() => handleCitySelect(item)}
                                    >
                                        <Text style={styles.dropdownText}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Date/Time Section */}
                    <View style={styles.section}>
                        <Text style={styles.label}>When were you born?</Text>
                        <View style={styles.dateTimeRow}>
                            {/* Date Picker Trigger */}
                            <TouchableOpacity
                                style={[styles.dateTimeInput, mode === 'date' && showPicker && styles.activeInput]}
                                onPress={() => togglePicker('date')}
                            >
                                <Text style={styles.placeholderLabel}>Select Date</Text>
                                <Text style={styles.valueText}>{formatDate(birthDate)}</Text>
                            </TouchableOpacity>

                            {/* Time Picker Trigger */}
                            <TouchableOpacity
                                style={[styles.dateTimeInput, mode === 'time' && showPicker && styles.activeInput]}
                                onPress={() => togglePicker('time')}
                            >
                                <Text style={styles.placeholderLabel}>Select Time</Text>
                                <Text style={styles.valueText}>{formatTime(birthDate)}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Inline Picker for iOS */}
                        {showPicker && Platform.OS === 'ios' && (
                            <View style={styles.pickerContainer}>
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={birthDate}
                                    mode={mode}
                                    is24Hour={false}
                                    onChange={onChange}
                                    display="spinner"
                                    themeVariant="light"
                                    style={styles.iosPicker}
                                />
                            </View>
                        )}
                    </View>

                    {/* Continue Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                            <Text style={styles.continueButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Android Modal Picker (Invisible trigger) */}
                    {showPicker && Platform.OS === 'android' && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={birthDate}
                            mode={mode}
                            is24Hour={false}
                            onChange={onChange}
                        />
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // White background as per image
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 32,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
        textAlign: 'center',
        marginBottom: 48,
        color: '#000',
    },
    section: {
        marginBottom: 32,
        position: 'relative', // For dropdown positioning
        zIndex: 1,
    },
    label: {
        fontSize: 18,
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), // Using serif for questions too based on some interpretations, or standard sans. Image looks standard serif-ish? Actually looks like Georgia for "Where were you born?"
        marginBottom: 12,
        color: '#000',
    },
    inputContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    textInput: {
        height: 50,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000',
    },
    dropdownList: {
        position: 'absolute',
        top: 85, // Adjust based on label + input height
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 100,
    },
    dropdownItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dropdownText: {
        fontSize: 16,
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    dateTimeInput: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
        height: 80, // Taller to accommodate label + value
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    activeInput: {
        borderColor: '#002D62',
        borderWidth: 2,
    },
    placeholderLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },
    valueText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    pickerContainer: {
        marginTop: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        overflow: 'hidden',
    },
    iosPicker: {
        height: 200,
        width: '100%',
    },
    footer: {
        marginTop: 24,
    },
    continueButton: {
        backgroundColor: '#002D62', // Navy blue
        borderRadius: 30, // Pill shape
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#002D62',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    },
});
