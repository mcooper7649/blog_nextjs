---
title: 'Kotlin Coroutines: Async Android Without the Callback Hell'
date: '2026-09-07'
image: cover.jpg
excerpt: Kotlin coroutines turn painful async Android code into readable, sequential-looking logic — here is how launch, async, viewModelScope, and Dispatchers actually work.
isFeatured: false
---

Before coroutines, async Android code was a maze of callbacks, `AsyncTask` boilerplate, and RxJava chains. Coroutines collapse all of that into code that *reads like it runs top-to-bottom*, while still doing the right thing on the right thread. I've been using them in production Kotlin apps for a while now, and the learning curve is lower than it looks.

## What a coroutine actually is

A coroutine is a piece of code that can **suspend** execution without blocking a thread. When you call a `suspend fun`, the runtime can pause it, free up the thread for other work, and resume it later — automatically — when the result is ready. You get the concurrency benefits of threads without juggling threads yourself.

```kotlin
// This looks sequential but never blocks the calling thread
suspend fun loadUser(id: Int): User {
    val user = userRepository.fetchUser(id) // suspends here while the network call runs
    val prefs = prefsRepository.fetchPrefs(id) // resumes, then suspends again
    return user.copy(prefs = prefs)
}
```

## Launching coroutines: `launch` vs `async`

`launch` starts a coroutine and returns a `Job`. You use it when you want a side effect and don't need a return value:

```kotlin
viewModelScope.launch {
    val posts = api.getPosts()      // suspend — waits without blocking
    _uiState.value = UiState.Success(posts)
}
```

`async` starts a coroutine and returns a `Deferred<T>` — a future value you retrieve with `.await()`. Use it when you want to run things **concurrently** and then combine the results:

```kotlin
viewModelScope.launch {
    val usersDeferred = async { api.getUsers() }
    val postsDeferred = async { api.getPosts() }

    // Both network calls are in-flight at the same time
    val users = usersDeferred.await()
    val posts = postsDeferred.await()

    _uiState.value = UiState.Success(users, posts)
}
```

The key difference: `launch` is fire-and-collect-nothing; `async` is fire-and-collect-result.

## Dispatchers: which thread runs your code

Kotlin provides a set of `CoroutineDispatcher`s that control where code runs:

| Dispatcher | Use it for |
|---|---|
| `Dispatchers.Main` | UI updates, LiveData / StateFlow writes |
| `Dispatchers.IO` | Network calls, disk reads, database queries |
| `Dispatchers.Default` | CPU-heavy work: sorting, parsing, image processing |
| `Dispatchers.Main.immediate` | Main thread, skips dispatch if already on main |

Switch inside a coroutine with `withContext` — this is a suspend call, not a new coroutine:

```kotlin
// Runs on IO, result is returned back to the calling dispatcher
suspend fun fetchUser(id: Int): User = withContext(Dispatchers.IO) {
    db.userDao().getById(id)
}
```

Android's Room and Retrofit already mark their operations as `suspend` and handle their own dispatcher switching internally, so you often don't need `withContext` for those. But for `java.io` file reads or `java.net` calls, you do.

## `viewModelScope` and `lifecycleScope`

The coroutine scope controls **when coroutines are cancelled**. In Android you almost never create a scope by hand because the Jetpack lifecycle components do it for you:

```kotlin
class PostsViewModel(private val repo: PostsRepository) : ViewModel() {

    private val _posts = MutableStateFlow<List<Post>>(emptyList())
    val posts: StateFlow<List<Post>> = _posts.asStateFlow()

    init {
        loadPosts()
    }

    fun loadPosts() {
        viewModelScope.launch {           // cancelled when ViewModel is cleared
            try {
                _posts.value = repo.getAllPosts()
            } catch (e: IOException) {
                // handle network error
            }
        }
    }
}
```

`viewModelScope` is cancelled when the ViewModel is destroyed, so you'll never update UI after an Activity finishes. Similarly, `lifecycleScope` (available on Activities and Fragments) cancels when the lifecycle owner is destroyed. Use `repeatOnLifecycle` inside it to safely collect flows:

```kotlin
// In your Fragment
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.posts.collect { posts ->
            adapter.submitList(posts)
        }
    }
}
```

`repeatOnLifecycle(STARTED)` is important — it stops collecting when the app goes to the background, which avoids wasting CPU and prevents crashes from trying to update views that aren't visible.

## Error handling

Exceptions in `launch` propagate to the scope's `CoroutineExceptionHandler` (if one is installed) and then crash the app if nothing catches them. In practice, wrap the body in a `try/catch`:

```kotlin
viewModelScope.launch {
    _uiState.value = UiState.Loading
    try {
        val data = repo.fetchData()
        _uiState.value = UiState.Success(data)
    } catch (e: Exception) {
        _uiState.value = UiState.Error(e.localizedMessage ?: "Unknown error")
    }
}
```

For `async`, the exception is thrown when you call `.await()`, so wrap the `await` (or the whole block) in try/catch rather than the `async {}` builder.

## A complete ViewModel example

Putting it all together — fetching two things concurrently, updating UI state, handling errors:

```kotlin
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val userRepo: UserRepository,
    private val feedRepo: FeedRepository,
) : ViewModel() {

    sealed class State {
        object Loading : State()
        data class Ready(val user: User, val feed: List<FeedItem>) : State()
        data class Error(val message: String) : State()
    }

    private val _state = MutableStateFlow<State>(State.Loading)
    val state: StateFlow<State> = _state.asStateFlow()

    fun load(userId: Int) {
        viewModelScope.launch {
            _state.value = State.Loading
            try {
                val user = async { userRepo.getUser(userId) }
                val feed = async { feedRepo.getFeed(userId) }
                _state.value = State.Ready(user.await(), feed.await())
            } catch (e: Exception) {
                _state.value = State.Error(e.message ?: "Failed to load")
            }
        }
    }
}
```

Both API calls run in parallel, the ViewModel is lifecycle-safe, and the error path is explicit and easy to test.

## Where to go next

Once you're comfortable with `launch`, `async`, and `viewModelScope`, the next stops are:

- **`Flow`** — cold streams that replace RxJava `Observable` for reactive pipelines
- **`SharedFlow` / `StateFlow`** — hot streams that replace `LiveData`
- **`Channel`** — a coroutine-native queue for producer/consumer patterns
- **Coroutine testing** — `TestCoroutineDispatcher` (now `UnconfinedTestDispatcher`) and `runTest` for writing fast, deterministic unit tests

Coroutines aren't magic — they're cooperative multitasking bolted on top of the JVM — but they make async Android code genuinely pleasant to write and reason about. If you're still reaching for callbacks or RxJava, give them a week and you won't go back.
