import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_INSIGHT_KEY = 'user_daily_insight';

export interface DailyTransit {
    headline: string;
    mood_word: string;
    the_vibe: string;
    the_fix: string;
    pro_tip: string;
}

interface CachedDailyInsight {
    date: string; // YYYY-MM-DD
    data: DailyTransit;
}

export const getDailyInsightCache = async (): Promise<DailyTransit | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(DAILY_INSIGHT_KEY);
        if (jsonValue != null) {
            const cached: CachedDailyInsight = JSON.parse(jsonValue);
            const today = new Date().toISOString().split('T')[0];

            if (cached.date === today) {
                return cached.data;
            }
        }
        return null;
    } catch (e) {
        console.error("Failed to load daily insight cache", e);
        return null;
    }
};

export const saveDailyInsightCache = async (data: DailyTransit) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const cache: CachedDailyInsight = {
            date: today,
            data: data,
        };
        await AsyncStorage.setItem(DAILY_INSIGHT_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error("Failed to save daily insight cache", e);
    }
};
