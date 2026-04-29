export function getLimitForType(messageType) {
  switch (messageType) {
    case 'linkedin':
      return 'Max 300 characters — be extremely concise';
    case 'email':
      return '150-200 words with a clear subject line';
    case 'followup':
      return '80-120 words — short and direct';
    case 'referral':
      return '120-150 words — specific role + why you are a fit';
    case 'thankyou':
      return '80-100 words — genuine, specific, brief';
    case 'negotiation':
      return '200-250 words — confident, data-backed';
    case 'decline':
      return '60-80 words — polite, gracious, professional';
    default:
      return '100-150 words';
  }
}

export function checkSpamTriggers(message) {
  const SPAM_PHRASES = [
    'i hope this message finds you well',
    'i hope this finds you',
    'i know you are busy',
    'i will keep this short',
    'i wanted to reach out',
    'touching base',
    'circling back',
    'per my last',
    'as discussed',
    'going forward',
    'synergy',
    'leverage',
    'please let me know if',
    'feel free to'
  ];
  
  const found = [];
  const lowerMsg = message.toLowerCase();
  
  for (const phrase of SPAM_PHRASES) {
    if (lowerMsg.includes(phrase)) {
      found.push(phrase);
    }
  }
  
  return found;
}

export function countWords(message) {
  if (!message) return 0;
  return message.trim().split(/\s+/).length;
}

export function detectTone(message) {
  if (!message) return 'neutral';
  
  const lower = message.toLowerCase();
  
  const formal = ['please', 'kindly', 'if possible', 'sincerely', 'regards', 'appreciate'];
  const friendly = ['hope', 'excited', 'love', 'amazing', 'great', 'cheers'];
  const desperate = ['really need', 'been trying', 'please help', 'desperate', 'begging', 'struggling'];
  const confident = ['i offer', 'my experience', 'i can contribute', 'track record', 'proven', 'deliver'];
  
  let scores = { formal: 0, friendly: 0, desperate: 0, confident: 0 };
  
  formal.forEach(w => { if (lower.includes(w)) scores.formal++; });
  friendly.forEach(w => { if (lower.includes(w)) scores.friendly++; });
  desperate.forEach(w => { if (lower.includes(w)) scores.desperate++; });
  confident.forEach(w => { if (lower.includes(w)) scores.confident++; });
  
  let maxScore = 0;
  let detected = 'neutral';
  
  for (const [tone, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detected = tone;
    }
  }
  
  return detected;
}
