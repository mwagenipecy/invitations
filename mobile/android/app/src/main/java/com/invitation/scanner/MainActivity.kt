package com.invitation.scanner

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.invitation.scanner.databinding.ActivityMainBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private var camera: Camera? = null
    private var isScanning = true
    private val executor = Executors.newSingleThreadExecutor()
    private val apiService = ApiService.create()

    // Default user credentials (hardcoded for security)
    private val defaultUsername = "scanner_user"
    private val defaultPassword = "scanner_pass_2024"
    private var authToken: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Authenticate on app start
        authenticateUser()

        // Request camera permission
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(
                this,
                REQUIRED_PERMISSIONS,
                REQUEST_CODE_PERMISSIONS
            )
        }

        binding.scanStatusText.text = "Ready to scan QR code"
    }

    private fun authenticateUser() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = apiService.login(
                    LoginRequest(
                        email = defaultUsername,
                        password = defaultPassword
                    )
                )
                if (response.isSuccessful && response.body()?.success == true) {
                    authToken = response.body()?.token
                    runOnUiThread {
                        binding.scanStatusText.text = "Authenticated. Ready to scan"
                    }
                } else {
                    runOnUiThread {
                        Toast.makeText(
                            this@MainActivity,
                            "Authentication failed",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Connection error: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder().build().also {
                it.setSurfaceProvider(binding.previewView.surfaceProvider)
            }

            val imageAnalysis = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(executor) { imageProxy ->
                        if (isScanning) {
                            processImageProxy(imageProxy)
                        } else {
                            imageProxy.close()
                        }
                    }
                }

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    this as LifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalysis
                )
            } catch (exc: Exception) {
                Toast.makeText(
                    this,
                    "Camera initialization failed: ${exc.message}",
                    Toast.LENGTH_LONG
                ).show()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun processImageProxy(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage != null && isScanning) {
            val image = InputImage.fromMediaImage(
                mediaImage,
                imageProxy.imageInfo.rotationDegrees
            )
            val scanner = BarcodeScanning.getClient()

            scanner.process(image)
                .addOnSuccessListener { barcodes ->
                    for (barcode in barcodes) {
                        when (barcode.valueType) {
                            Barcode.TYPE_TEXT, Barcode.TYPE_URL -> {
                                val qrCode = barcode.rawValue
                                if (qrCode != null && isScanning) {
                                    isScanning = false
                                    imageProxy.close()
                                    checkInInvitee(qrCode)
                                    return@addOnSuccessListener
                                }
                            }
                        }
                    }
                    imageProxy.close()
                }
                .addOnFailureListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }

    private fun checkInInvitee(qrCode: String) {
        runOnUiThread {
            binding.scanStatusText.text = "Processing check-in..."
        }

        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (authToken == null) {
                    runOnUiThread {
                        Toast.makeText(
                            this@MainActivity,
                            "Not authenticated. Please restart the app",
                            Toast.LENGTH_LONG
                        ).show()
                        binding.scanStatusText.text = "Authentication required"
                    }
                    isScanning = true
                    return@launch
                }

                // Extract event ID from QR code if it's in format EVT-{eventId}-{code}
                val eventId = extractEventIdFromQrCode(qrCode)
                
                if (eventId == null) {
                    runOnUiThread {
                        Toast.makeText(
                            this@MainActivity,
                            "Invalid QR code format",
                            Toast.LENGTH_SHORT
                        ).show()
                        binding.scanStatusText.text = "Invalid QR code"
                        isScanning = true
                    }
                    return@launch
                }

                val response = apiService.checkIn(
                    token = "Bearer $authToken",
                    request = CheckInRequest(
                        qr_code = qrCode,
                        event_id = eventId
                    )
                )

                runOnUiThread {
                    if (response.isSuccessful && response.body()?.success == true) {
                        val invitee = response.body()?.invitee
                        Toast.makeText(
                            this@MainActivity,
                            "Check-in successful!\n${invitee?.name ?: "Guest"}",
                            Toast.LENGTH_LONG
                        ).show()
                        binding.scanStatusText.text = "Check-in successful!"
                    } else {
                        val errorMsg = response.body()?.error ?: "Check-in failed"
                        Toast.makeText(
                            this@MainActivity,
                            errorMsg,
                            Toast.LENGTH_LONG
                        ).show()
                        binding.scanStatusText.text = "Check-in failed"
                    }
                    // Resume scanning after 2 seconds
                    binding.scanStatusText.postDelayed({
                        binding.scanStatusText.text = "Ready to scan QR code"
                        isScanning = true
                    }, 2000)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(
                        this@MainActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    binding.scanStatusText.text = "Error occurred"
                    isScanning = true
                }
            }
        }
    }

    private fun extractEventIdFromQrCode(qrCode: String): Int? {
        // QR code format: EVT-{eventId}-{code}
        return try {
            if (qrCode.startsWith("EVT-")) {
                val parts = qrCode.split("-")
                if (parts.size >= 2) {
                    parts[1].toInt()
                } else {
                    null
                }
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(
            baseContext, it
        ) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(
                    this,
                    "Camera permission is required",
                    Toast.LENGTH_LONG
                ).show()
                finish()
            }
        }
    }

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }
}

