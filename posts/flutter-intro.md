---
title: 'Flutter: Build Cross-Platform Apps with Dart'
excerpt: Flutter lets you ship pixel-perfect mobile, web, and desktop apps from a single Dart codebase. This guide walks through the essentials — widgets, state, navigation, and your first real app.
image: flutter-main1.jpeg
isFeatured: true
date: '2026-09-05'
---

![Flutter-HomePage](Flutter-main.png)

Flutter is Google's UI toolkit for building natively compiled apps across mobile, web, and desktop from a single codebase. Unlike React Native (which renders to native components), Flutter ships its own rendering engine (Impeller) and draws every pixel itself — which means pixel-perfect consistency across iOS, Android, web, and desktop without per-platform quirks.

I first picked it up when I wanted to ship an Android app without learning Kotlin from scratch, and the hot-reload workflow alone makes it worth exploring.

## Why Flutter?

- **One codebase, six platforms** — iOS, Android, Web, Windows, macOS, Linux.
- **Dart is surprisingly approachable** — typed, async-first, and compiles to ARM native code or JavaScript.
- **Rich widget library** — Material and Cupertino widgets out of the box, with full customisation.
- **Hot reload** — see UI changes in under a second without losing state.

## Installing Flutter

Head to [docs.flutter.dev/get-started/install](https://docs.flutter.dev/get-started/install) and pick your OS. Then verify:

```sh
flutter doctor
```

`flutter doctor` lists any missing dependencies (Android SDK, Xcode, etc.) and tells you exactly what to install. Fix everything it flags before continuing.

## Create and Run Your First App

```sh
flutter create todo_app
cd todo_app
flutter run
```

This launches the default counter app on whatever device or emulator `flutter devices` shows. Press `r` in the terminal for hot reload, `R` for hot restart.

## Dart in 5 Minutes

Flutter uses Dart. Here's the 20% you'll use 80% of the time:

```dart
// Typed variables
String name = 'Michael';
int count = 0;
bool isDone = false;
double pi = 3.14;

// Type inference
var message = 'Hello, Flutter!'; // String inferred

// Null safety — ? means nullable
String? maybeNull = null;
String notNull = maybeNull ?? 'default'; // null-coalescing operator

// Functions
int add(int a, int b) => a + b; // arrow syntax for single expressions

// Named parameters (very common in Flutter widgets)
void greet({required String name, String greeting = 'Hello'}) {
  print('$greeting, $name!');
}
greet(name: 'Michael'); // Hello, Michael!

// Async / await — same mental model as JavaScript
Future<String> fetchUser() async {
  await Future.delayed(Duration(seconds: 1));
  return 'Michael';
}
```

Classes in Dart are straightforward — they're similar to Kotlin or TypeScript:

```dart
class Task {
  final String title;
  bool isDone;

  Task({required this.title, this.isDone = false});

  void toggle() => isDone = !isDone;
}
```

## Everything Is a Widget

In Flutter, *everything* is a widget — buttons, text, layout, padding, the app itself. Widgets are immutable descriptions of a piece of the UI. Flutter builds a widget tree, diffs it, and applies only the changes — similar to how React diffs a virtual DOM.

There are two kinds of widgets:

| Type | When to use |
|---|---|
| `StatelessWidget` | Depends only on its constructor arguments — pure display |
| `StatefulWidget` | Needs mutable state that can change over time |

## Stateless Widget

```dart
import 'package:flutter/material.dart';

class GreetingCard extends StatelessWidget {
  final String name;

  const GreetingCard({super.key, required this.name});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          'Hello, $name!',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
    );
  }
}
```

Use it just like a component: `GreetingCard(name: 'Michael')`.

## Stateful Widget — A Real Todo List

This is where Flutter clicks for most people. A `StatefulWidget` splits into the widget itself (immutable config) and a `State` object (mutable data):

```dart
import 'package:flutter/material.dart';

class Task {
  final String title;
  bool isDone;
  Task({required this.title, this.isDone = false});
}

class TodoList extends StatefulWidget {
  const TodoList({super.key});

  @override
  State<TodoList> createState() => _TodoListState();
}

class _TodoListState extends State<TodoList> {
  final List<Task> _tasks = [];
  final TextEditingController _controller = TextEditingController();

  void _addTask() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _tasks.add(Task(title: text));
      _controller.clear();
    });
  }

  void _toggleTask(int index) {
    setState(() {
      _tasks[index].isDone = !_tasks[index].isDone;
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Todos')),
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
                      hintText: 'Add a task…',
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
            child: ListView.builder(
              itemCount: _tasks.length,
              itemBuilder: (context, index) {
                final task = _tasks[index];
                return ListTile(
                  leading: Checkbox(
                    value: task.isDone,
                    onChanged: (_) => _toggleTask(index),
                  ),
                  title: Text(
                    task.title,
                    style: TextStyle(
                      decoration: task.isDone
                          ? TextDecoration.lineThrough
                          : TextDecoration.none,
                    ),
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

Key points:
- **`setState()`** tells Flutter to rebuild the widget with updated data — same idea as React's `useState` setter.
- **`dispose()`** cleans up the `TextEditingController` when the widget leaves the tree — equivalent to a `useEffect` cleanup.
- **`ListView.builder`** is lazy — it only builds items that are visible, great for long lists.

## Navigation

Flutter uses a `Navigator` to push and pop routes, similar to a browser's history stack:

```dart
// Push a new screen
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => const DetailScreen()),
);

// Go back
Navigator.pop(context);

// Pass data forward
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => DetailScreen(taskTitle: task.title),
  ),
);

// Return data when popping
final result = await Navigator.push<String>(
  context,
  MaterialPageRoute(builder: (_) => const EditScreen()),
);
// result is whatever EditScreen passed to Navigator.pop(context, 'saved')
```

For larger apps, look into named routes (`Navigator.pushNamed`) or the `go_router` package for URL-based navigation.

## Wiring It All Together — `main.dart`

```dart
import 'package:flutter/material.dart';
import 'todo_list.dart'; // the widget we wrote above

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Todo App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const TodoList(),
    );
  }
}
```

## Hot Reload vs Hot Restart

| | Hot Reload (`r`) | Hot Restart (`R`) |
|---|---|---|
| Speed | ~1 second | ~3–5 seconds |
| State preserved | ✅ Yes | ❌ No |
| Use when | Tweaking UI | Changing `initState` or `main()` |

Hot reload is the killer feature — you edit code, save, and see the change instantly without losing where you are in the app.

## What to Learn Next

Once you're comfortable with `StatefulWidget`, the natural next step is a proper state-management solution for larger apps:

- **Provider** — lightweight, official recommendation for small-medium apps.
- **Riverpod** — a safer, testable evolution of Provider.
- **Bloc / Cubit** — more structured, good for teams.

For persistent storage, check out `shared_preferences` (key-value store) or `sqflite` (SQLite on device).

Flutter's documentation at [docs.flutter.dev](https://docs.flutter.dev) is genuinely excellent — the Widget Catalog alone is worth bookmarking.
