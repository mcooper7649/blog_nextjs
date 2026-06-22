---
title: 'Kotlin + Jetpack Compose: Build Your First Android Screen Without XML'
date: '2026-06-22'
image: cover.jpg
excerpt: Jetpack Compose replaces XML layouts with plain Kotlin functions. Here is a practical intro — composables, state, and a working todo list — that gets you productive fast.
isFeatured: false
belt: yellow
---

Traditional Android development means XML layout files, `findViewById`, `RecyclerView.Adapter`, and constant context-switching between Kotlin and markup. Jetpack Compose replaces that with Kotlin functions. If you've built UIs with components, state, and unidirectional data flow, most of those ideas carry over directly.

This post walks through the fundamentals with working code you can drop straight into a new project.

## What Compose Actually Is

Compose is Android's modern UI toolkit. Instead of describing your screen in XML and then manipulating it imperatively from Kotlin, you write **composable functions** that describe what the UI should look like given the current state. When state changes, Compose re-runs ("recomposes") the affected functions and updates only the parts of the screen that changed.

The mental model is the same one React popularized on the web: `UI = f(state)`.

## Setting Up

Create a new project in Android Studio and pick the **"Empty Activity"** template, which uses Compose in current versions. Your `build.gradle.kts` will have dependencies like these (versions will differ), and the Delete icon used later needs `material-icons-core`:

```kotlin
dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-core")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")
    implementation("androidx.activity:activity-compose:1.9.0")
}
```

The BOM (Bill of Materials) keeps all Compose library versions in sync — just update the BOM version and everything follows.

## Your First Composable Function

Any function annotated with `@Composable` can emit UI. The simplest example:

```kotlin
@Composable
fun Greeting(name: String) {
    Text(
        text = "Hello, $name!",
        style = MaterialTheme.typography.headlineMedium
    )
}
```

Functions compose by nesting — `Column`, `Row`, and `Box` are built-in layout composables:

```kotlin
@Composable
fun ProfileCard(name: String, role: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(text = name, style = MaterialTheme.typography.titleLarge)
        Text(text = role, style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
    }
}
```

`Modifier` is how you apply padding, size, background, click handlers, and more — it chains like a builder, applies in order, and that order matters (padding before background gives a different result than padding after).

## State with `remember` and `mutableStateOf`

Compose tracks state with `mutableStateOf`. Wrap it in `remember` so the value survives recompositions:

```kotlin
@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(32.dp)
    ) {
        Text(text = "Count: $count", style = MaterialTheme.typography.displaySmall)
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = { count++ }) {
            Text("Increment")
        }
    }
}
```

The `by` keyword uses Kotlin property delegation — it lets you read and write `count` directly instead of going through `count.value`. Either style works; `by` keeps the code a little cleaner.

If you need state to survive a screen rotation, swap `remember` for `rememberSaveable`. It automatically saves and restores primitive types; for complex objects, pass a `Saver`.

## A Practical Example: Mini Todo List

Here is a small but complete example with a `TextField`, a list, and a delete action — the kind of thing that would have taken real boilerplate in the View system:

```kotlin
@Composable
fun TodoScreen() {
    var input by remember { mutableStateOf("") }
    val tasks = remember { mutableStateListOf<String>() }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                label = { Text("New task") },
                modifier = Modifier.weight(1f)
            )
            Button(
                onClick = {
                    if (input.isNotBlank()) {
                        tasks.add(input.trim())
                        input = ""
                    }
                }
            ) {
                Text("Add")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            // import androidx.compose.foundation.lazy.items
            items(tasks) { task ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = task, modifier = Modifier.weight(1f))
                        IconButton(onClick = { tasks.remove(task) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete")
                        }
                    }
                }
            }
        }
    }
}
```

`LazyColumn` is Compose's equivalent of `RecyclerView` — it only renders items that are visible on screen. For static short lists you can use `Column` + `forEach`, but `LazyColumn` is the right default for anything that could grow.

`mutableStateListOf` gives you an observable list — mutations (add, remove) automatically trigger recomposition for any composable that reads from it.

## Live Previews with `@Preview`

One of Compose's best quality-of-life features is the `@Preview` annotation. Add it to any zero-argument composable and Android Studio renders it in the IDE without running an emulator:

```kotlin
@Preview(showBackground = true)
@Composable
fun TodoScreenPreview() {
    MaterialTheme {
        TodoScreen()
    }
}
```

You can stack multiple `@Preview` annotations to see dark/light mode, different font scales, or simulated device sizes side by side.

## Hoisting State

As your screens grow, you will want to "hoist" state up to a parent and pass it down as parameters. This makes composables easier to test and reuse:

```kotlin
// Stateless — easy to test and preview
@Composable
fun TodoList(
    items: List<String>,
    onDelete: (String) -> Unit
) { /* ... */ }

// Stateful — owns the list, passes it down
@Composable
fun TodoScreen() {
    val items = remember { mutableStateListOf<String>() }
    TodoList(items = items, onDelete = { items.remove(it) })
}
```

The convention is to keep composables as stateless as possible and push state to the edges.

## Why This Approach Works

Compose removes a lot of the old ceremony: no adapters, no `notifyDataSetChanged`, and no hunting through XML to find which view a Kotlin file is referencing. The reactive model — state changes, UI follows — keeps the logic in one place.

There is still a learning curve, but if you have built anything with React or SwiftUI, the concepts will feel familiar. If you are starting from scratch, the official Compose docs are a good next stop.

The best way in is to build something small. Start with the counter, extend it to the todo list, then add ViewModel + state hoisting once you outgrow `remember`. The concepts compound quickly.
