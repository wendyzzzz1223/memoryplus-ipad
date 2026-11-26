# Memory+ · iPad 5.0

[Open the live demo](https://wendyzzzz1223.github.io/memoryplus-ipad/)

## 5.0.5 update

- Complete English text for training prompts, timers, feedback, rules and gesture controls.
- Shared training headers keep titles, rule buttons and scores separate. Question audio uses an icon with an accessible label.
- Supplied grandmother gesture examples, including an updated rotation example against a plain white wall. Live hand tracking remains available.
- Home Activity padding and weekly report check-in card layout corrected.


A home-based cognitive support design prototype with Mahjong-inspired serious games, family reminiscence and camera-based everyday action practice.

面向家庭场景的认知支持交互原型，包含麻将严肃游戏、家庭回忆客厅、生活动作练习，以及中英文界面切换。

## Included in this version

- Elder-facing iPad interface, with touch and gesture training modes.
- Chinese and English interface options.
- Family messages, photo album and practice report views.
- Updated granddaughter sender label and the supplied family portrait.
- Layout corrections for English text, medicine reminders and check-in instructions.
- Message playback using the device's speech synthesis.

## Run locally

No package installation or build step is required. Start a static HTTP server from this folder, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Windows users with Python installed can also use `Start-Windows.bat`.

For camera features, use HTTPS on the deployed website or localhost for local development. Camera permission is requested when the user starts a camera activity.

## Upload and hosting

The repository root contains `index.html`, JavaScript, styles and all bundled assets. Upload the extracted files with their folders intact. Static hosting can serve this directory directly; no backend or build command is included. `edgeone.json` and `_headers` contain host-specific static asset settings.

## Prototype scope

This is a design and usability prototype. Practice summaries and sample family messages illustrate the intended experience. The code does not implement a production family account service or clinical record system. Some preferences are stored in the current browser.

## Assets

The project includes supplied family photographs, design artwork, fonts and bundled gesture runtime files. Repository visibility and any future reuse should respect the permissions for these assets. This package does not assign a new open-source license to them.
