// scripture sits apart from the interface: a hairline above, the source in gold below.
// three verses, three slots, never more — restraint is the treatment here too.

interface VerseProps {
  ar: string;
  en: string;
  source: string;
  className?: string;
}

export function Verse({ ar, en, source, className }: VerseProps) {
  return (
    <figure className={`verse${className ? ` ${className}` : ''}`}>
      <p className="verse-ar" lang="ar" dir="rtl">
        {ar}
      </p>
      <p className="verse-en">{en}</p>
      <figcaption className="verse-source label">{source}</figcaption>
    </figure>
  );
}

export const VERSES = {
  // the brand is named for this hadith — the sales page opens with it
  intention: {
    ar: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ',
    en: 'Actions are only by their intentions.',
    source: 'The Prophet ﷺ · Bukhari & Muslim',
  },
  // the verdict is muhasabah — self-accounting before the account is taken
  accounting: {
    ar: 'وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ',
    en: 'Let every soul look to what it has sent ahead for tomorrow.',
    source: 'Al-Hashr 59:18',
  },
  // the breaker holds the trader in the exact minute this hadith names
  restraint: {
    ar: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ',
    en: 'The strong one is not the one who overcomes others. The strong one is he who masters himself in anger.',
    source: 'The Prophet ﷺ · Bukhari',
  },
} as const;
