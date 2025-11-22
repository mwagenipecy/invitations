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
        private const val BASE_URL = "https://event.wibook.co.tz/" // Production server
        // For local development, use: "http://192.168.1.13:5001/"
        // For Android emulator, use: "http://10.0.2.2:5001/"

        fun create(): ApiService {
            val retrofit = retrofit2.Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
                .client(
                    okhttp3.OkHttpClient.Builder()
                        .addInterceptor(okhttp3.logging.HttpLoggingInterceptor().apply {
                            level = okhttp3.logging.HttpLoggingInterceptor.Level.BODY
                        })
                        .build()
                )
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

