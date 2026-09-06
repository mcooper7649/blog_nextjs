---
title: Flutter Introduction
excerpt: Flutter lets you create mobile apps that are pixel perfect for any device. Lets go over some basics together.
image: flutter-main1.jpeg
isFeatured: true
date: '2022-05-05'
---

## What is Flutter?

![Flutter](flutter-main1.jpeg)

Flutter is Google's open-source UI toolkit for building natively compiled apps for mobile (iOS and Android), web, and desktop from a single codebase. Unlike React Native, which bridges to native components, Flutter draws every pixel itself using its own rendering engine (Skia / Impeller). The result is pixel-perfect UIs that look identical on every platform and perform at 60–120 fps.

Apps are written in **Dart**, a typed language that compiles to native ARM code for mobile and to JavaScript for the web. If you know Java or JavaScript, Dart syntax will feel familiar within a day.

## Installation

Download the Flutter SDK from [flutter.dev](https://docs.flutter.dev/get-started/install) and add it to your `PATH`. Flutter bundles Dart, so you don't need a separate install.

After installing, run the doctor command to check for missing dependencies (Android Studio, Xcode, CocoaPods, etc.):

```sh
flutter doctor
```

A green checkmark next to Android toolchain and Chrome (for web) is the minimum to get started. Xcode is only required to build for iOS/macOS.

## Create and run your first app

```sh
# Create a new project
flutter create my_app

cd my_app

# Run on the first connected device or emulator
flutter run

# Run specifically in Chrome
flutter run -d chrome
```

Flutter hot-reloads on every save — press **r** in the terminal to hot-reload, **R** for a hot-restart, and **q** to quit.

## Understanding the entry point

Open `lib/main.dart`. Every Flutter app starts with `main()` and a root widget:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'My App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}
```

`MaterialApp` sets up routing, theming, and localization. The `home` parameter is your app's initial screen.

## StatelessWidget vs StatefulWidget

Flutter has two kinds of widgets. Use the right one from the start — it avoids unnecessary rebuilds.

### StatelessWidget — no changing data

```dart
class Greeting extends StatelessWidget {
  final String name;

  const Greeting({super.key, required this.name});

  @override
  Widget build(BuildContext context) {
    return Text(
      'Hello, $name!',
      style: const TextStyle(fontSize: 24),
    );
  }
}
```

### StatefulWidget — widget owns mutable state

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
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _increment,
          child: const Text('Increment'),
        ),
      ],
    );
  }
}
```

Call `setState()` whenever you change a field that should trigger a UI rebuild. Flutter will call `build()` again with the new values.

## Essential layout widgets

Flutter uses a widget tree for layout — there's no CSS. The most common layout widgets are:

| Widget | Purpose |
|--------|---------|
| `Column` | Stack children vertically |
| `Row` | Stack children horizontally |
| `Container` | Box model: padding, margin, color, border |
| `Expanded` | Flexibly fill remaining space inside a Row/Column |
| `SizedBox` | Fixed-size gap or explicit dimensions |
| `Padding` | Add padding around a child |
| `Center` | Center a child within its parent |

A typical screen scaffold:

```dart
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My App'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Welcome',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text('This is a Flutter app.'),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {},
                child: const Text('Get Started'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

## Rendering a list

For scrollable lists, use `ListView.builder` — it's lazy and only builds visible items:

```dart
class TaskList extends StatelessWidget {
  final List<String> tasks;

  const TaskList({super.key, required this.tasks});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: tasks.length,
      itemBuilder: (context, index) {
        return ListTile(
          leading: const Icon(Icons.check_circle_outline),
          title: Text(tasks[index]),
          trailing: const Icon(Icons.chevron_right),
        );
      },
    );
  }
}
```

## Navigation between screens

Flutter's `Navigator` works like a stack. Push to go forward, pop to go back:

```dart
// Navigate to a new screen
ElevatedButton(
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DetailPage(title: 'Item Detail'),
      ),
    );
  },
  child: const Text('View Detail'),
);

// In DetailPage, pop back
ElevatedButton(
  onPressed: () => Navigator.pop(context),
  child: const Text('Go Back'),
);
```

For apps with many screens, consider using **named routes** or the [go_router](https://pub.dev/packages/go_router) package for URL-based navigation.

## Useful Flutter commands

```sh
# List available devices and emulators
flutter devices

# Build a release APK for Android
flutter build apk --release

# Build an iOS app (requires macOS + Xcode)
flutter build ios --release

# Add a package from pub.dev
flutter pub add http

# Upgrade all packages
flutter pub upgrade

# Analyze code for warnings
flutter analyze

# Run tests
flutter test
```

## Next steps

- Browse [pub.dev](https://pub.dev) for packages — Flutter's ecosystem covers HTTP, state management, local storage, camera, maps, and more.
- For state management beyond `setState`, look at [Riverpod](https://riverpod.dev) (recommended for new projects) or [Provider](https://pub.dev/packages/provider).
- The [Flutter Widget Catalog](https://docs.flutter.dev/ui/widgets) is indispensable — bookmark it.

Flutter's "everything is a widget" model has a short learning curve once you internalize the layout system. The hot-reload loop makes iteration fast, and shipping to both iOS and Android from one codebase is genuinely satisfying once it clicks.
