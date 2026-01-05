import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, Text } from 'react-native';
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
    const { city, datetime } = useLocalSearchParams<{ city: string; datetime: string }>();
    const [loading, setLoading] = useState(true);
    const [portrait, setPortrait] = useState<Portrait | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchPortrait = async () => {
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

                // Save to local storage for Daily Insights
                await AsyncStorage.multiSet([
                    ['user_city', city as string],
                    ['user_birth_datetime', datetime as string],
                    ['user_portrait', JSON.stringify(data)]
                ]);

            } catch (err: any) {
                setError(err.message || 'An error occurred while consulting the stars.');
            } finally {
                setLoading(false);
            }
        };

        if (city && datetime) {
            fetchPortrait();
        } else {
            setError('Missing city or date information.');
            setLoading(false);
        }
    }, [city, datetime]);

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
                <ThemedText type="subtitle" style={{ color: 'red' }}>Error</ThemedText>
                <ThemedText>{error}</ThemedText>
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
                    <ThemedView style={{ height: 80 }} />
                </ThemedView>
            </ScrollView>

            <ThemedView style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bottomBarItem}
                    onPress={() => router.push('/daily-insight')}
                >
                    <Ionicons name="sunny-outline" size={24} color="#000" />
                    <Text style={styles.bottomBarText}>Daily Insight</Text>
                </TouchableOpacity>
            </ThemedView>
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
        backgroundColor: '#F9F9F9', // Light gray background for cards
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
        opacity: 0.6, // Requested opacity
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
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        backgroundColor: '#fff',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12, // Safe area padding
    },
    bottomBarItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    bottomBarText: {
        fontSize: 12,
        color: '#000',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    },
});
