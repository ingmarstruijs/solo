package net.moonbaseone.solo.transport

import java.net.InetSocketAddress
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer

/**
 * TV listener: binds a WebSocket server on [port] (0 = ephemeral).
 * Accepts a single phone connection at a time for v1 pairing.
 */
class JavaWebSocketTvServer(
    port: Int = DEFAULT_TV_WS_PORT,
) : TvSocketServer {
    private val listenerRef = AtomicReference<TvSocketListener?>(null)
    private val active = AtomicReference<WebSocket?>(null)
    private val running = AtomicBoolean(false)

    private val server =
        object : WebSocketServer(InetSocketAddress(port)) {
            override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {
                val previous = active.getAndSet(conn)
                previous?.close(1000, "replaced")
                val adapter = ServerSocketAdapter(conn)
                listenerRef.get()?.onEvent(TvSocketEvent.Opened(adapter))
            }

            override fun onClose(conn: WebSocket, code: Int, reason: String, remote: Boolean) {
                if (active.compareAndSet(conn, null)) {
                    listenerRef.get()?.onEvent(TvSocketEvent.Closed(code, reason))
                }
            }

            override fun onMessage(conn: WebSocket, message: String) {
                if (active.get() === conn) {
                    listenerRef.get()?.onEvent(TvSocketEvent.Message(message))
                }
            }

            override fun onMessage(conn: WebSocket, message: ByteBuffer) {
                // Text-only protocol; ignore binary.
            }

            override fun onError(conn: WebSocket?, ex: Exception) {
                listenerRef.get()?.onEvent(TvSocketEvent.Failure(ex))
            }

            override fun onStart() {
                // no-op; [running] set from start()
            }
        }

    override val localPort: Int
        get() {
            val bound = server.port
            return if (bound > 0) bound else 0
        }

    override fun start(listener: TvSocketListener) {
        check(running.compareAndSet(false, true)) { "already running" }
        listenerRef.set(listener)
        server.isReuseAddr = true
        server.start()
        var spins = 0
        while (server.port <= 0 && spins < 200) {
            Thread.sleep(10)
            spins++
        }
        check(server.port > 0) { "WebSocket server failed to bind" }
    }

    override fun stop() {
        try {
            active.getAndSet(null)?.close(1000, "server stop")
            server.stop(1000)
        } finally {
            running.set(false)
            listenerRef.set(null)
        }
    }

    private class ServerSocketAdapter(
        private val conn: WebSocket,
    ) : TvSocket {
        override val isOpen: Boolean get() = conn.isOpen

        override fun send(text: String) {
            check(conn.isOpen) { "socket closed" }
            conn.send(text)
        }

        override fun close(code: Int, reason: String) {
            conn.close(code, reason)
        }
    }
}
