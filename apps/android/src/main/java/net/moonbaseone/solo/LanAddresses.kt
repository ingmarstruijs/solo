package net.moonbaseone.solo

import java.net.Inet4Address
import java.net.NetworkInterface

/** First non-loopback IPv4 address, if any (for pair diagnostics). */
fun localIpv4Addresses(): List<String> =
    try {
        NetworkInterface.getNetworkInterfaces()
            ?.toList()
            .orEmpty()
            .flatMap { iface ->
                iface.inetAddresses
                    .toList()
                    .filterIsInstance<Inet4Address>()
                    .filter { !it.isLoopbackAddress }
                    .mapNotNull { it.hostAddress }
            }
    } catch (_: Exception) {
        emptyList()
    }
