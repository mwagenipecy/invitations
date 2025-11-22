package com.invitation.scanner

import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/invitees/checkin")
    suspend fun checkIn(
        @Header("Authorization") token: String,
        @Body request: CheckInRequest
    ): Response<CheckInResponse>

    companion object {
        // Use HTTP temporarily until HTTPS is configured on server
        private const val BASE_URL = "http://event.wibook.co.tz/" // Production via Apache proxy (HTTP)
        // TODO: Change back to HTTPS once SSL certificate is configured: "https://event.wibook.co.tz/"
        // For local development, use: "http://192.168.1.13:5001/"
        // For Android emulator, use: "http://10.0.2.2:5001/"

        fun create(): ApiService {
            // Create a trust manager that accepts all certificates (for development/production with self-signed certs)
            val trustAllCerts = arrayOf<javax.net.ssl.TrustManager>(
                object : javax.net.ssl.X509TrustManager {
                    override fun checkClientTrusted(chain: Array<java.security.cert.X509Certificate>?, authType: String?) {}
                    override fun checkServerTrusted(chain: Array<java.security.cert.X509Certificate>?, authType: String?) {}
                    override fun getAcceptedIssuers(): Array<java.security.cert.X509Certificate> = arrayOf()
                }
            )
            
            // Install the all-trusting trust manager
            val sslContext = javax.net.ssl.SSLContext.getInstance("SSL")
            sslContext.init(null, trustAllCerts, java.security.SecureRandom())
            val sslSocketFactory = sslContext.socketFactory
            
            // Create OkHttpClient with SSL configuration
            val loggingInterceptor = okhttp3.logging.HttpLoggingInterceptor { message ->
                android.util.Log.d("OkHttp", message)
            }.apply {
                level = okhttp3.logging.HttpLoggingInterceptor.Level.BODY
            }
            
            val client = okhttp3.OkHttpClient.Builder()
                .sslSocketFactory(sslSocketFactory, trustAllCerts[0] as javax.net.ssl.X509TrustManager)
                .hostnameVerifier { _, _ -> true } // Allow all hostnames
                .addInterceptor(loggingInterceptor)
                .build()
            
            val retrofit = retrofit2.Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
                .client(client)
                .build()
            return retrofit.create(ApiService::class.java)
        }
    }
}

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val user: User?
)

data class User(
    val id: Int,
    val name: String,
    val email: String
)

data class CheckInRequest(
    val qr_code: String,
    val event_id: Int
)

data class CheckInResponse(
    val success: Boolean,
    val invitee: Invitee?,
    val error: String?
)

data class Invitee(
    val id: Int,
    val name: String?,
    val phone: String,
    val email: String?,
    val confirmed: Boolean,
    val checked_in: Boolean?
)

