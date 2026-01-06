import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Platform, Text, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailyInsightCache, saveDailyInsightCache } from '@/utils/storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface DailyTransit {
    headline: string;
    mood_word: string;
    the_tension: string;
    the_shift: string;
    pro_tip: string;
}

const InsightCard = ({ title, content, icon, color }: { title: string; content: string; icon: keyof typeof Ionicons.glyphMap; color: string }) => (
    <ThemedView style={[styles.card, { borderLeftColor: color }]}>
        <ThemedView style={styles.cardHeader}>
            <Ionicons name={icon} size={24} color={color} />
            <Text style={[styles.cardTitle, { color }]}>{title}</Text>
        </ThemedView>
        <ThemedText style={styles.cardContent}>{content}</ThemedText>
    </ThemedView>
);

export default function DailyInsightScreen() {
    const [loading, setLoading] = useState(true);
    const [insight, setInsight] = useState<DailyTransit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState<string>(''); // Placeholder if we had names

    const router = useRouter();

    const fetchDailyInsight = useCallback(async () => {
        try {
            // Check cache first
            const cachedData = await getDailyInsightCache();
            if (cachedData) {
                setInsight(cachedData);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Retrieve stored user info
            const values = await AsyncStorage.multiGet(['user_city', 'user_birth_datetime', 'user_portrait']);
            const city = values[0][1];
            const birthDatetime = values[1][1];
            const portraitStr = values[2][1];

            if (!city || !birthDatetime) {
                setError('User profile not found. Please create your portrait first.');
                setLoading(false);
                return;
            }

            const portrait = portraitStr ? JSON.parse(portraitStr) : null;

            // Current time for transit
            const now = new Date();
            const transitDatetime = now.toISOString();

            // We use the birth city as current city for now, or we could ask for current location.
            // Requirement didn't specify asking for current location, so we assume staying in birth city or stored city.
            // ideally we'd get current location, but for MVP we use stored city as current city if no GPS.
            // Let's use the stored city as current city for simplicity as per requirement implies "store on user device"

            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/divination/zodiac/daily-transit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    birth_datetime: birthDatetime,
                    birth_city: city,
                    transit_datetime: transitDatetime,
                    current_city: city, // Assuming user is in the same city or we use it as default
                    ai_portrait: portrait,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            setInsight(data);
            await saveDailyInsightCache(data);
            setError(null);

        } catch (err: any) {
            setError(err.message || 'Failed to align the stars for today.');
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDailyInsight();
    }, [fetchDailyInsight]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDailyInsight();
    }, [fetchDailyInsight]);

    if (loading && !refreshing) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator size="large" color="#000000" />
                <ThemedText type="subtitle" style={styles.waitingText}>Reading the planets...</ThemedText>
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={styles.container}>
                <Ionicons name="alert-circle-outline" size={48} color="red" style={{ alignSelf: 'center', marginBottom: 16 }} />
                <ThemedText type="subtitle" style={{ color: 'red', textAlign: 'center' }}>Unable to load insight</ThemedText>
                <ThemedText style={{ textAlign: 'center', marginTop: 8 }}>{error}</ThemedText>
                <ThemedView style={{ marginTop: 24, alignItems: 'center' }}>
                    <Text onPress={() => router.back()} style={{ color: 'blue', fontSize: 16 }}>Go Back</Text>
                </ThemedView>
            </ThemedView>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <ThemedView style={styles.container}>
                <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                <Text style={styles.headline}>{insight?.headline}</Text>

                {insight && (
                    <ThemedView style={styles.cardsContainer}>
                        <InsightCard
                            title="Pro Tip"
                            content={insight.pro_tip}
                            icon="bulb-outline"
                            color="#FFBE0B"
                        />
                        <InsightCard
                            title="Current Mood"
                            content={insight.mood_word}
                            icon="chatbubble-ellipses-outline"
                            color="#FF9F1C"
                        />
                        <InsightCard
                            title="The Tension"
                            content={insight.the_tension}
                            icon="sad-outline"
                            color="#2EC4B6"
                        />
                        <InsightCard
                            title="The Shift"
                            content={insight.the_shift}
                            icon="heart-outline"
                            color="#E71D36"
                        />

                    </ThemedView>
                )}
            </ThemedView>
        </ScrollView>
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
    waitingText: {
        marginTop: 20,
        textAlign: 'center',
        color: '#000',
    },
    date: {
        fontSize: 14,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' }),
    },
    headline: {
        fontSize: 28,
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
        color: '#000',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 36,
    },
    cardsContainer: {
        gap: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 3,
        borderLeftWidth: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    },
    cardContent: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    }
});
