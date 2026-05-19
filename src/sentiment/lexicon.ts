/**
 * Lexicon-based Sentiment Analysis
 *
 * Production-grade sentiment scoring with:
 * - Extended AFINN-style lexicon (~500 news-domain words)
 * - Sentence-level analysis with per-sentence scoring
 * - Negation window (3-word look-back)
 * - Intensifier handling (very, extremely, etc.)
 * - But-clause weighting (post-"but" sentiment emphasized)
 * - Positive/negative/neutral breakdown percentages
 * - Coverage-based confidence scoring
 *
 * All functions are pure — no I/O, no DB, no side effects.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// AFINN-165 subset (news-domain, ~500 words, -5 to +5)
// ---------------------------------------------------------------------------

const DEFAULT_LEXICON: Record<string, number> = {
    // -5
    'bastard': -5, 'bastards': -5,
    // -4
    'asshole': -4, 'assholes': -4, 'awful': -4,
    'catastrophe': -4, 'catastrophic': -4, 'crap': -4,
    'damn': -4, 'damned': -4, 'dammit': -4, 'disgusting': -4,
    'disaster': -4, 'disastrous': -4, 'dreadful': -4,
    'hate': -4, 'hated': -4, 'hateful': -4, 'hating': -4,
    'horrible': -4, 'horribly': -4, 'horrific': -4, 'horrified': -4,
    'terrible': -4, 'terribly': -4,
    'terrorize': -4, 'terrorized': -4, 'terrorist': -4, 'terrorists': -4,
    'worst': -4,
    // -3
    'abandon': -3, 'abandoned': -3, 'abandonment': -3,
    'abuse': -3, 'abused': -3, 'abusive': -3,
    'accuse': -3, 'accused': -3, 'accusing': -3,
    'agony': -3, 'angry': -3, 'angrier': -3, 'angriest': -3, 'anger': -3,
    'annihilate': -3, 'annihilated': -3, 'appalling': -3,
    'arrest': -3, 'arrested': -3,
    'assault': -3, 'assaulted': -3,
    'atrocity': -3, 'atrocities': -3,
    'attack': -3, 'attacked': -3, 'attacking': -3, 'attacks': -3,
    'bankrupt': -3, 'bankruptcy': -3,
    'battle': -3, 'battles': -3,
    'betray': -3, 'betrayal': -3, 'betrayed': -3,
    'bitter': -3, 'bitterly': -3,
    'blame': -3, 'blamed': -3, 'blaming': -3,
    'bleak': -3, 'bloody': -3,
    'brutal': -3, 'brutally': -3, 'brutality': -3,
    'bully': -3, 'bullied': -3, 'bullying': -3,
    'burden': -3, 'burdened': -3,
    'chaos': -3, 'chaotic': -3,
    'collapse': -3, 'collapsed': -3, 'collapsing': -3,
    'condemn': -3, 'condemned': -3, 'condemnation': -3,
    'conflict': -3, 'conflicts': -3,
    'corrupt': -3, 'corruption': -3,
    'crash': -3, 'crashed': -3, 'crashing': -3,
    'crime': -3, 'crimes': -3, 'criminal': -3, 'criminals': -3,
    'crisis': -3, 'crises': -3,
    'cruel': -3, 'cruelty': -3,
    'crush': -3, 'crushed': -3, 'crushing': -3,
    'damage': -3, 'damaged': -3, 'damages': -3, 'damaging': -3,
    'danger': -3, 'dangerous': -3, 'dangerously': -3,
    'dead': -3, 'deadly': -3, 'death': -3, 'deaths': -3,
    'decline': -3, 'declined': -3, 'declining': -3,
    'defeat': -3, 'defeated': -3,
    'defect': -3, 'defective': -3,
    'deny': -3, 'denied': -3, 'denial': -3,
    'despair': -3, 'despairing': -3,
    'destroy': -3, 'destroyed': -3, 'destruction': -3, 'destructive': -3,
    'devastate': -3, 'devastated': -3, 'devastating': -3, 'devastation': -3,
    'die': -3, 'died': -3, 'dying': -3, 'dire': -3,
    'disease': -3, 'diseased': -3, 'diseases': -3, 'dismal': -3,
    'dismiss': -3, 'dismissed': -3,
    'dispute': -3, 'disputed': -3, 'disputes': -3,
    'doom': -3, 'doomed': -3, 'dread': -3,
    'enemy': -3, 'enemies': -3, 'epidemic': -3, 'evil': -3,
    'explode': -3, 'exploded': -3, 'explosion': -3, 'explosions': -3,
    'fail': -3, 'failed': -3, 'failing': -3, 'failure': -3, 'failures': -3,
    'fatal': -3, 'fatally': -3, 'fatalities': -3, 'fatality': -3,
    'fear': -3, 'feared': -3, 'fearful': -3, 'fears': -3,
    'fight': -3, 'fighting': -3, 'fights': -3,
    'flee': -3, 'fled': -3, 'fleeing': -3,
    'flood': -3, 'flooded': -3, 'flooding': -3, 'floods': -3,
    'fraud': -3, 'fraudulent': -3,
    'fright': -3, 'frightened': -3, 'frightening': -3,
    'fury': -3, 'furious': -3,
    'grave': -3, 'gravely': -3,
    'grief': -3, 'grieving': -3, 'guilty': -3,
    'harm': -3, 'harmed': -3, 'harmful': -3, 'harming': -3,
    'harsh': -3, 'harshly': -3, 'havoc': -3, 'hell': -3,
    'helpless': -3, 'hopeless': -3, 'horror': -3,
    'hostile': -3, 'hostility': -3,
    'hurt': -3, 'hurting': -3, 'hurts': -3,
    'ill': -3, 'illness': -3, 'immoral': -3,
    'imprison': -3, 'imprisoned': -3, 'imprisonment': -3,
    'infect': -3, 'infected': -3, 'infection': -3, 'infections': -3,
    'injure': -3, 'injured': -3, 'injuries': -3, 'injury': -3,
    'insane': -3, 'insanity': -3,
    'jail': -3, 'jailed': -3,
    'kill': -3, 'killed': -3, 'killer': -3, 'killers': -3, 'killing': -3, 'killings': -3,
    'lack': -3, 'lacking': -3,
    'lawsuit': -3, 'lawsuits': -3, 'liar': -3, 'liars': -3,
    'lie': -3, 'lied': -3, 'lies': -3, 'lying': -3,
    'lose': -3, 'loser': -3, 'losers': -3, 'losing': -3, 'loss': -3, 'losses': -3, 'lost': -3,
    'massacre': -3, 'massacred': -3,
    'miserable': -3, 'miserably': -3, 'misery': -3,
    'mob': -3, 'mobs': -3,
    'murder': -3, 'murdered': -3, 'murderer': -3, 'murderers': -3, 'murders': -3,
    'negative': -3, 'neglect': -3, 'neglected': -3,
    'nightmare': -3, 'nightmares': -3,
    'outrage': -3, 'outraged': -3, 'outrageous': -3,
    'pain': -3, 'painful': -3, 'painfully': -3,
    'pandemic': -3, 'panic': -3, 'panicked': -3, 'panicking': -3,
    'pathetic': -3, 'peril': -3, 'perilous': -3,
    'plague': -3, 'plagued': -3,
    'plunge': -3, 'plunged': -3, 'plunging': -3,
    'poison': -3, 'poisoned': -3, 'poisoning': -3, 'poisonous': -3,
    'poor': -3, 'poorly': -3, 'poverty': -3,
    'prison': -3, 'prisoner': -3, 'prisoners': -3,
    'prosecute': -3, 'prosecuted': -3, 'prosecution': -3,
    'punish': -3, 'punished': -3, 'punishment': -3,
    'rage': -3, 'raging': -3, 'rape': -3, 'raped': -3,
    'recession': -3, 'recessionary': -3,
    'reject': -3, 'rejected': -3, 'rejection': -3,
    'revolt': -3, 'riot': -3, 'rioted': -3, 'rioting': -3, 'riots': -3,
    'rob': -3, 'robbed': -3, 'robbery': -3,
    'ruin': -3, 'ruined': -3, 'ruining': -3, 'ruthless': -3,
    'sad': -3, 'sadden': -3, 'saddened': -3, 'sadly': -3, 'sadness': -3,
    'scare': -3, 'scared': -3, 'scary': -3,
    'scandal': -3, 'scandals': -3, 'scandalous': -3,
    'scream': -3, 'screamed': -3, 'screaming': -3,
    'severe': -3, 'severely': -3,
    'shock': -3, 'shocked': -3, 'shocking': -3,
    'shoot': -3, 'shooter': -3, 'shooting': -3, 'shootings': -3, 'shot': -3,
    'sick': -3, 'sickness': -3,
    'slaughter': -3, 'slaughtered': -3,
    'slave': -3, 'slavery': -3, 'slaves': -3,
    'sorrow': -3, 'sorrowful': -3,
    'steal': -3, 'stealing': -3, 'stole': -3, 'stolen': -3,
    'stress': -3, 'stressed': -3, 'stressful': -3,
    'struggle': -3, 'struggled': -3, 'struggles': -3, 'struggling': -3,
    'stupid': -3, 'stupidity': -3,
    'suffer': -3, 'suffered': -3, 'suffering': -3, 'suffers': -3,
    'suicide': -3, 'suicidal': -3, 'suicides': -3,
    'terror': -3, 'terrorism': -3,
    'threat': -3, 'threaten': -3, 'threatened': -3, 'threatening': -3, 'threats': -3,
    'torture': -3, 'tortured': -3, 'torturing': -3, 'toxic': -3,
    'tragedy': -3, 'tragedies': -3, 'tragic': -3, 'tragically': -3,
    'trauma': -3, 'traumatic': -3, 'traumatized': -3,
    'trouble': -3, 'troubled': -3, 'troubles': -3, 'turmoil': -3,
    'ugly': -3, 'uglier': -3, 'ugliest': -3,
    'unemployment': -3, 'unemployed': -3,
    'unfair': -3, 'unfairly': -3,
    'unfortunate': -3, 'unfortunately': -2,
    'unhappy': -3, 'unstable': -3,
    'upset': -3, 'upsetting': -3,
    'victim': -3, 'victimized': -3, 'victims': -3,
    'violence': -3, 'violent': -3, 'violently': -3,
    'war': -3, 'warfare': -3, 'wars': -3,
    'weak': -3, 'weaken': -3, 'weakened': -3, 'weakness': -3,
    'weapon': -3, 'weapons': -3, 'wicked': -3,
    'woe': -3, 'woes': -3,
    'worry': -3, 'worried': -3, 'worries': -3, 'worrying': -3,
    'worse': -3, 'worsen': -3, 'worsened': -3, 'worsening': -3,
    'wound': -3, 'wounded': -3, 'wounds': -3,
    'wreck': -3, 'wrecked': -3,
    'wrong': -3, 'wrongly': -3,
    // -2
    'bad': -2, 'badly': -2,
    'block': -2, 'blocked': -2, 'blocking': -2,
    'cancel': -2, 'cancelled': -2, 'cancellation': -2,
    'challenge': -1, 'challenged': -1, 'challenging': -1, 'challenges': -1,
    'complain': -2, 'complained': -2, 'complaint': -2, 'complaints': -2,
    'concern': -2, 'concerned': -2, 'concerning': -2, 'concerns': -2,
    'confuse': -2, 'confused': -2, 'confusing': -2, 'confusion': -2,
    'controversial': -2, 'controversy': -2,
    'cost': -1, 'costly': -2, 'costs': -1,
    'critical': -2, 'criticize': -2, 'criticized': -2, 'criticism': -2,
    'cut': -2, 'cuts': -2, 'cutting': -2,
    'delay': -2, 'delayed': -2, 'delays': -2,
    'difficult': -2, 'difficulty': -2, 'difficulties': -2,
    'disappoint': -2, 'disappointed': -2, 'disappointing': -2, 'disappointment': -2,
    'doubt': -2, 'doubted': -2, 'doubtful': -2, 'doubts': -2,
    'drop': -2, 'dropped': -2, 'dropping': -2, 'drops': -2,
    'error': -2, 'errors': -2,
    'fall': -2, 'fallen': -2, 'falling': -2, 'falls': -2,
    'fault': -2, 'faults': -2, 'faulty': -2,
    'fire': -2, 'fired': -2, 'fires': -2,
    'hard': -1, 'harder': -2, 'hardest': -2,
    'ignore': -2, 'ignored': -2, 'ignoring': -2,
    'issue': -1, 'issues': -1,
    'limit': -1, 'limited': -1, 'limiting': -1, 'limits': -1,
    'low': -2, 'lower': -2, 'lowest': -2,
    'miss': -2, 'missed': -2, 'missing': -2,
    'mistake': -2, 'mistaken': -2, 'mistakes': -2,
    'oppose': -2, 'opposed': -2, 'opposing': -2, 'opposition': -2,
    'pressure': -2, 'pressured': -2, 'pressures': -2,
    'problem': -2, 'problematic': -2, 'problems': -2,
    'protest': -2, 'protested': -2, 'protesters': -2, 'protesting': -2, 'protests': -2,
    'question': -1, 'questioned': -2, 'questioning': -2, 'questions': -1,
    'reduce': -1, 'reduced': -1, 'reducing': -1, 'reduction': -1,
    'refuse': -2, 'refused': -2, 'refusing': -2,
    'resign': -2, 'resigned': -2, 'resignation': -2,
    'risk': -2, 'risks': -2, 'risky': -2,
    'short': -1, 'shortage': -2, 'shortages': -2,
    'slow': -2, 'slower': -2, 'slowest': -2, 'slowly': -1,
    'storm': -2, 'storms': -2, 'stormy': -2,
    'strike': -2, 'strikes': -2, 'striking': -2,
    'suspect': -2, 'suspected': -2, 'suspects': -2,
    'tension': -2, 'tensions': -2, 'tense': -2,
    'tough': -2, 'tougher': -2, 'toughest': -2,
    'uncertain': -2, 'uncertainty': -2,
    'virus': -2, 'viruses': -2, 'vulnerable': -2,
    'warn': -2, 'warned': -2, 'warning': -2, 'warnings': -2,
    'against': -1,
    // +1..+2
    'accept': 2, 'accepted': 2, 'accepting': 2,
    'accomplish': 2, 'accomplished': 2, 'accomplishment': 2,
    'achieve': 2, 'achieved': 2, 'achievement': 2, 'achievements': 2, 'achieving': 2,
    'add': 1, 'added': 1, 'adding': 1, 'addition': 1, 'additional': 1,
    'advantage': 2, 'advantages': 2,
    'agree': 2, 'agreed': 2, 'agreement': 2, 'agreements': 2, 'agreeing': 2,
    'aid': 2, 'aided': 2, 'aiding': 2, 'aids': 2,
    'allow': 1, 'allowed': 1, 'allowing': 1, 'allows': 1,
    'announce': 1, 'announced': 1, 'announcement': 2, 'announcements': 2,
    'approve': 2, 'approved': 2, 'approving': 2, 'approval': 2,
    'assist': 2, 'assistance': 2, 'assisted': 2, 'assisting': 2,
    'award': 2, 'awarded': 2, 'awards': 2,
    'back': 1, 'backed': 2, 'backing': 2,
    'benefit': 2, 'beneficial': 2, 'benefits': 2,
    'better': 2, 'betterment': 2,
    'boost': 2, 'boosted': 2, 'boosting': 2, 'boosts': 2,
    'calm': 2, 'calmed': 2, 'calming': 2,
    'clean': 2, 'cleaned': 2, 'cleaner': 2, 'cleaning': 2,
    'clear': 2, 'cleared': 2, 'clearing': 2, 'clearly': 2,
    'comfortable': 2, 'comfortably': 2,
    'commit': 2, 'commitment': 2, 'committed': 2,
    'confident': 2, 'confidence': 2, 'confidently': 2,
    'confirm': 2, 'confirmed': 2, 'confirmation': 2,
    'contribute': 2, 'contributed': 2, 'contribution': 2, 'contributions': 2,
    'convenient': 2, 'conveniently': 2,
    'cooperate': 2, 'cooperation': 2, 'cooperative': 2,
    'create': 2, 'created': 2, 'creating': 2, 'creation': 2,
    'cure': 2, 'cured': 2, 'curing': 2,
    'deal': 1, 'deals': 2,
    'defend': 2, 'defended': 2, 'defending': 2, 'defense': 1,
    'deliver': 2, 'delivered': 2, 'delivering': 2, 'delivery': 2,
    'develop': 2, 'developed': 2, 'developing': 2, 'development': 2,
    'discover': 2, 'discovered': 2, 'discovering': 2, 'discovery': 2,
    'donate': 2, 'donated': 2, 'donation': 2, 'donations': 2,
    'earn': 2, 'earned': 2, 'earning': 2, 'earnings': 2,
    'effective': 2, 'effectively': 2, 'effectiveness': 2,
    'efficient': 2, 'efficiently': 2, 'efficiency': 2,
    'encourage': 2, 'encouraged': 2, 'encouraging': 2, 'encouragement': 2,
    'enhance': 2, 'enhanced': 2, 'enhancing': 2, 'enhancement': 2,
    'enjoy': 2, 'enjoyed': 2, 'enjoying': 2, 'enjoyment': 2,
    'ensure': 2, 'ensured': 2, 'ensuring': 2,
    'establish': 2, 'established': 2, 'establishing': 2,
    'expand': 2, 'expanded': 2, 'expanding': 2, 'expansion': 2,
    'fair': 2, 'fairly': 2, 'fairness': 2,
    'fast': 2, 'faster': 2, 'fastest': 2,
    'favor': 2, 'favorable': 2, 'favorably': 2, 'favored': 2,
    'fix': 2, 'fixed': 2, 'fixing': 2,
    'free': 2, 'freed': 2, 'freedom': 2, 'freely': 2,
    'fund': 2, 'funded': 2, 'funding': 2, 'funds': 2,
    'gain': 2, 'gained': 2, 'gaining': 2, 'gains': 2,
    'gift': 2, 'gifts': 2,
    'good': 2, 'goodness': 2,
    'grant': 2, 'granted': 2, 'granting': 2, 'grants': 2,
    'grateful': 2, 'gratitude': 2,
    'great': 2, 'greater': 2, 'greatest': 2, 'greatly': 2,
    'grow': 2, 'growing': 2, 'grows': 2, 'growth': 2,
    'happy': 2, 'happier': 2, 'happiest': 2, 'happily': 2, 'happiness': 2,
    'heal': 2, 'healed': 2, 'healing': 2, 'health': 2, 'healthy': 2, 'healthier': 2,
    'help': 2, 'helped': 2, 'helpful': 2, 'helping': 2, 'helps': 2,
    'high': 2, 'higher': 2, 'highest': 2,
    'honor': 2, 'honored': 2, 'honoring': 2, 'honors': 2,
    'hope': 2, 'hoped': 2, 'hopeful': 2, 'hopefully': 2, 'hopes': 2, 'hoping': 2,
    'improve': 2, 'improved': 2, 'improvement': 2, 'improvements': 2, 'improving': 2,
    'increase': 2, 'increased': 2, 'increases': 2, 'increasing': 2,
    'innovative': 2, 'innovation': 2, 'innovations': 2,
    'inspire': 2, 'inspired': 2, 'inspiring': 2, 'inspiration': 2,
    'invest': 2, 'invested': 2, 'investing': 2, 'investment': 2, 'investments': 2,
    'join': 1, 'joined': 1, 'joining': 1,
    'joy': 2, 'joyful': 2, 'joyous': 2,
    'launch': 2, 'launched': 2, 'launching': 2,
    'lead': 2, 'leader': 2, 'leaders': 2, 'leadership': 2, 'leading': 2, 'leads': 2,
    'learn': 2, 'learned': 2, 'learning': 2,
    'legal': 1, 'legally': 1,
    'like': 1, 'liked': 1, 'likes': 1,
    'love': 2, 'loved': 2, 'lovely': 2, 'loves': 2, 'loving': 2,
    'lucky': 2,
    'major': 1, 'majority': 1,
    'new': 1, 'newer': 1, 'newest': 1,
    'nice': 2, 'nicer': 2, 'nicest': 2, 'nicely': 2,
    'open': 1, 'opened': 1, 'opening': 2, 'opens': 1,
    'opportunity': 2, 'opportunities': 2,
    'optimism': 2, 'optimistic': 2,
    'partner': 2, 'partners': 2, 'partnership': 2, 'partnerships': 2,
    'peace': 2, 'peaceful': 2, 'peacefully': 2,
    'perfect': 2, 'perfectly': 2,
    'please': 2, 'pleased': 2, 'pleasing': 2, 'pleasure': 2,
    'popular': 2, 'popularity': 2,
    'positive': 2, 'positively': 2,
    'power': 1, 'powerful': 2, 'powerfully': 2,
    'praise': 2, 'praised': 2, 'praising': 2,
    'profit': 2, 'profitable': 2, 'profits': 2,
    'progress': 2, 'progressed': 2, 'progressing': 2,
    'promote': 2, 'promoted': 2, 'promoting': 2, 'promotion': 2,
    'prosper': 2, 'prospered': 2, 'prospering': 2, 'prosperity': 2,
    'protect': 2, 'protected': 2, 'protecting': 2, 'protection': 2,
    'proud': 2, 'proudly': 2,
    'rally': 2, 'rallied': 2, 'rallies': 2, 'rallying': 2,
    'reach': 1, 'reached': 1, 'reaches': 1, 'reaching': 1,
    'recover': 2, 'recovered': 2, 'recovering': 2, 'recovery': 2,
    'reform': 2, 'reformed': 2, 'reforming': 2, 'reforms': 2,
    'relief': 2, 'relieve': 2, 'relieved': 2,
    'rescue': 2, 'rescued': 2, 'rescuing': 2,
    'resolve': 2, 'resolved': 2, 'resolving': 2, 'resolution': 2,
    'respect': 2, 'respected': 2, 'respectful': 2,
    'restore': 2, 'restored': 2, 'restoring': 2,
    'reward': 2, 'rewarded': 2, 'rewarding': 2, 'rewards': 2,
    'rich': 2, 'richer': 2, 'richest': 2,
    'right': 1, 'rights': 1,
    'rise': 2, 'risen': 2, 'rises': 2, 'rising': 2,
    'safe': 2, 'safely': 2, 'safer': 2, 'safest': 2, 'safety': 2,
    'save': 2, 'saved': 2, 'saves': 2, 'saving': 2, 'savings': 2,
    'secure': 2, 'secured': 2, 'security': 2,
    'share': 1, 'shared': 1, 'shares': 1, 'sharing': 1,
    'smart': 2, 'smarter': 2, 'smartest': 2,
    'solve': 2, 'solved': 2, 'solving': 2, 'solution': 2, 'solutions': 2,
    'stable': 2, 'stability': 2,
    'strength': 2, 'strengthen': 2, 'strengthened': 2, 'strong': 2, 'stronger': 2, 'strongest': 2,
    'succeed': 2, 'succeeded': 2, 'succeeding': 2, 'success': 2, 'successful': 2, 'successfully': 2,
    'support': 2, 'supported': 2, 'supporting': 2, 'supports': 2,
    'surprise': 1, 'surprised': 1, 'surprising': 1,
    'sustain': 2, 'sustainable': 2, 'sustained': 2,
    'thank': 2, 'thanked': 2, 'thankful': 2, 'thanks': 2,
    'thrive': 2, 'thrived': 2, 'thriving': 2,
    'top': 1, 'tops': 1,
    'transform': 2, 'transformed': 2, 'transforming': 2, 'transformation': 2,
    'triumph': 2, 'triumphed': 2, 'triumphant': 2,
    'trust': 2, 'trusted': 2, 'trusting': 2, 'trustworthy': 2,
    'unite': 2, 'united': 2, 'uniting': 2, 'unity': 2,
    'upgrade': 2, 'upgraded': 2, 'upgrading': 2,
    'valuable': 2, 'value': 2, 'valued': 2, 'values': 1,
    'victory': 2, 'victories': 2, 'victorious': 2,
    'welcome': 2, 'welcomed': 2, 'welcoming': 2,
    'well': 2,
    'win': 2, 'winner': 2, 'winners': 2, 'winning': 2, 'wins': 2, 'won': 2,
    'wonderful': 2, 'wonderfully': 2,
    'work': 1, 'worked': 1, 'working': 1, 'works': 1,
    'worthy': 2,
    // +3
    'amazing': 3, 'amazed': 3, 'amazingly': 3,
    'best': 3, 'blessed': 3, 'blessing': 3, 'blessings': 3,
    'brilliant': 3, 'brilliantly': 3,
    'celebrate': 3, 'celebrated': 3, 'celebrating': 3, 'celebration': 3,
    'champion': 3, 'champions': 3, 'championship': 3,
    'delight': 3, 'delighted': 3, 'delightful': 3,
    'dream': 2, 'dreams': 2,
    'enthusiastic': 3, 'enthusiasm': 3,
    'excel': 3, 'excelled': 3, 'excellence': 3, 'excellent': 3,
    'exceptional': 3, 'exceptionally': 3,
    'excited': 3, 'excitement': 3, 'exciting': 3,
    'extraordinary': 3, 'fabulous': 3,
    'fantastic': 3, 'fantastically': 3,
    'glorious': 3, 'glory': 3, 'gorgeous': 3,
    'grand': 3, 'grandest': 3,
    'hero': 3, 'heroes': 3, 'heroic': 3,
    'incredible': 3, 'incredibly': 3,
    'magnificent': 3, 'marvelous': 3, 'marvellous': 3,
    'masterpiece': 3, 'miracle': 3, 'miracles': 3, 'miraculous': 3,
    'outstanding': 3, 'outstandingly': 3,
    'paradise': 3, 'phenomenal': 3, 'phenomenally': 3,
    'remarkable': 3, 'remarkably': 3, 'sensational': 3,
    'spectacular': 3, 'spectacularly': 3,
    'splendid': 3, 'splendidly': 3, 'stellar': 3,
    'stunning': 3, 'stunningly': 3,
    'superb': 3, 'superbly': 3, 'superior': 3,
    'terrific': 3, 'terrifically': 3,
    'thrilled': 3, 'thrilling': 3,
    'tremendous': 3, 'tremendously': 3,
    // +4
    'adore': 4, 'adored': 4, 'adoring': 4,
    'awesome': 4, 'breathtaking': 4, 'ecstatic': 4,
    'flawless': 4, 'flawlessly': 4,
    'legendary': 4,
    'unbelievable': 4, 'unbelievably': 4,
    // +5
    'awe-inspiring': 5,
};

// Negation words that flip sentiment
export const NEGATORS = new Set([
    'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere',
    'hardly', 'barely', 'scarcely', 'rarely', 'seldom',
    "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't",
    "can't", "cannot", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't",
    'without',
]);

// Amplifiers that boost/dampen sentiment
export const AMPLIFIERS: Record<string, number> = {
    'very': 1.5, 'really': 1.5, 'extremely': 1.75, 'incredibly': 1.75,
    'absolutely': 1.75, 'completely': 1.5, 'totally': 1.5, 'utterly': 1.75,
    'thoroughly': 1.5, 'deeply': 1.5, 'highly': 1.5,
    'tremendously': 1.75, 'enormously': 1.5, 'exceptionally': 1.75,
    'remarkably': 1.5, 'profoundly': 1.75,
    'quite': 1.25, 'rather': 1.25, 'fairly': 1.1, 'pretty': 1.25,
    'somewhat': 0.75, 'slightly': 0.5, 'mildly': 0.5, 'marginally': 0.5,
};

// But-clause markers — sentiment after "but" is weighted more heavily
export const BUT_WORDS = new Set([
    'but', 'however', 'although', 'though', 'yet', 'nevertheless', 'nonetheless',
]);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface SentimentConfig {
    /** Words to look back for negation (default: 3) */
    negationWindow: number;
    /** Words to look back for intensifiers (default: 2) */
    intensifierWindow: number;
    /** Multiplier when negation detected (default: -0.8) */
    negationMultiplier: number;
    /** Weight for content before "but" (default: 0.4) */
    butClauseWeightBefore: number;
    /** Weight for content after "but" (default: 0.6) */
    butClauseWeightAfter: number;
    /** Minimum sentiment words for full confidence (default: 3) */
    minSentimentWords: number;
    /** Confidence penalty when below minSentimentWords (default: 0.5) */
    lowCoverageConfidencePenalty: number;
}

