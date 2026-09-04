---
title: 'Kotlin Coroutines: From Callbacks to Suspend Functions'
date: '2026-09-04'
image: cover.jpg
excerpt: Stop wrestling with callback hell. Learn how Kotlin coroutines make async Android code readable, structured, and safe.
isFeatured: false
---

If you have written Android code for more than a day, you have felt the pain: a network call spawns a callback, that callback updates the UI on the wrong thread, you crash with a `NetworkOnMainThreadException`, and everything devolves into nested lambdas that are impossible to read six months later. Kotlin coroutines are the language-level fix. They look like plain sequential code but run asynchronously, and they integrate naturally with Android's lifecycle machinery. Let me show you how they work from first principles.

## What Is a Coroutine?

A coroutine is a block of code that can **suspend** its execution — give up the thread — and **resume** later, possibly on a different thread, without blocking anything. The key word is *suspend*: not block, not cancel, just pause. The thread stays free to do other work while the coroutine waits.

```kotlin
// This looks synchronous but suspends while the network call is in-flight.
suspend fun fetchUser(id: String): User {
    return api.getUser(id) // suspends here; thread is free
}
```

The `suspend` modifier is a compile-time signal. You can only call a suspend function from another suspend function *or* from a coroutine builder (more on those shortly).

## Coroutine Builders

There are three builders you will use constantly.

### `launch`

`launch` starts a coroutine and returns a `Job`. It is fire-and-forget — you do not get a return value.

```kotlin
viewModelScope.launch {
    val user = fetchUser("42") // suspends; does NOT block the thread
    _uiState.value = UiState.Success(user)
}
```

`viewModelScope` is a `CoroutineScope` tied to the ViewModel's lifecycle. When the ViewModel is cleared, all coroutines in this scope are automatically cancelled. No more manual `onCleared()` cleanup.

### `async` / `await`

When you need a result back, use `async`. It returns a `Deferred<T>` — a coroutine that produces a value. Call `.await()` to get it.

```kotlin
viewModelScope.launch {
    val profileDeferred = async { api.getProfile(userId) }
    val settingsDeferred = async { api.getSettings(userId) }

    // Both requests run concurrently; we wait for both here.
    val profile = profileDeferred.await()
    val settings = settingsDeferred.await()

    _uiState.value = UiState.Ready(profile, settings)
}
```

This pattern is the direct replacement for parallel `CountDownLatch` / `Future` gymnastics.

### `withContext`

`withContext` shifts the execution to a different dispatcher and returns a value, then shifts back. It is the safe way to move work off the main thread.

```kotlin
suspend fun loadBitmap(path: String): Bitmap = withContext(Dispatchers.IO) {
    BitmapFactory.decodeFile(path) // runs on an IO thread
}
```

No more `AsyncTask`, no more `Thread { }` wrapped in `runOnUiThread { }`.

## Dispatchers

Dispatchers determine which thread pool a coroutine runs on.

| Dispatcher | When to use |
|---|---|
| `Dispatchers.Main` | UI updates, `LiveData` observation, reading ViewModels |
| `Dispatchers.IO` | Network calls, database reads/writes, file access |
| `Dispatchers.Default` | CPU-heavy work: JSON parsing, sorting, image processing |
| `Dispatchers.Unconfined` | Rare; test scenarios mostly |

By default, `viewModelScope.launch` starts on `Dispatchers.Main`. Use `withContext(Dispatchers.IO)` inside your repository layer, and the ViewModel never needs to specify a dispatcher explicitly — the repository does the right thing.

## Structured Concurrency

This is the idea that makes coroutines safer than raw threads: every coroutine has a **parent scope**, and cancelling the parent cascades to all children.

```kotlin
viewModelScope.launch { // parent
    launch { delay(1000); fetchA() } // child 1
    launch { delay(500);  fetchB() } // child 2
} // cancelling viewModelScope cancels both children
```

If `fetchA()` throws, the exception propagates to the scope and cancels `fetchB()` too — no dangling background work when the user navigates away.

## Error Handling

Use a `try/catch` around suspend calls just like synchronous code. For `launch` (where you cannot `await`), a `CoroutineExceptionHandler` catches uncaught exceptions:

```kotlin
val handler = CoroutineExceptionHandler { _, throwable ->
    Log.e("VM", "Coroutine failed", throwable)
    _uiState.value = UiState.Error(throwable.message)
}

viewModelScope.launch(handler) {
    _uiState.value = UiState.Loading
    val result = api.getPosts() // throws on network failure
    _uiState.value = UiState.Success(result)
}
```

For `async`, call `.await()` inside a `try/catch` — the exception is thrown at the await site, not when the `async` block starts.

## A Real Example: ViewModel + Repository

Here is a complete, realistic pattern using `StateFlow`.

```kotlin
// Repository (data layer)
class PostRepository(private val api: PostApi, private val db: PostDao) {
    suspend fun getPosts(): List<Post> = withContext(Dispatchers.IO) {
        try {
            val posts = api.fetchPosts()
            db.insertAll(posts)
            posts
        } catch (e: IOException) {
            db.getAll() // fall back to cache on network error
        }
    }
}

// ViewModel (UI layer)
class PostsViewModel(private val repo: PostRepository) : ViewModel() {
    private val _uiState = MutableStateFlow<PostsState>(PostsState.Loading)
    val uiState: StateFlow<PostsState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            _uiState.value = try {
                PostsState.Success(repo.getPosts())
            } catch (e: Exception) {
                PostsState.Error(e.message ?: "Unknown error")
            }
        }
    }
}

sealed class PostsState {
    object Loading : PostsState()
    data class Success(val posts: List<Post>) : PostsState()
    data class Error(val message: String) : PostsState()
}
```

The Activity or Fragment collects from `uiState` inside `lifecycleScope.launch { repeatOnLifecycle(Lifecycle.State.STARTED) { … } }` to automatically stop collection when the UI is not visible.

## Adding the Dependencies

In your app-level `build.gradle.kts`:

```kotlin
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.3")
}
```

`lifecycle-viewmodel-ktx` provides `viewModelScope`; `lifecycle-runtime-ktx` provides `lifecycleScope` and `repeatOnLifecycle`.

## Key Takeaways

- `suspend` functions look synchronous but run asynchronously — the compiler handles the state machine.
- `launch` for fire-and-forget, `async`/`await` for concurrent work with results, `withContext` for thread switching.
- `viewModelScope` and `lifecycleScope` cancel automatically when the corresponding lifecycle ends.
- Push `withContext(Dispatchers.IO)` down into the repository layer; ViewModels stay on Main.
- Structured concurrency means no leaking background jobs and predictable error propagation.

Coroutines are now the idiomatic Android async story. Once you internalise suspend and the three builders, the old callback-and-RxJava mental models fade fast.
