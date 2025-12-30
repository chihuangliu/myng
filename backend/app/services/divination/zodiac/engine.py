from dataclasses import dataclass
from datetime import date

@dataclass
class Sign:
    name: str

class ZodiacEngine:
    def get_sign(self, query_date: date) -> Sign:
        month = query_date.month
        day = query_date.day

        if (month == 3 and day >= 21) or (month == 4 and day <= 19):
            return Sign(name="Aries")
        elif (month == 4 and day >= 20) or (month == 5 and day <= 20):
            return Sign(name="Taurus")
        elif (month == 5 and day >= 21) or (month == 6 and day <= 20):
            return Sign(name="Gemini")
        elif (month == 6 and day >= 21) or (month == 7 and day <= 22):
            return Sign(name="Cancer")
        elif (month == 7 and day >= 23) or (month == 8 and day <= 22):
            return Sign(name="Leo")
        elif (month == 8 and day >= 23) or (month == 9 and day <= 22):
            return Sign(name="Virgo")
        elif (month == 9 and day >= 23) or (month == 10 and day <= 22):
            return Sign(name="Libra")
        elif (month == 10 and day >= 23) or (month == 11 and day <= 21):
            return Sign(name="Scorpio")
        elif (month == 11 and day >= 22) or (month == 12 and day <= 21):
            return Sign(name="Sagittarius")
        elif (month == 12 and day >= 22) or (month == 1 and day <= 19):
            return Sign(name="Capricorn")
        elif (month == 1 and day >= 20) or (month == 2 and day <= 18):
            return Sign(name="Aquarius")
        else:
            return Sign(name="Pisces")
