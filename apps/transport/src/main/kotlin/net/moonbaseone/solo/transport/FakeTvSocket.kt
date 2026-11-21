package net.moonbaseone.solo.transport

import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicBoolean

/**
 * In-memory duplex for unit tests: [server] accepts the next [client] connect
 * and wires both ends together.
 */
class FakeTvSocketPair(
    val port: Int = DEFAULT_TV_WS_PORT,
) {
    private val serverListener = AtomicReferenceHolder<TvSocketListener>()
    private val started = AtomicBoolean(false)

    val server: TvSocketServer =
        object : TvSocketServer {
            override val localPort: Int = port

            override fun start(listener: TvSocketListener) {
                check(started.compareAndSet(false, true)) { "already started" }
                serverListener.set(listener)
            }

            override fun stop() {
                started.set(false)
                serverListener.clear()
            }
        }

    val client: TvSocketClient =
        TvSocketClient { host, connectPort, listener ->
            require(host.isNotBlank())
            require(connectPort == port) { "fake server listens on $port, got $connectPort" }
            val serverSideListener =
                serverListener.get()
                    ?: throw IllegalStateException("TV server not listening")

            val phoneEnd = Endpoint()
            val tvEnd = Endpoint()
            phoneEnd.peer = tvEnd
            tvEnd.peer = phoneEnd
            phoneEnd.outboundListener = listener
            tvEnd.outboundListener = serverSideListener

            // Open both ends (TV first, then phone — mirrors accept-then-open).
            serverSideListener.onEvent(TvSocketEvent.Opened(tvEnd))
            listener.onEvent(TvSocketEvent.Opened(phoneEnd))
        }

    private class Endpoint : TvSocket {
        var peer: Endpoint? = null
        var outboundListener: TvSocketListener? = null
        private val open = AtomicBoolean(true)

        override val isOpen: Boolean get() = open.get()

        override fun send(text: String) {
            check(open.get()) { "socket closed" }
            val other = peer ?: error("no peer")
            other.outboundListener?.onEvent(TvSocketEvent.Message(text))
        }

        override fun close(code: Int, reason: String) {
            if (!open.compareAndSet(true, false)) return
            outboundListener?.onEvent(TvSocketEvent.Closed(code, reason))
            peer?.let { other ->
                if (other.open.compareAndSet(true, false)) {
                    other.outboundListener?.onEvent(TvSocketEvent.Closed(code, reason))
                }
            }
        }
    }

    private class AtomicReferenceHolder<T> {
        @Volatile private var value: T? = null

        fun set(v: T) {
            value = v
        }

        fun get(): T? = value

        fun clear() {
            value = null
        }
    }
}

/** Collects socket events for assertions. */
class RecordingTvSocketListener : TvSocketListener {
    private val events = CopyOnWriteArrayList<TvSocketEvent>()

    override fun onEvent(event: TvSocketEvent) {
        events += event
    }

    fun snapshot(): List<TvSocketEvent> = events.toList()

    fun messages(): List<String> =
        events.mapNotNull { (it as? TvSocketEvent.Message)?.text }

    fun awaitOpened(timeoutMs: Long = 2_000): TvSocket {
        val deadline = System.currentTimeMillis() + timeoutMs
        while (System.currentTimeMillis() < deadline) {
            val opened = events.filterIsInstance<TvSocketEvent.Opened>().firstOrNull()
            if (opened != null) return opened.socket
            Thread.sleep(5)
        }
        error("timed out waiting for Opened; events=$events")
    }
}
