---
title: 'Flutter for Beginners: Widgets, State, and Your First Real App'
excerpt: Flutter lets you ship pixel-perfect mobile apps from a single Dart codebase. Here is everything I wish I had known before I wrote my first widget.
image: flutter-main1.jpeg
isFeatured: true
date: '2026-08-30'
---

Flutter is one of those frameworks that genuinely surprised me. Coming from a web background, I expected the usual friction of native mobile development — project setup, platform-specific quirks, slow rebuild cycles. What I got instead was hot reload, a rich widget library, and a single codebase that runs on iOS, Android, web, and desktop. This post is the intro I wish I had found when I started.

## What Flutter Actually Is

Flutter is Google's UI toolkit built on **Dart**, a statically typed language that compiles to native ARM code for mobile, JavaScript for web, and native executables for desktop. Unlike React Native, which bridges to native components, Flutter draws its own pixels using the Skia/Impeller rendering engine. That means your UI looks identical on every platform — no OS-specific rendering surprises.

Key properties that make Flutter distinct:

- **Everything is a widget** — layout, styling, state, animation — all expressed as composable widgets.
- **Hot reload** keeps your app running while you edit code; changes appear in under a second.
- **Dart is approachable** — if you know TypeScript, Dart will feel familiar within an afternoon.

## Installation

