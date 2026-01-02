import { useState } from 'react';
import { StyleSheet, View, Platform, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LandingScreen() {
    const router = useRouter();
    const [city, setCity] = useState('Taipei');
    const [birthDate, setBirthDate] = useState(new Date());

    const [mode, setMode] = useState<'date' | 'time'>('date');
    const [show, setShow] = useState(false);

    const onChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || birthDate;
        setShow(Platform.OS === 'ios');
        setBirthDate(currentDate);
    };

    const showMode = (currentMode: 'date' | 'time') => {
        setShow(true);
        setMode(currentMode);
    };

    const showDatepicker = () => {
        showMode('date');
    };

    const showTimepicker = () => {
        showMode('time');
    };

    const handleContinue = () => {
        // In a real app, you'd save these values to context/store
        console.log('City:', city);
        console.log('BirthDate:', birthDate);
        router.replace('/(tabs)');
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Welcome to Myng</ThemedText>

            <View style={styles.section}>
                <ThemedText type="subtitle">City of Birth</ThemedText>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={city}
                        onValueChange={(itemValue) => setCity(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Taipei" value="Taipei" />
                        <Picker.Item label="London" value="London" />
                        <Picker.Item label="New York" value="New York" />
                    </Picker>
                </View>
            </View>

            <View style={styles.section}>
                <ThemedText type="subtitle">Birthday</ThemedText>

                <View style={styles.buttonGroup}>
                    {Platform.OS === 'web' ? (
                        <View style={styles.webPickerGroup}>
                            {/* Native Date Input */}
                            <input
                                type="date"
                                value={birthDate.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    const newDate = new Date(birthDate);
                                    // Parse YYYY-MM-DD
                                    const [y, m, d] = e.target.value.split('-').map(Number);
                                    newDate.setFullYear(y, m - 1, d);
                                    setBirthDate(newDate);
                                }}
                                style={{
                                    height: 40,
                                    padding: 10,
                                    borderRadius: 5,
                                    border: '1px solid #ccc',
                                    backgroundColor: '#fff',
                                    color: '#000',
                                    marginRight: 10
                                }}
                            />

                            {/* Native Time Input */}
                            <input
                                type="time"
                                value={birthDate.toTimeString().slice(0, 5)}
                                onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(':').map(Number);
                                    const newDate = new Date(birthDate);
                                    newDate.setHours(hours);
                                    newDate.setMinutes(minutes);
                                    setBirthDate(newDate);
                                }}
                                style={{
                                    height: 40,
                                    padding: 10,
                                    borderRadius: 5,
                                    border: '1px solid #ccc',
                                    backgroundColor: '#fff',
                                    color: '#000'
                                }}
                            />
                        </View>) : (
                        <>
                            <Button onPress={showDatepicker} title="Select Date" />
                            <Button onPress={showTimepicker} title="Select Time" />
                        </>
                    )}
                </View>

                {Platform.OS !== 'web' && (
                    <ThemedText style={styles.selectedDate}>
                        {birthDate.toLocaleString()}
                    </ThemedText>
                )}

                {show && Platform.OS !== 'web' && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={birthDate}
                        mode={mode}
                        is24Hour={true}
                        onChange={onChange}
                        display="default"
                    />
                )}
            </View>

            <View style={styles.footer}>
                <Button title="Continue" onPress={handleContinue} />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginTop: 8,
        // Picker height handling for iOS/Android
        ...Platform.select({
            ios: {
                height: 100,
                overflow: 'hidden',
            },
            android: {
                height: 50,
            }
        })
    },
    picker: {
        width: '100%',
        height: '100%',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
        marginBottom: 12,
    },
    selectedDate: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 16,
    },
    footer: {
        marginTop: 40,
    },
    webPickerGroup: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap', // Allow wrapping on small screens
    },
    webPicker: {
        height: 40,
        marginRight: 10,
        padding: 5,
        backgroundColor: '#fff', // Ensure contrast
        color: '#000',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        minWidth: 150, // Force width
        opacity: 1,
        cursor: 'pointer',
    },
});