export const DEFAULT_CONFIG: SentimentConfig = {
    negationWindow: 3,
    intensifierWindow: 2,
    negationMultiplier: -0.8,
    butClauseWeightBefore: 0.4,
    butClauseWeightAfter: 0.6,
    minSentimentWords: 3,
    lowCoverageConfidencePenalty: 0.5,
};

// ---------------------------------------------------------------------------
// Schemas & types
// ---------------------------------------------------------------------------

export const SentimentBreakdownSchema = z.object({
    positive: z.number(),
    negative: z.number(),
    neutral: z.number(),
});
export type SentimentBreakdown = z.infer<typeof SentimentBreakdownSchema>;

export const SentimentResultSchema = z.object({
    score: z.number(),
    normalizedScore: z.number(),
    label: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number(),
    wordCount: z.number(),
    sentimentWords: z.number(),
    breakdown: SentimentBreakdownSchema,
    sentenceCount: z.number(),
});
export type SentimentResult = z.infer<typeof SentimentResultSchema>;

export const SentenceResultSchema = z.object({
    text: z.string(),
    score: z.number(),
    wordCount: z.number(),
    sentimentWordCount: z.number(),
    hasBut: z.boolean(),
});
export type SentenceResult = z.infer<typeof SentenceResultSchema>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function tokenizeForSentiment(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9'-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);
}

