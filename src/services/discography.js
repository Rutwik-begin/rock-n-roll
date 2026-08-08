/**
 * Precision Movie Discography Agent Engine
 * Contains official tracklists and language mappings for movies to guarantee 100% accurate album generation.
 */

export const MOVIE_DISCOGRAPHIES = {
  'pushpa': {
    title: 'Pushpa: The Rise (Part 1)',
    language: 'telugu',
    officialSongs: [
      { key: 'srivalli', title: 'Srivalli', telugu: 'Srivalli', hindi: 'Srivalli', search: 'Srivalli Pushpa Sid Sriram' },
      { key: 'oo antava', title: 'Oo Antava Mawa..Oo Oo Antava', telugu: 'Oo Antava Mawa', hindi: 'Oo Bolega ya Oo Oo Bolega', search: 'Oo Antava Mawa Pushpa' },
      { key: 'saami saami', title: 'Saami Saami', telugu: 'Saami Saami', hindi: 'Saami Saami', search: 'Saami Saami Pushpa Sunidhi' },
      { key: 'eyy bidda', title: 'Eyy Bidda Idhi Naa Adda', telugu: 'Eyy Bidda Idhi Naa Adda', hindi: 'Eyy Bidda Ye Mera Adda', search: 'Eyy Bidda Idhi Naa Adda Pushpa' },
      { key: 'daakko daakko', title: 'Daakko Daakko Meka', telugu: 'Daakko Daakko Meka', hindi: 'Jaago Jaago Bakre', search: 'Daakko Daakko Meka Pushpa' },
    ],
    excludeKeywords: ['pushpa 2', 'the rule', 'pushpa pushpa', 'angaaron', 'sooseki', 'kissik', 'peelings']
  },
  'pushpa 1': {
    title: 'Pushpa: The Rise (Part 1)',
    language: 'telugu',
    officialSongs: [
      { key: 'srivalli', title: 'Srivalli', telugu: 'Srivalli', search: 'Srivalli Pushpa Sid Sriram' },
      { key: 'oo antava', title: 'Oo Antava Mawa..Oo Oo Antava', telugu: 'Oo Antava Mawa', search: 'Oo Antava Mawa Pushpa' },
      { key: 'saami saami', title: 'Saami Saami', telugu: 'Saami Saami', search: 'Saami Saami Pushpa' },
      { key: 'eyy bidda', title: 'Eyy Bidda Idhi Naa Adda', telugu: 'Eyy Bidda Idhi Naa Adda', search: 'Eyy Bidda Idhi Naa Adda Pushpa' },
      { key: 'daakko daakko', title: 'Daakko Daakko Meka', telugu: 'Daakko Daakko Meka', search: 'Daakko Daakko Meka Pushpa' },
    ],
    excludeKeywords: ['pushpa 2', 'the rule', 'pushpa pushpa', 'angaaron', 'sooseki', 'kissik', 'peelings']
  },
  'pushpa 2': {
    title: 'Pushpa 2: The Rule',
    language: 'telugu',
    officialSongs: [
      { key: 'pushpa pushpa', title: 'Pushpa Pushpa', search: 'Pushpa Pushpa Pushpa 2' },
      { key: 'angaaron', title: 'Angaaron (The Couple Song)', search: 'Angaaron Couple Song Pushpa 2 Shreya Ghoshal' },
      { key: 'sooseki', title: 'Sooseki (Couple Song)', search: 'Sooseki Pushpa 2 Shreya Ghoshal' },
      { key: 'kissik', title: 'Kissik', search: 'Kissik Pushpa 2 Sreeleela' },
      { key: 'peelings', title: 'Peelings', search: 'Peelings Pushpa 2' },
    ],
    excludeKeywords: ['the rise', 'part 1', 'srivalli', 'oo antava', 'saami saami', 'eyy bidda', 'daakko daakko']
  },
  'ala vaikunthapurramuloo': {
    title: 'Ala Vaikunthapurramuloo',
    language: 'telugu',
    officialSongs: [
      { key: 'samajavaragamana', title: 'Samajavaragamana', search: 'Samajavaragamana Ala Vaikunthapurramuloo Sid Sriram' },
      { key: 'buttabomma', title: 'Buttabomma', search: 'Buttabomma Ala Vaikunthapurramuloo Armaan Malik' },
      { key: 'ramuloo ramulaa', title: 'Ramuloo Ramulaa', search: 'Ramuloo Ramulaa Ala Vaikunthapurramuloo Anurag Kulkarni' },
      { key: 'omg daddy', title: 'OMG Daddy', search: 'OMG Daddy Ala Vaikunthapurramuloo' },
      { key: 'ounava ounava', title: 'Ounava Ounava', search: 'Ounava Ounava Ala Vaikunthapurramuloo' },
      { key: 'sittharala sirapadu', title: 'Sittharala Sirapadu', search: 'Sittharala Sirapadu Ala Vaikunthapurramuloo' }
    ]
  },
  'brahmastra': {
    title: 'Brahmāstra: Part One – Shiva',
    language: 'hindi',
    officialSongs: [
      { key: 'kesariya', title: 'Kesariya', search: 'Kesariya Brahmastra Arijit Singh' },
      { key: 'deva deva', title: 'Deva Deva', search: 'Deva Deva Brahmastra Arijit Singh' },
      { key: 'dance ka bhoot', title: 'Dance Ka Bhoot', search: 'Dance Ka Bhoot Brahmastra Arijit Singh' },
      { key: 'rasiya', title: 'Rasiya', search: 'Rasiya Brahmastra Pritam' },
      { key: 'shiva theme', title: 'Shiva Theme', search: 'Shiva Theme Brahmastra' }
    ]
  },
  'animal': {
    title: 'ANIMAL',
    language: 'hindi',
    officialSongs: [
      { key: 'arjan vailly', title: 'Arjan Vailly', search: 'Arjan Vailly Animal Bhupinder Babbal' },
      { key: 'satranga', title: 'Satranga', search: 'Satranga Animal Arijit Singh' },
      { key: 'hua main', title: 'Hua Main', search: 'Hua Main Animal Raghav Chaitanya' },
      { key: 'pehle bhi main', title: 'Pehle Bhi Main', search: 'Pehle Bhi Main Animal Vishal Mishra' },
      { key: 'jamal kudu', title: 'Jamal Kudu', search: 'Jamal Kudu Animal' },
      { key: 'papa meri jaan', title: 'Papa Meri Jaan', search: 'Papa Meri Jaan Animal Sonu Nigam' }
    ]
  },
  'rrr': {
    title: 'RRR (Rise Roar Revolt)',
    language: 'telugu',
    officialSongs: [
      { key: 'naatu naatu', title: 'Naatu Naatu', search: 'Naatu Naatu RRR Rahul Sipligunj Kaala Bhairava' },
      { key: 'dosti', title: 'Dosti', search: 'Dosti RRR Vedala Hemachandra' },
      { key: 'komuram bheemudo', title: 'Komuram Bheemudo', search: 'Komuram Bheemudo RRR Kaala Bhairava' },
      { key: 'janani', title: 'Janani', search: 'Janani RRR MM Keeravaani' },
      { key: 'etthara jhanda', title: 'Etthara Jhanda', search: 'Etthara Jhanda RRR' }
    ]
  },
  'devara': {
    title: 'Devara: Part 1',
    language: 'telugu',
    officialSongs: [
      { key: 'fear song', title: 'Fear Song', search: 'Fear Song Devara Anirudh Ravichander' },
      { key: 'chuttamalle', title: 'Chuttamalle', search: 'Chuttamalle Devara Shilpa Rao Anirudh' },
      { key: 'daavudi', title: 'Daavudi', search: 'Daavudi Devara Nakash Aziz Akasa' },
      { key: 'red sea', title: 'Red Sea', search: 'Red Sea Devara Anirudh' }
    ]
  }
};

/**
 * Match a query string against official discography database
 */
export function getOfficialDiscography(query = '') {
  if (!query) return null;
  const qLower = query.toLowerCase().trim();

  // Direct match
  if (MOVIE_DISCOGRAPHIES[qLower]) {
    return MOVIE_DISCOGRAPHIES[qLower];
  }

  // Partial match
  for (const [key, disco] of Object.entries(MOVIE_DISCOGRAPHIES)) {
    if (qLower.includes(key) || key.includes(qLower)) {
      // Check sequel specificity e.g. "pushpa 2" vs "pushpa"
      if (qLower.includes('2') && !key.includes('2')) continue;
      return disco;
    }
  }

  return null;
}
