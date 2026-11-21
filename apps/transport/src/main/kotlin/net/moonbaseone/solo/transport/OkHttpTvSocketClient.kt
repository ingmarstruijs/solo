package net.moonbaseone.solo.transport

import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener

/** Phone dialer: connects to `ws://host:port/` on the TV. */
class OkHttpTvSocketClient(
    private val client: OkHttpClient =
        OkHttpClient.Builder()
            .pingInterval(20, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build(),
) : TvSocketClient {
    override fun connect(host: String, port: Int, listener: TvSocketListener) {
        val request =
            Request.Builder()
                .url("ws://$host:$port/")
                .build()
        client.newWebSocket(
            request,
            object : WebSocketListener() {
                private val open = AtomicBoolean(false)
                private var adapter: OkHttpSocketAdapter? = null

                override fun onOpen(webSocket: WebSocket, response: Response) {
                    val sock = OkHttpSocketAdapter(webSocket, open)
                    adapter = sock
                    open.set(true)
                    listener.onEvent(TvSocketEvent.Opened(sock))
                }

                override fun onMessage(webSocket: WebSocket, text: String) {
                    listener.onEvent(TvSocketEvent.Message(text))
                }

                override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                    webSocket.close(code, reason)
                }

                override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                    open.set(false)
                    listener.onEvent(TvSocketEvent.Closed(code, reason))
                }

                override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                    open.set(false)
                    listener.onEvent(TvSocketEvent.Failure(t))
                }
            },
        )
    }

    private class OkHttpSocketAdapter(
        private val webSocket: WebSocket,
        private val open: AtomicBoolean,
    ) : TvSocket {
        override val isOpen: Boolean get() = open.get()

        override fun send(text: String) {
            check(open.get()) { "socket closed" }
            webSocket.send(text)
        }

        override fun close(code: Int, reason: String) {
            webSocket.close(code, reason)
        }
    }
}