/**
 * Split text into sentences (handles .!? with basic abbreviation awareness).
 */
function splitSentences(text: string): string[] {
    return text
        .replace(/([.!?])\s+/g, '$1|||')
        .split('|||')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

// ---------------------------------------------------------------------------
// Sentence-level analysis (internal)
// ---------------------------------------------------------------------------

interface SentenceDetail {
    text: string;
    words: Array<{
        word: string;
        index: number;
        baseScore: number;
        adjustedScore: number;
        negated: boolean;
        intensified: boolean;
    }>;
    score: number;
    wordCount: number;
    sentimentWordCount: number;
    hasBut: boolean;
}

function analyzeSentenceInternal(
    sentence: string,
    lexicon: Record<string, number>,
    cfg: SentimentConfig,
): SentenceDetail {
    const words = tokenizeForSentiment(sentence);
    const sentimentWords: SentenceDetail['words'] = [];
    let totalScore = 0;
    let hasBut = false;
    let butIndex = -1;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        // But-clause detection
        if (BUT_WORDS.has(word)) {
            hasBut = true;
            butIndex = i;
            continue;
        }

        const baseScore = lexicon[word];
        if (baseScore === undefined) continue;

        let adjustedScore = baseScore;
        let negated = false;
        let intensified = false;

        // Negation window look-back
        for (let j = Math.max(0, i - cfg.negationWindow); j < i; j++) {
            if (NEGATORS.has(words[j])) {
                adjustedScore = baseScore * cfg.negationMultiplier;
                negated = true;
                break;
            }
        }

        // Intensifier look-back (only if not negated)
        if (!negated) {
            for (let j = Math.max(0, i - cfg.intensifierWindow); j < i; j++) {
                const mult = AMPLIFIERS[words[j]];
                if (mult !== undefined) {
                    adjustedScore = baseScore * mult;
                    intensified = true;
                    break;
                }
            }
        }

        sentimentWords.push({ word, index: i, baseScore, adjustedScore, negated, intensified });
        totalScore += adjustedScore;
    }

    // But-clause weighting
    if (hasBut && sentimentWords.length > 0) {
        const before = sentimentWords.filter(w => w.index < butIndex);
        const after = sentimentWords.filter(w => w.index > butIndex);
        const beforeScore = before.reduce((s, w) => s + w.adjustedScore, 0);
        const afterScore = after.reduce((s, w) => s + w.adjustedScore, 0);
        totalScore = beforeScore * cfg.butClauseWeightBefore + afterScore * cfg.butClauseWeightAfter;
    }

    return {
        text: sentence,
        words: sentimentWords,
        score: totalScore,
        wordCount: words.length,
        sentimentWordCount: sentimentWords.length,
        hasBut,
    };
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

function calculateBreakdown(details: SentenceDetail[]): SentimentBreakdown {
    let pos = 0, neg = 0, neut = 0;
    for (const d of details) {
        for (const w of d.words) {
            if (w.adjustedScore > 0) pos++;
            else if (w.adjustedScore < 0) neg++;
            else neut++;
        }
    }
    const total = pos + neg + neut;
    if (total === 0) return { positive: 0, negative: 0, neutral: 1 };
    return {
        positive: Math.round((pos / total) * 1000) / 1000,
        negative: Math.round((neg / total) * 1000) / 1000,
        neutral: Math.round((neut / total) * 1000) / 1000,
    };
}

function normalizeScore(totalScore: number, wordCount: number): number {
    if (wordCount === 0) return 0;
    const avg = totalScore / wordCount;
    // Sigmoid-like compression into [-1,1]
    const normalized = avg / (1 + Math.abs(avg) * 0.5);
    return Math.max(-1, Math.min(1, normalized));
}

function calculateConfidence(
    details: SentenceDetail[],
    totalWordCount: number,
    cfg: SentimentConfig,
): number {
    const sentimentWords = details.reduce((s, d) => s + d.sentimentWordCount, 0);
    const coverage = totalWordCount > 0 ? sentimentWords / totalWordCount : 0;
    let confidence = Math.min(1, coverage * 15);
    if (sentimentWords < cfg.minSentimentWords) {
        confidence *= cfg.lowCoverageConfidencePenalty;
    }
    return confidence;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze sentiment of text with sentence-level scoring.
 *
 * Features vs. the previous basic implementation:
 * - Sentence-level decomposition with per-sentence scores
 * - 3-word negation window (not just adjacent)
 * - Intensifier detection (very, extremely, etc.)
 * - But-clause weighting (content after "but" weighted 0.6 vs 0.4 before)
 * - Positive / negative / neutral breakdown percentages
 * - Coverage-based confidence scoring
 * - Sigmoid-like score normalization to [-1, 1]
 *
 * @param text - Text to analyze
 * @param lexicon - Optional custom lexicon (defaults to extended AFINN ~500 words)
 * @param config - Optional config overrides
 */
export function analyzeSentiment(
    text: string,
    lexicon: Record<string, number> = DEFAULT_LEXICON,
    config: Partial<SentimentConfig> = {},
): SentimentResult {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    if (!text || text.trim().length === 0) {
        return {
            score: 0, normalizedScore: 0, label: 'neutral', confidence: 0,
            wordCount: 0, sentimentWords: 0,
            breakdown: { positive: 0, negative: 0, neutral: 1 },
            sentenceCount: 0,
        };
    }

    const sentences = splitSentences(text);
    if (sentences.length === 0) {
        return {
            score: 0, normalizedScore: 0, label: 'neutral', confidence: 0,
            wordCount: 0, sentimentWords: 0,
            breakdown: { positive: 0, negative: 0, neutral: 1 },
            sentenceCount: 0,
        };
    }

    const details = sentences.map(s => analyzeSentenceInternal(s, lexicon, cfg));

    let totalScore = 0;
    let wordCount = 0;
    let sentimentWordCount = 0;
    for (const d of details) {
        totalScore += d.score;
        wordCount += d.wordCount;
        sentimentWordCount += d.sentimentWordCount;
    }

    const normalizedScore = normalizeScore(totalScore, wordCount);
    const breakdown = calculateBreakdown(details);
    const confidence = calculateConfidence(details, wordCount, cfg);

    let label: 'positive' | 'negative' | 'neutral';
    if (normalizedScore > 0.1) label = 'positive';
    else if (normalizedScore < -0.1) label = 'negative';
    else label = 'neutral';

    return {
        score: Math.round(totalScore * 100) / 100,
        normalizedScore: Math.round(normalizedScore * 1000) / 1000,
        label,
        confidence: Math.round(confidence * 1000) / 1000,
        wordCount,
        sentimentWords: sentimentWordCount,
        breakdown,
        sentenceCount: sentences.length,
    };
}

/**
 * Compare sentiment between two texts.
 */
export function compareSentiment(textA: string, textB: string): {
    aScore: number;
    bScore: number;
    difference: number;
    agreementLabel: 'agree' | 'disagree' | 'neutral';
} {
    const a = analyzeSentiment(textA);
    const b = analyzeSentiment(textB);
    const samePolarity = a.label === b.label || a.label === 'neutral' || b.label === 'neutral';
    return {
        aScore: a.normalizedScore,
        bScore: b.normalizedScore,
        difference: Math.abs(a.normalizedScore - b.normalizedScore),
        agreementLabel: samePolarity ? 'agree' : 'disagree',
    };
}

/**
 * Get a copy of the default lexicon (for extension by consumers).
 */
export function getDefaultLexicon(): Record<string, number> {
    return { ...DEFAULT_LEXICON };
}

/**
 * Analyze sentiment for each sentence independently.
 * Useful when callers need per-sentence granularity.
 */
export function analyzeSentences(
    text: string,
    lexicon: Record<string, number> = DEFAULT_LEXICON,
    config: Partial<SentimentConfig> = {},
): SentenceResult[] {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const sentences = splitSentences(text);
    return sentences.map(s => {
        const d = analyzeSentenceInternal(s, lexicon, cfg);
        return {
            text: d.text,
            score: d.score,
            wordCount: d.wordCount,
            sentimentWordCount: d.sentimentWordCount,
            hasBut: d.hasBut,
        };
    });
}

/**
 * Analyze sentiment for an article with separate title and body scoring.
 *
 * Combines scores with title weight 0.3 and body weight 0.7.
 */
export function analyzeArticleSentiment(
    title: string,
    body: string,
    lexicon: Record<string, number> = DEFAULT_LEXICON,
    config: Partial<SentimentConfig> = {},
): {
    title: SentimentResult;
    body: SentimentResult;
    combined: SentimentResult;
} {
    const titleResult = analyzeSentiment(title, lexicon, config);
    const bodyResult = analyzeSentiment(body, lexicon, config);

    const titleWeight = 0.3;
    const bodyWeight = 0.7;

    let combinedNorm: number;
    let combinedConf: number;
    let combinedBreakdown: SentimentBreakdown;

    if (title && body) {
        combinedNorm = titleResult.normalizedScore * titleWeight + bodyResult.normalizedScore * bodyWeight;
        combinedConf = titleResult.confidence * titleWeight + bodyResult.confidence * bodyWeight;
        combinedBreakdown = {
            positive: titleResult.breakdown.positive * titleWeight + bodyResult.breakdown.positive * bodyWeight,
            negative: titleResult.breakdown.negative * titleWeight + bodyResult.breakdown.negative * bodyWeight,
            neutral: titleResult.breakdown.neutral * titleWeight + bodyResult.breakdown.neutral * bodyWeight,
        };
    } else if (title) {
        combinedNorm = titleResult.normalizedScore;
        combinedConf = titleResult.confidence;
        combinedBreakdown = titleResult.breakdown;
    } else {
        combinedNorm = bodyResult.normalizedScore;
        combinedConf = bodyResult.confidence;
        combinedBreakdown = bodyResult.breakdown;
    }

    let label: 'positive' | 'negative' | 'neutral';
    if (combinedNorm > 0.1) label = 'positive';
    else if (combinedNorm < -0.1) label = 'negative';
    else label = 'neutral';

    const combined: SentimentResult = {
        score: Math.round((titleResult.score * titleWeight + bodyResult.score * bodyWeight) * 100) / 100,
        normalizedScore: Math.round(combinedNorm * 1000) / 1000,
        label,
        confidence: Math.round(combinedConf * 1000) / 1000,
        wordCount: titleResult.wordCount + bodyResult.wordCount,
        sentimentWords: titleResult.sentimentWords + bodyResult.sentimentWords,
        breakdown: combinedBreakdown,
        sentenceCount: titleResult.sentenceCount + bodyResult.sentenceCount,
    };

    return { title: titleResult, body: bodyResult, combined };
}