Download Flutter from [flutter.dev](https://flutter.dev/docs/get-started/install) for your OS. After unzipping and adding the `bin/` directory to your `PATH`, run the doctor:

```sh
flutter doctor
```

The output will tell you exactly what's missing — Xcode for iOS, Android Studio for Android, Chrome for web. Fix the items marked with a red ✗ and re-run until everything is green (or at least the platforms you care about are green).

```
Doctor summary (to see all details, run flutter doctor -v):
[✓] Flutter (Channel stable, 3.24.x, on macOS)
[✓] Android toolchain - develop for Android devices
[✓] Xcode - develop for iOS and macOS
[✓] Chrome - develop for the web
[✓] Android Studio (version 2024.x)
[✓] VS Code (version 1.93.x)
```

## Create and Run Your First App

```sh
flutter create my_first_app
cd my_first_app
flutter run
```

Flutter will ask which device to target if more than one is available. For a quick check, the web target requires no simulators:

```sh
flutter run -d chrome
```

## Everything Is a Widget

This is the mental model that makes Flutter click. A Flutter UI is a **tree of widgets**. Widgets are not mutable objects you update in place — they are lightweight configuration objects. When state changes, Flutter rebuilds the relevant subtree and diffs the result against the previous tree to compute minimal updates.

There are two kinds of widgets:

### StatelessWidget

Use this when your widget has no mutable state — it renders purely from the constructor arguments passed in.

```dart
import 'package:flutter/material.dart';

class GreetingCard extends StatelessWidget {
  final String name;
  final String message;

  const GreetingCard({
    super.key,
    required this.name,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hello, $name!',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(message),
          ],
        ),
      ),
    );
  }
}
```

### StatefulWidget

Use this when the widget needs to track mutable state — a counter, a text field value, an animation controller.

A `StatefulWidget` is always two classes: the widget itself (immutable) and its `State` object (mutable).

```dart
import 'package:flutter/material.dart';

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
        Text(
          'Count: $_count',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
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

The key rule: **always mutate state inside `setState()`**. Mutating `_count` directly would update the value but not trigger a rebuild, so the UI would stay stale.

## A Minimal Real App

Let me put these pieces together into a full runnable app — a simple task list.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const TaskApp());
}

class TaskApp extends StatelessWidget {
  const TaskApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Task List',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const TaskListScreen(),
    );
  }
}

class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  final List<String> _tasks = [];
  final TextEditingController _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose(); // always dispose controllers
    super.dispose();
  }

  void _addTask() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _tasks.add(text);
      _controller.clear();
    });
  }

  void _removeTask(int index) {
    setState(() => _tasks.removeAt(index));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Tasks')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'New task...',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _addTask(),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _addTask,
                  child: const Text('Add'),
                ),
              ],
            ),
          ),
          Expanded(
            child: _tasks.isEmpty
                ? const Center(child: Text('No tasks yet. Add one above.'))
                : ListView.builder(
                    itemCount: _tasks.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        title: Text(_tasks[index]),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _removeTask(index),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
```

Paste this into `lib/main.dart`, run `flutter run`, and you have a working task list in under 90 lines.

## Navigation

Push a new screen by wrapping it in a `MaterialPageRoute` and calling `Navigator.push`:

```dart
// navigate to a detail screen
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => DetailScreen(task: _tasks[index]),
  ),
);

// come back
Navigator.pop(context);
```

For larger apps with named routes, declare them in `MaterialApp`:

```dart
MaterialApp(
  routes: {
    '/': (context) => const TaskListScreen(),
    '/settings': (context) => const SettingsScreen(),
  },
  initialRoute: '/',
);
```

Then navigate with `Navigator.pushNamed(context, '/settings')`.

## Common Widgets to Know

| Widget | Purpose |
|--------|---------|
| `Scaffold` | Page skeleton — AppBar, body, FAB, Drawer |
| `Column` / `Row` | Linear layout along vertical / horizontal axis |
| `Expanded` | Takes remaining space inside a Column/Row |
| `Padding` | Adds inset around a child widget |
| `Container` | Box model — size, color, border, padding, margin |
| `Text` | Renders text with optional `TextStyle` |
| `ElevatedButton` | Material 3 button |
| `TextField` | Single-line text input |
| `ListView.builder` | Efficiently renders long lists |
| `Image.network` | Loads an image from a URL |
| `CircularProgressIndicator` | Loading spinner |

## State Management Beyond `setState`

`setState` works well for local, widget-scoped state. Once you need to share state across screens, reach for a dedicated solution. My recommendation for beginners is **Provider** (officially endorsed by the Flutter team), and for larger apps **Riverpod** (which fixes Provider's main rough edges).

A quick Provider example (add `provider: ^6.1.0` to `pubspec.yaml`):

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// 1. Define your model — extend ChangeNotifier
class TaskModel extends ChangeNotifier {
  final List<String> _tasks = [];
  List<String> get tasks => List.unmodifiable(_tasks);

  void add(String task) {
    _tasks.add(task);
    notifyListeners(); // triggers rebuild in listening widgets
  }

  void remove(int index) {
    _tasks.removeAt(index);
    notifyListeners();
  }
}

// 2. Provide it above the widget tree
void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => TaskModel(),
      child: const TaskApp(),
    ),
  );
}

// 3. Consume it anywhere below
class TaskCount extends StatelessWidget {
  const TaskCount({super.key});

  @override
  Widget build(BuildContext context) {
    final count = context.watch<TaskModel>().tasks.length;
    return Text('$count tasks');
  }
}
```

## What to Learn Next

Once you are comfortable with the basics above, the Flutter learning path looks roughly like this:

1. **Animations** — `AnimatedContainer`, `AnimationController`, and the `animation` package for more complex sequences.
2. **Async data** — `FutureBuilder` and `StreamBuilder` for fetching from REST APIs or Firestore.
3. **Riverpod or Bloc** — for complex app-wide state.
4. **Platform channels** — call native Swift/Kotlin code from Dart when you need hardware access Flutter doesn't wrap yet.
5. **Flutter web/desktop** — the same codebase with layout adaptations for larger screens using `LayoutBuilder`.

The [official Flutter docs](https://docs.flutter.dev) are genuinely good and kept up to date. The [Flutter cookbook](https://docs.flutter.dev/cookbook) is a searchable collection of common patterns — bookmark it.

Flutter has become my go-to for mobile projects where I want a single codebase without sacrificing UI fidelity. Give the task list above a spin and see how quickly things click into place.
