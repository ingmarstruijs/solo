package net.moonbaseone.solo.tv

import java.net.Inet4Address
import java.net.NetworkInterface

/** First non-loopback IPv4 addresses for the pair QR / on-screen host. */
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
