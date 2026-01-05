// AI Post Detector for X
// Detects posts likely written by AI based on typographic markers

const AI_MARKERS = {
  // Em dash (humans typically type -- or -)
  emDash: { char: '—', weight: 3, name: 'em dash' },
  enDash: { char: '–', weight: 2, name: 'en dash' },

  // Curly/smart quotes (humans type straight quotes)
  leftDoubleQuote: { char: '"', weight: 2, name: 'left double quote' },
  rightDoubleQuote: { char: '"', weight: 2, name: 'right double quote' },
  leftSingleQuote: { char: ''', weight: 2, name: 'left single quote' },
  rightSingleQuote: { char: ''', weight: 1, name: 'right single quote' }, // Can be apostrophe

  // Other typographic characters
  ellipsis: { char: '…', weight: 2, name: 'ellipsis character' },
  bullet: { char: '•', weight: 1, name: 'bullet point' },

  // Fancy spaces and hyphens
  nonBreakingSpace: { char: '\u00A0', weight: 1, name: 'non-breaking space' },
  figureDash: { char: '‒', weight: 3, name: 'figure dash' },

  // Other markers
  primeDouble: { char: '″', weight: 2, name: 'double prime' },
  primeSingle: { char: '′', weight: 2, name: 'single prime' },
};

// Threshold for highlighting (sum of weights)
const HIGHLIGHT_THRESHOLD = 4;

// Track processed tweets to avoid reprocessing
const processedTweets = new WeakSet();

/**
 * Analyze text for AI markers and return score + details
 */
function analyzeText(text) {
  const findings = [];
  let totalScore = 0;

  for (const [key, marker] of Object.entries(AI_MARKERS)) {
    const regex = new RegExp(marker.char, 'g');
    const matches = text.match(regex);
    if (matches) {
      const count = matches.length;
      const score = count * marker.weight;
      totalScore += score;
      findings.push({
        marker: marker.name,
        char: marker.char,
        count,
        score
      });
    }
  }

  return { totalScore, findings };
}

/**
 * Create tooltip content from findings
 */
function createTooltipContent(findings, totalScore) {
  const lines = ['AI Detection Score: ' + totalScore];
  lines.push('─'.repeat(25));

  for (const finding of findings) {
    lines.push(`${finding.marker}: ${finding.count}× (${finding.char})`);
  }

  return lines.join('\n');
}

/**
 * Find and process all tweets on the page
 */
function processTweets() {
  // X/Twitter uses article elements for tweets
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');

  tweets.forEach(tweet => {
    if (processedTweets.has(tweet)) return;
    processedTweets.add(tweet);

    // Find the tweet text container
    const tweetTextElement = tweet.querySelector('[data-testid="tweetText"]');
    if (!tweetTextElement) return;

    const text = tweetTextElement.textContent || '';
    const { totalScore, findings } = analyzeText(text);

    if (totalScore >= HIGHLIGHT_THRESHOLD) {
      // Add highlight class to the tweet
      tweet.classList.add('ai-detector-highlighted');

      // Add score badge
      const existingBadge = tweet.querySelector('.ai-detector-badge');
      if (!existingBadge) {
        const badge = document.createElement('div');
        badge.className = 'ai-detector-badge';
        badge.textContent = `AI: ${totalScore}`;
        badge.title = createTooltipContent(findings, totalScore);

        // Add intensity class based on score
        if (totalScore >= 10) {
          badge.classList.add('ai-detector-high');
        } else if (totalScore >= 6) {
          badge.classList.add('ai-detector-medium');
        } else {
          badge.classList.add('ai-detector-low');
        }

        // Insert badge at the top of the tweet
        const firstChild = tweet.firstChild;
        if (firstChild) {
          tweet.insertBefore(badge, firstChild);
        } else {
          tweet.appendChild(badge);
        }
      }
    }
  });
}

/**
 * Set up mutation observer to handle dynamically loaded tweets
 */
function setupObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
        break;
      }
    }

    if (shouldProcess) {
      // Debounce processing
      clearTimeout(window.aiDetectorTimeout);
      window.aiDetectorTimeout = setTimeout(processTweets, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initial processing
processTweets();

// Set up observer for dynamic content
setupObserver();

// Also process on scroll (backup for infinite scroll)
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(processTweets, 200);
}, { passive: true });

console.log('AI Post Detector for X loaded');
