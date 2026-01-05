// AI Post Detector for X
// Detects posts likely written by AI based on typographic markers

const AI_MARKERS = {
  // Em dash (humans typically type -- or -)
  emDash: { char: '\u2014', weight: 3, name: 'em dash' },

  // Curly/smart quotes (humans type straight quotes, but some platforms auto-convert)
  leftDoubleQuote: { char: '\u201C', weight: 1, name: 'left double quote' },    // "
  rightDoubleQuote: { char: '\u201D', weight: 1, name: 'right double quote' },  // "
  leftSingleQuote: { char: '\u2018', weight: 1, name: 'left single quote' },    // '
  rightSingleQuote: { char: '\u2019', weight: 1, name: 'right single quote' },  // ' (also apostrophe)

  // Fancy spaces and hyphens
  nonBreakingSpace: { char: '\u00A0', weight: 1, name: 'non-breaking space' },
  figureDash: { char: '\u2012', weight: 3, name: 'figure dash' },

  // Other markers
  primeDouble: { char: '\u2033', weight: 2, name: 'double prime' },
  primeSingle: { char: '\u2032', weight: 2, name: 'single prime' },

  // Ellipsis (humans type ..., AI outputs single char)
  ellipsis: { char: '\u2026', weight: 2, name: 'ellipsis' },

  // Math symbols (humans type x, -, AI uses proper symbols)
  minusSign: { char: '\u2212', weight: 3, name: 'minus sign' },
  multiplication: { char: '\u00D7', weight: 3, name: 'multiplication sign' },

  // Arrows (low weight since some humans use these)
  rightArrow: { char: '\u2192', weight: 1, name: 'right arrow' },
  leftArrow: { char: '\u2190', weight: 1, name: 'left arrow' },
};

// Threshold for highlighting (sum of weights)
const HIGHLIGHT_THRESHOLD = 4;

// Track processed tweets to avoid reprocessing
const processedTweets = new WeakSet();

/**
 * Analyze text for AI markers and return score + details
 */
function analyzeText(text) {
  // Strip URLs to avoid false positives (X truncates URLs with ellipsis)
  const textWithoutUrls = text.replace(/https?:\/\/\S+/g, '').replace(/\S+\.\S+\/\S*/g, '');

  const findings = [];
  let totalScore = 0;

  for (const [key, marker] of Object.entries(AI_MARKERS)) {
    const regex = new RegExp(marker.char, 'g');
    const matches = textWithoutUrls.match(regex);
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
 * Create tooltip element from findings
 */
function createTooltipElement(findings) {
  const tooltip = document.createElement('div');
  tooltip.className = 'ai-detector-tooltip';

  for (const finding of findings) {
    const row = document.createElement('div');
    row.className = 'ai-detector-tooltip-row';
    row.innerHTML = `
      <span>${finding.marker} <span class="ai-detector-tooltip-char">${finding.char}</span></span>
      <span>${finding.count}× (+${finding.score})</span>
    `;
    tooltip.appendChild(row);
  }

  return tooltip;
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
      // Apply highlight styles directly via inline styles (X's React resets classes)
      tweet.style.setProperty('border-left', '3px solid #ff6b35', 'important');
      tweet.style.setProperty('background', 'linear-gradient(90deg, rgba(255, 107, 53, 0.15) 0%, transparent 50%)', 'important');

      // Add score badge
      const existingBadge = tweet.querySelector('.ai-detector-badge');
      if (!existingBadge) {
        const badge = document.createElement('div');
        badge.className = 'ai-detector-badge';
        badge.textContent = `AI: ${totalScore}`;

        // Add tooltip element
        badge.appendChild(createTooltipElement(findings));

        // Add intensity class based on score
        if (totalScore >= 10) {
          badge.classList.add('ai-detector-high');
        } else if (totalScore >= 6) {
          badge.classList.add('ai-detector-medium');
        } else {
          badge.classList.add('ai-detector-low');
        }

        // Insert badge at the bottom of the tweet
        tweet.appendChild(badge);
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
