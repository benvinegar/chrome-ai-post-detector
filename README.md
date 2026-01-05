# AI Post Detector for X

A Chrome extension that highlights posts on X (Twitter) that may be AI-generated, based on typographic markers that LLMs commonly produce.

<img width="1166" height="506" alt="image" src="https://github.com/user-attachments/assets/2d72f16e-1258-45a7-92ac-dd1efc620c35" />

## How it works

When humans type on keyboards, we use simple characters: straight quotes (`"`), hyphens (`-`), and three periods (`...`). But LLMs output typographically "correct" characters like curly quotes (`""`), em dashes (`—`), and proper ellipsis (`…`).

This extension scans posts for these telltale characters and highlights posts that contain multiple markers.

### Detection markers

| Strength | Characters | Why it's a signal |
|----------|------------|-------------------|
| Strong | Non-breaking space, middle dot (`·`), figure dash, minus sign (`−`), multiplication (`×`) | Rarely typed by humans |
| Medium | Em dash (`—`), prime symbols (`′` `″`) | Uncommon in casual typing |
| Weak | Ellipsis (`…`), curly quotes (`""` `''`) | Some platforms auto-convert these |
| Very weak | Arrows (`→` `←`) | Sometimes used by humans |

Posts are highlighted when their combined score reaches threshold (4+).

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. Navigate to X.com - detected posts will be highlighted with an orange indicator

## Usage

- Posts suspected of being AI-generated show an orange left border and "AI: N" badge
- Hover over the badge to see which specific markers were detected
- The number represents the total weight of detected markers

## Limitations

- This is heuristic-based detection, not definitive proof
- Some humans use tools that auto-convert characters (e.g., smart quotes)
- Some AI-generated content may not contain these markers
- False positives and negatives will occur

## Privacy

This extension runs entirely locally. No data is sent to any server.

## License

MIT
