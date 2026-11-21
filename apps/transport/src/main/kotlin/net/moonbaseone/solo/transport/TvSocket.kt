package net.moonbaseone.solo.transport

/**
 * Minimal duplex text socket used by pairing sessions.
 * Real LAN uses WebSocket; tests use [FakeTvSocketPair].
 */
interface TvSocket {
    fun send(text: String)

    fun close(code: Int = 1000, reason: String = "closed")

    val isOpen: Boolean
}

fun interface TvSocketListener {
    fun onEvent(event: TvSocketEvent)
}

sealed interface TvSocketEvent {
    data class Opened(val socket: TvSocket) : TvSocketEvent

    data class Message(val text: String) : TvSocketEvent

    data class Closed(val code: Int, val reason: String) : TvSocketEvent

    data class Failure(val error: Throwable) : TvSocketEvent
}

/**
 * Phone dials; TV accepts. Implementations may be fake or WebSocket-backed.
 */
fun interface TvSocketClient {
    fun connect(host: String, port: Int, listener: TvSocketListener)
}

interface TvSocketServer {
    val localPort: Int

    fun start(listener: TvSocketListener)

    fun stop()
}
