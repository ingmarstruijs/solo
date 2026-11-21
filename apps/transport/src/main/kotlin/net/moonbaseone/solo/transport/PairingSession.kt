package net.moonbaseone.solo.transport

import java.util.concurrent.atomic.AtomicReference
import net.moonbaseone.solo.contracts.TV_SCHEMA_VERSION
import net.moonbaseone.solo.contracts.TvMessage
import net.moonbaseone.solo.contracts.TvMessageCodec
import net.moonbaseone.solo.contracts.TvMessageCodecException

sealed interface PairingState {
    data object Idle : PairingState

    data object Listening : PairingState

    data object Dialing : PairingState

    data object Handshaking : PairingState

    data object Paired : PairingState

    data class Failed(val reason: String) : PairingState
}

fun interface PairingStateListener {
    fun onState(state: PairingState)
}

fun interface TvMessageListener {
    fun onMessage(message: TvMessage)
}

/**
 * TV side: listen for a phone, verify nonce + schemaVersion, then accept TvMessages.
 */
class TvListenSession(
    private val expectedNonce: String,
    private val expectedSchemaVersion: Int = TV_SCHEMA_VERSION,
    private val stateListener: PairingStateListener = PairingStateListener {},
    private val messageListener: TvMessageListener = TvMessageListener {},
) {
    private val socketRef = AtomicReference<TvSocket?>(null)
    private val state = AtomicReference<PairingState>(PairingState.Idle)

    val currentState: PairingState get() = state.get()

    fun bind(server: TvSocketServer) {
        setState(PairingState.Listening)
        server.start { event ->
            when (event) {
                is TvSocketEvent.Opened -> {
                    socketRef.set(event.socket)
                    setState(PairingState.Handshaking)
                }
                is TvSocketEvent.Message -> onRaw(event.text)
                is TvSocketEvent.Closed -> {
                    socketRef.set(null)
                    if (state.get() !is PairingState.Failed) {
                        setState(PairingState.Idle)
                    }
                }
                is TvSocketEvent.Failure -> fail(event.error.message ?: "socket failure")
            }
        }
    }

    fun stop(server: TvSocketServer) {
        socketRef.getAndSet(null)?.close()
        server.stop()
        setState(PairingState.Idle)
    }

    private fun onRaw(raw: String) {
        val sock = socketRef.get() ?: return
        when (state.get()) {
            PairingState.Handshaking -> handleHello(sock, raw)
            PairingState.Paired -> handleTvMessage(raw)
            else -> Unit
        }
    }

    private fun handleHello(sock: TvSocket, raw: String) {
        val frame =
            try {
                ControlFrameCodec.decode(raw)
            } catch (e: Exception) {
                reject(sock, "invalid hello")
                return
            }
        val hello = frame as? ControlFrame.Hello
        if (hello == null) {
            reject(sock, "expected hello")
            return
        }
        if (hello.schemaVersion != expectedSchemaVersion) {
            reject(sock, "schemaVersion mismatch")
            return
        }
        if (hello.nonce != expectedNonce) {
            reject(sock, "nonce mismatch")
            return
        }
        sock.send(ControlFrameCodec.encode(ControlFrame.Welcome(expectedSchemaVersion)))
        setState(PairingState.Paired)
    }

    private fun handleTvMessage(raw: String) {
        if (ControlFrameCodec.looksLikeControl(raw)) {
            fail("unexpected control frame after pair")
            return
        }
        try {
            messageListener.onMessage(TvMessageCodec.decode(raw))
        } catch (e: TvMessageCodecException) {
            fail(e.message ?: "bad TvMessage")
        }
    }

    private fun reject(sock: TvSocket, reason: String) {
        sock.send(ControlFrameCodec.encode(ControlFrame.Reject(reason)))
        sock.close(code = 1008, reason = reason)
        fail(reason)
    }

    private fun fail(reason: String) {
        setState(PairingState.Failed(reason))
    }

    private fun setState(next: PairingState) {
        state.set(next)
        stateListener.onState(next)
    }
}

/**
 * Phone side: dial TV from [PairPayload], hello with nonce, then push TvMessages.
 */
class PhoneDialSession(
    private val payload: PairPayload,
    private val stateListener: PairingStateListener = PairingStateListener {},
) {
    private val socketRef = AtomicReference<TvSocket?>(null)
    private val state = AtomicReference<PairingState>(PairingState.Idle)

    val currentState: PairingState get() = state.get()

    fun connect(client: TvSocketClient) {
        setState(PairingState.Dialing)
        client.connect(payload.host, payload.port) { event ->
            when (event) {
                is TvSocketEvent.Opened -> {
                    socketRef.set(event.socket)
                    setState(PairingState.Handshaking)
                    event.socket.send(
                        ControlFrameCodec.encode(
                            ControlFrame.Hello(
                                nonce = payload.nonce,
                                schemaVersion = payload.schemaVersion,
                            ),
                        ),
                    )
                }
                is TvSocketEvent.Message -> onRaw(event.text)
                is TvSocketEvent.Closed -> {
                    socketRef.set(null)
                    if (state.get() !is PairingState.Failed && state.get() !is PairingState.Paired) {
                        setState(PairingState.Idle)
                    } else if (state.get() is PairingState.Paired) {
                        setState(PairingState.Idle)
                    }
                }
                is TvSocketEvent.Failure -> fail(event.error.message ?: "socket failure")
            }
        }
    }

    fun send(message: TvMessage) {
        check(state.get() is PairingState.Paired) { "not paired" }
        val sock = socketRef.get() ?: error("no socket")
        sock.send(TvMessageCodec.encode(message))
    }

    fun disconnect() {
        socketRef.getAndSet(null)?.close()
        setState(PairingState.Idle)
    }

    private fun onRaw(raw: String) {
        when (state.get()) {
            PairingState.Handshaking -> {
                val frame =
                    try {
                        ControlFrameCodec.decode(raw)
                    } catch (e: Exception) {
                        fail("invalid welcome")
                        return
                    }
                when (frame) {
                    is ControlFrame.Welcome -> {
                        if (frame.schemaVersion != payload.schemaVersion) {
                            fail("schemaVersion mismatch")
                        } else {
                            setState(PairingState.Paired)
                        }
                    }
                    is ControlFrame.Reject -> fail(frame.reason)
                    else -> fail("expected welcome")
                }
            }
            else -> Unit
        }
    }

    private fun fail(reason: String) {
        setState(PairingState.Failed(reason))
        socketRef.getAndSet(null)?.close(code = 1008, reason = reason)
    }

    private fun setState(next: PairingState) {
        state.set(next)
        stateListener.onState(next)
    }
}
