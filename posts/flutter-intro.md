---
title: Flutter Introduction
excerpt: Flutter lets you create pixel-perfect mobile apps from a single codebase. Here's a practical intro covering widgets, state, and your first real app.
image: flutter-main1.jpeg
isFeatured: true
date: '2022-05-05'
---

## What is Flutter?

Flutter is Google's open-source UI toolkit for building natively compiled apps from a single codebase — iOS, Android, web, and desktop. You write in Dart, a clean typed language that feels familiar if you know JavaScript or Kotlin.

Unlike React Native (which bridges to native components), Flutter renders every pixel itself using its own Skia/Impeller engine. That means consistent appearance across platforms and no "bridge" overhead.

## Installation

Install the Flutter SDK for your platform from the [official install page](https://docs.flutter.dev/get-started/install).

After installing, run the doctor to confirm everything is wired up:

```sh
flutter doctor
```

You'll see a checklist of any missing dependencies (Android Studio, Xcode, etc.). Fix the flagged items before continuing.

## Create and Run Your First App

```sh
flutter create my_app
cd my_app
flutter run
```

`flutter create` scaffolds the project. `flutter run` builds and launches on your connected device or simulator. While the app is running, press **r** to hot-reload or **R** to hot-restart without losing state.

## Understanding the Widget Tree

Everything in Flutter is a widget — buttons, text, padding, layouts, even the app itself. You compose UIs by nesting widgets:

```dart
MaterialApp(
  home: Scaffold(
    appBar: AppBar(title: const Text('Hello Flutter')),
    body: const Center(
      child: Text('Hello, world!'),
    ),
  ),
)
```

Flutter builds a **widget tree** from these nested calls, then turns it into an **element tree** and finally a **render tree** that gets drawn to screen. You normally only think about the widget tree.

## StatelessWidget vs StatefulWidget

These are the two fundamental widget types.

**StatelessWidget** — use when the UI depends only on inputs (constructor args) and never changes after being built:

```dart
class Greeting extends StatelessWidget {
  final String name;
  const Greeting({super.key, required this.name});

  @override
  Widget build(BuildContext context) {
    return Text('Hello, $name!');
  }
}
```

**StatefulWidget** — use when the widget needs to manage mutable state. Flutter's canonical counter example:

```dart
class Counter extends StatefulWidget {
  const Counter({super.key});

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
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
        ElevatedButton(
          onPressed: _increment,
          child: const Text('Increment'),
        ),
      ],
    );
  }
}
```

The key rule: **always call `setState()`** when you mutate state inside a `StatefulWidget`. That's what tells Flutter to re-run `build()` and update the screen.

## Essential Layout Widgets

Flutter's layout is done entirely in code — no XML or CSS. The widgets you'll reach for most often:

| Widget | Purpose |
|--------|---------|
| `Container` | Box with optional padding, margin, color, or decoration |
| `Row` | Horizontal flex layout |
| `Column` | Vertical flex layout |
| `SizedBox` | Fixed-size spacer or dimension constraint |
| `Expanded` | Takes remaining space inside a Row/Column |
| `Padding` | Adds inset spacing around a child |
| `Center` | Centers its child |

A common pattern: `Column` with `Expanded` children to fill the screen, and `SizedBox` for gaps:

```dart
Column(
  children: [
    const Text('Header', style: TextStyle(fontSize: 24)),
    const SizedBox(height: 16),
    Expanded(child: ListView(children: [/* items */])),
  ],
)
```

## Hot Reload vs Hot Restart

One of Flutter's best developer experience features:

- **Hot reload (r)** — injects updated Dart code and rebuilds the widget tree. State is preserved. Most changes land in under a second.
- **Hot restart (R)** — restarts the app from scratch with fresh state. Needed when you change `main()`, `initState()`, or add a new package.

For most UI tweaks, hot reload is instant feedback without losing where you are in the app.

## Next Steps

Once you have the basics down, the Flutter ecosystem has solid answers for common app needs:

- **State management**: start with `StatefulWidget` + `setState`, then graduate to [Riverpod](https://riverpod.dev) or [Bloc](https://bloclibrary.dev) as your app grows.
- **Navigation**: Flutter 2+ has the declarative `Router` API via [go_router](https://pub.dev/packages/go_router).
- **HTTP**: use the [http](https://pub.dev/packages/http) package or [dio](https://pub.dev/packages/dio) for interceptors.
- **Local storage**: [shared_preferences](https://pub.dev/packages/shared_preferences) for key-value, [sqflite](https://pub.dev/packages/sqflite) for SQLite.

The [Flutter cookbook](https://docs.flutter.dev/cookbook) is genuinely excellent — it has copy-pasteable recipes for networking, navigation, forms, and animation.
