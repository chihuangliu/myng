import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Platform, Text, RefreshControl, View } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { getDailyInsightCache, saveDailyInsightCache } from '@/utils/storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface DailyTransit {
    headline: string;
    energy: string;
    the_tension: string;
    the_remedy: string;
    pro_tip: string;
}

export default function DailyInsightScreen() {
    const [loading, setLoading] = useState(true);
    const [insight, setInsight] = useState<DailyTransit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();

    const fetchDailyInsight = useCallback(async () => {
        try {
            // Check cache first
            const cachedData = await getDailyInsightCache();
            if (cachedData) {
                // Determine if cached data is new format or old format
                // If it has 'mood_word', it is old. We should re-fetch or clear cache if possible, 
                // but for now let's just cast or be safe. 
                // Ideally we'd validte keys. If keys missing, fetch fresh.
                if ('energy' in cachedData && 'the_remedy' in cachedData) {
                    setInsight(cachedData as DailyTransit);
                    setLoading(false);
                    setRefreshing(false);
                    return;
                }
                // If old format, we ignore cache and fetch fresh
            }

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
            const now = new Date();
            const transitDatetime = now.toISOString();

            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/divination/zodiac/daily-transit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    birth_datetime: birthDatetime,
                    birth_city: city,
                    transit_datetime: transitDatetime,
                    current_city: city,
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
            <ThemedView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#000000" />
                <ThemedText type="subtitle" style={styles.waitingText}>Reading the planets...</ThemedText>
            </ThemedView>
        );
    }

    if (error) {
        return (
            <ThemedView style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="red" style={{ marginBottom: 16 }} />
                <ThemedText type="subtitle" style={{ color: 'red', textAlign: 'center' }}>Unable to load insight</ThemedText>
                <ThemedText style={{ textAlign: 'center', marginTop: 8 }}>{error}</ThemedText>
                <View style={{ marginTop: 24 }}>
                    <Text onPress={() => router.back()} style={{ color: 'blue', fontSize: 16 }}>Go Back</Text>
                </View>
            </ThemedView>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            style={styles.container}
        >
            <Stack.Screen options={{ title: 'Daily Insight', headerTitleStyle: { fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) } }} />

            <View style={styles.header}>
                <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                <Text style={styles.headline}>{insight?.headline}</Text>
                <Text style={styles.subtitle}>{insight?.pro_tip}</Text>
            </View>

            {insight && (
                <View style={styles.cardsContainer}>
                    {/* Energy Card */}
                    <LinearGradient
                        colors={['#fcf9e0ff', '#e1e9f3ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 5 }}
                        style={styles.energyCard}
                    >
                        <View style={styles.energyIconContainer}>
                            <Ionicons name="pulse" size={32} color="#555" />
                        </View>
                        <View style={styles.energyTextContainer}>
                            <Text style={styles.energyLabel}>ENERGY</Text>
                            <Text style={styles.energyValue}>{insight.energy.toUpperCase()}</Text>
                        </View>
                    </LinearGradient>

                    {/* Dual Card (Tension & Remedy) */}
                    <LinearGradient
                        colors={['#f9eaf8ff', '#f1e7ccff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.dualCard}
                    >
                        {/* Tension Section */}
                        <View style={styles.cardSection}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="git-compare-outline" size={20} color="#8175ebff" style={{ marginRight: 8 }} />
                                <Text style={styles.sectionTitle}>THE TENSION</Text>
                            </View>
                            <Text style={styles.sectionBody}>{insight.the_tension}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Remedy Section */}
                        <View style={styles.cardSection}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="sparkles-outline" size={20} color="#D4AF37" style={{ marginRight: 8 }} />
                                <Text style={styles.sectionTitle}>THE REMEDY</Text>
                            </View>
                            <Text style={styles.sectionBody}>{insight.the_remedy}</Text>
                        </View>
                    </LinearGradient>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        padding: 24,
        paddingTop: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    waitingText: {
        marginTop: 20,
        textAlign: 'center',
        color: '#666',
    },
    header: {
        marginBottom: 30,
    },
    date: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif' }),
    },
    headline: {
        fontSize: 32,
        fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
        color: '#000',
        lineHeight: 40,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 18,
        lineHeight: 26,
        color: '#333',
        fontStyle: 'italic',
        fontFamily: Platform.select({ ios: 'Georgia-Italic', android: 'serif' }),
    },
    cardsContainer: {
        gap: 20,
    },
    energyCard: {
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        // approximate gradient look from image
    },
    energyIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#999',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    energyTextContainer: {
        flex: 1,
    },
    energyLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    energyValue: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000',
        fontFamily: Platform.select({ ios: 'HelveticaNeue-Medium', android: 'sans-serif-medium' }),
    },
    dualCard: {
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardSection: {
        paddingVertical: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 0.5,
    },
    sectionBody: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    },
    divider: {
        height: 1,
        backgroundColor: '#DDD',
        width: '100%',
    },
});
