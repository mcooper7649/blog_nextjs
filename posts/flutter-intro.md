---
title: Flutter Introduction
excerpt: Flutter lets you create mobile apps that are pixel perfect for any device. Let's go from zero to your first real widget tree.
image: flutter-main1.jpeg
isFeatured: true
date: '2022-05-05'
---

## What is Flutter?

![Flutter-HomePage](Flutter-main.png)

Flutter is Google's open-source UI framework for building natively compiled apps from a single Dart codebase — iOS, Android, web, and desktop all at once. Unlike React Native, Flutter doesn't bridge to native components at runtime. It ships its own rendering engine (Skia / Impeller) and draws every pixel itself, which means pixel-perfect consistency across platforms and consistently smooth 60/120 fps animations.

**Why consider Flutter over React Native?**

- No JavaScript bridge overhead — compiled Dart runs close to native speed.
- The same widget renders identically on iOS and Android, not translated to each platform's native equivalent.
- Hot reload is exceptionally fast even in large apps.
- The widget catalog is extensive and well-documented out of the box.

The trade-off: you'll write Dart (not JavaScript/TypeScript). Dart is a strongly-typed, class-based language that feels familiar if you've used Java, Kotlin, or C#. Most JS/TS developers pick it up in a few hours.

---

## Installation

Head to [docs.flutter.dev/get-started/install](https://docs.flutter.dev/get-started/install) and grab the SDK for your OS. After unpacking, add the `flutter/bin` directory to your PATH.

Verify everything is set up correctly:

```sh
flutter doctor
```

`flutter doctor` checks for Xcode (iOS), Android SDK, connected devices, and IDE plugins. You don't need all of them green — just the platforms you care about. At minimum you'll want one mobile emulator or a physical device.

---

## Create and run your first app

```sh
flutter create my_app
cd my_app
flutter run
```

`flutter create` scaffolds a counter demo. `flutter run` compiles, deploys to the connected device/emulator, and keeps a hot-reload connection open.

### Hot reload vs hot restart

| Command | What it does |
|---------|-------------|
| `r` (in the terminal) | **Hot reload** — injects new code, rebuilds the widget tree, preserves app state. Fastest. |
| `R` | **Hot restart** — restarts the app from scratch. Use when you add new state or change `main()`. |
| `q` | Quit the runner. |

---

## Project structure

```
my_app/
├── lib/
│   └── main.dart        ← Entry point and your entire app starts here
├── test/                ← Unit and widget tests
├── android/             ← Android-specific config (rarely edited directly)
├── ios/                 ← iOS-specific config
├── pubspec.yaml         ← Dependencies (like package.json)
└── pubspec.lock
```

Everything you build lives under `lib/`. Most apps grow into something like `lib/screens/`, `lib/widgets/`, `lib/models/`.

---

## The widget tree — Flutter's core concept

In Flutter, **everything is a widget**: text, images, padding, layout, even the app itself. You compose UIs by nesting widgets into a tree — similar to React's component tree, but more explicit about layout and spacing.

### StatelessWidget

A `StatelessWidget` renders based on the data it receives (constructor args) and never changes after that. Think of it like a pure React functional component with no `useState`.

```dart
import 'package:flutter/material.dart';

class GreetingCard extends StatelessWidget {
  final String name;

  const GreetingCard({super.key, required this.name});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Text(
          'Hello, $name!',
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
```

### StatefulWidget

When a widget needs to hold mutable state (e.g. a counter, a text field value, an animation), you use `StatefulWidget`. The widget class itself is lightweight; the actual state lives in a paired `State<T>` class.

```dart
class CounterWidget extends StatefulWidget {
  const CounterWidget({super.key});

  @override
  State<CounterWidget> createState() => _CounterWidgetState();
}

class _CounterWidgetState extends State<CounterWidget> {
  int _count = 0;

  void _increment() {
    setState(() {
      _count++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('Count: $_count', style: const TextStyle(fontSize: 32)),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _increment,
          child: const Text('Tap me'),
        ),
      ],
    );
  }
}
```

`setState()` tells Flutter to call `build()` again — analogous to `setState` in React class components.

---

## Common layout widgets

| Widget | Purpose | React analogy |
|--------|---------|--------------|
| `Column` | Stack children vertically | `flex-direction: column` |
| `Row` | Stack children horizontally | `flex-direction: row` |
| `Stack` | Overlap children | `position: absolute` |
| `Container` | Box model (padding, margin, decoration) | `<div>` with CSS |
| `Expanded` | Fill remaining space in a Row/Column | `flex: 1` |
| `SizedBox` | Fixed-size spacer | `width`/`height` on an empty `<div>` |
| `Padding` | Add padding around a child | `padding` on a wrapper `<div>` |
| `Center` | Center a child | `display: flex; align-items: center; justify-content: center` |

```dart
Row(
  mainAxisAlignment: MainAxisAlignment.spaceBetween,
  children: [
    const Icon(Icons.star, color: Colors.amber),
    Expanded(
      child: Text('Flutter is great', overflow: TextOverflow.ellipsis),
    ),
    TextButton(onPressed: () {}, child: const Text('Learn more')),
  ],
)
```

---

## Navigation between screens

Flutter uses a `Navigator` stack. Push a new screen, pop to go back:

```dart
// Navigate to a new screen
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => const DetailScreen()),
);

// Go back
Navigator.pop(context);
```

For larger apps, named routes or packages like `go_router` are recommended. But for small apps the `push/pop` pattern is perfectly fine.

---

## Adding packages

Open `pubspec.yaml` and add to the `dependencies` section:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0       # HTTP client
  shared_preferences: ^2.2.0  # Key-value storage
```

Then run:

```sh
flutter pub get
```

Browse the package ecosystem at [pub.dev](https://pub.dev).

---

## Build for release

```sh
# Android APK
flutter build apk --release

# iOS (requires macOS + Xcode)
flutter build ios --release

# Web
flutter build web
```

Release builds enable tree-shaking, ahead-of-time (AOT) compilation, and turn off assertions — your app will be noticeably faster than debug builds.

---

## Next steps

- Work through the [official Flutter codelabs](https://docs.flutter.dev/codelabs) — they're high quality and cover navigation, state, and animations.
- Try the [Flutter Widget of the Week](https://www.youtube.com/playlist?list=PLjxrf2q8roU23XGwz3Km7sQZFTdB996iG) YouTube series — short, focused videos on individual widgets.
- Look into **Riverpod** or **Bloc** once your app needs proper state management beyond `setState`.

Flutter is one of those tools where the first hour feels unfamiliar but by day two you're moving fast. Give it a real project and you'll see why it has such a passionate community.
