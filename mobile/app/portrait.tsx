import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function PortraitScreen() {
    const { city, datetime } = useLocalSearchParams<{ city: string; datetime: string }>();
    const [loading, setLoading] = useState(true);
    const [portrait, setPortrait] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPortrait = async () => {
            try {
                // In a real device/production env, replace localhost with your machine's IP
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
                setPortrait(data.content);
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
                <ActivityIndicator size="large" color="#ffffff" />
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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>Your Zodiac Portrait</ThemedText>
                <ThemedText style={styles.content}>{portrait}</ThemedText>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    title: {
        marginBottom: 24,
        textAlign: 'center',
    },
    waitingText: {
        marginTop: 20,
    },
    content: {
        lineHeight: 24,
        fontSize: 16,
    }
});
