import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PortraitSection {
    content: string;
    summary: string;
}

interface Portrait {
    core_identity: PortraitSection;
    psychological_dynamics: PortraitSection;
    drive_career_values: PortraitSection;
    growth_pathway: PortraitSection;
}

const Section = ({ title, data }: { title: string; data: PortraitSection }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <ThemedView style={styles.sectionContainer}>
            <TouchableOpacity onPress={toggleExpand} style={styles.header}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={24} color="#888" />
            </TouchableOpacity>

            <ThemedText style={styles.summary}>{data.summary}</ThemedText>

            {expanded && (
                <ThemedView style={styles.contentContainer}>
                    <ThemedText style={styles.content}>{data.content}</ThemedText>
                </ThemedView>
            )}
        </ThemedView>
    );
};

export default function PortraitScreen() {
    const params = useLocalSearchParams<{ city: string; datetime: string }>();
    const [loading, setLoading] = useState(true);
    const [portrait, setPortrait] = useState<Portrait | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchPortraitData = useCallback(async (city: string, datetime: string) => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/divination/zodiac/portrait`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    city: city,
                    datetime: datetime,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            setPortrait(data);

            // Save for future use
            await AsyncStorage.multiSet([
                ['user_city', city],
                ['user_birth_datetime', datetime],
                ['user_portrait', JSON.stringify(data)]
            ]);
        } catch (err: any) {
            setError(err.message || 'An error occurred while consulting the stars.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadContextAndFetch = async () => {
            setLoading(true);
            try {
                // Check params first
                let city = params.city;
                let datetime = params.datetime;

                // Then check storage
                const savedCity = await AsyncStorage.getItem('user_city');
                const savedDatetime = await AsyncStorage.getItem('user_birth_datetime');
                const savedPortrait = await AsyncStorage.getItem('user_portrait');

                // If we have a portrait in storage and no new params, use the cached one
                if (savedPortrait && !params.city) {
                    setPortrait(JSON.parse(savedPortrait));
                    setLoading(false);
                    return;
                }

                // Determine what to use
                const finalCity = city || savedCity;
                const finalDatetime = datetime || savedDatetime;

                if (finalCity && finalDatetime) {
                    await fetchPortraitData(finalCity, finalDatetime);
                } else {
                    // No data anywhere, redirect to landing
                    router.replace('/');
                }
            } catch (e) {
                setError('Failed to load your profile.');
                setLoading(false);
            }
        };

        loadContextAndFetch();
    }, [params.city, params.datetime, fetchPortraitData, router]);

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator size="large" color="#000000" />
                <ThemedText type="subtitle" style={styles.waitingText}>Consulting the stars...</ThemedText>
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText type="subtitle" style={{ color: 'red', textAlign: 'center' }}>Error</ThemedText>
                <ThemedText style={{ textAlign: 'center', marginTop: 8 }}>{error}</ThemedText>
                <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/')}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <ThemedView style={styles.container}>
                    <Text style={styles.title}>Your Zodiac Portrait</Text>

                    {portrait && (
                        <>
                            <Section title="Core Identity" data={portrait.core_identity} />
                            <Section title="Psychological Dynamics" data={portrait.psychological_dynamics} />
                            <Section title="Drive, Career & Values" data={portrait.drive_career_values} />
                            <Section title="Growth & Pathway" data={portrait.growth_pathway} />
                        </>
                    )}
                    <View style={{ height: 100 }} />
                </ThemedView>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: '#fff',
    },
    title: {
        marginTop: 40,
        marginBottom: 32,
        textAlign: 'center',
        fontSize: 32,
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
        color: '#000',
    },
    waitingText: {
        marginTop: 20,
        textAlign: 'center',
        color: '#000',
    },
    sectionContainer: {
        marginBottom: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#EEE',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
        color: '#000',
        opacity: 0.6,
    },
    summary: {
        fontSize: 14,
        fontStyle: 'italic',
        opacity: 0.8,
        lineHeight: 20,
        color: '#333',
    },
    contentContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    content: {
        lineHeight: 24,
        fontSize: 16,
        color: '#000',
    },
    retryButton: {
        marginTop: 24,
        padding: 12,
        backgroundColor: '#002D62',
        borderRadius: 8,
        alignItems: 'center',
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    }
});