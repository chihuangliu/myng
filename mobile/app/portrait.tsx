import { useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
                <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
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

                {portrait && (
                    <>
                        <Section title="Core Identity" data={portrait.core_identity} />
                        <Section title="Psychological Dynamics" data={portrait.psychological_dynamics} />
                        <Section title="Drive, Career & Values" data={portrait.drive_career_values} />
                        <Section title="Growth & Pathway" data={portrait.growth_pathway} />
                    </>
                )}
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    title: {
        marginBottom: 32,
        textAlign: 'center',
    },
    waitingText: {
        marginTop: 20,
        textAlign: 'center',
    },
    sectionContainer: {
        marginBottom: 20,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
    },
    summary: {
        fontSize: 14,
        fontStyle: 'italic',
        opacity: 0.8,
        lineHeight: 20,
    },
    contentContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    content: {
        lineHeight: 24,
        fontSize: 16,
    }
});
