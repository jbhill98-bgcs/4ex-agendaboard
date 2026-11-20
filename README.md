# 4 Example Classroom Board

A customizable digital whiteboard for the classroom. It runs in Safari or Chrome on an iPad or laptop and can be AirPlayed or Screen Mirrored to a TV.

**Open the board:** https://jbhill98-bgcs.github.io/4ex-agendaboard/

## What's here
- `index.html`: the whole app in one file. This is what GitHub Pages serves.
- `src/`: the source (styles, board core, widgets).
- `vendor/qrcode.js`: qrcode-generator 1.4.4 by Kazuhiko Arase (MIT License), used for the QR code widget.
- `build.py`: rebuilds `index.html` from `src/` (`python3 build.py`).

## Notes
- Boards, saved boards and class lists are stored in the browser on each device. Nothing is sent to a server.
- Use Boards › Export / Import to move a board between devices or share one with a colleague.
