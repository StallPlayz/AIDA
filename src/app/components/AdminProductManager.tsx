import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  FolderOpen,
  X,
  Edit3,
  Trash2,
  PlusCircle,
  Edit,
  Search,
  RefreshCw,
  Check,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  price: number;
  thumbnailUrl: string;
  category: string;
  status: string;
  featured: boolean;
  discountType?: "NONE" | "PERCENT" | "FIXED";
  discountValue?: number;
}

interface AdminProductManagerProps {
  onProductAdded: (product: any) => void;
}

// Camera Modal Component

function CameraModal({
  isOpen,
  onClose,
  onCapture,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageFile: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isMobile, setIsMobile] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
      setIsLoading(false);
      onClose();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const switchCamera = () => {
    setCapturedImage(null);
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        stopCamera();

        canvas.toBlob(
          (blob: Blob | null) => {
            if (blob) {
              const imageUrl = URL.createObjectURL(blob);
              setCapturedImage(imageUrl);
            }
          },
          "image/webp",
          0.95
        );
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob(
        (blob: Blob | null) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.webp`, {
              type: "image/webp",
            });
            onCapture(file);
            stopCamera();
            setCapturedImage(null);
            setIsLoading(true);
            onClose();
          }
        },
        "image/webp",
        0.95
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1002,
        animation: "fadeIn 0.3s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCamera();
          setCapturedImage(null);
          setIsLoading(true);
          onClose();
        }
      }}
    >
      {/* Container wrapper to hold both modal and button */}
      <div style={{ 
        position: "relative", 
        display: "flex", 
        alignItems: "flex-start",
        gap: "16px",
        maxWidth: "calc(800px + 76px)",
      }}>
        
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            height: "90vh",
            background: "#000",
            borderRadius: "16px",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              pointerEvents: "none",
            }}
          >
            <h3 style={{ color: "white", margin: 0, fontSize: "18px", pointerEvents: "none" }}>
              {capturedImage ? "Preview" : "Take Photo"}
            </h3>
          </div>

          {/* Camera/Preview Area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              position: "relative",
              marginTop: "56px",
              pointerEvents: "none",
            }}
          >
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    pointerEvents: "none",
                  }}
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {/* Controls */}
          <div
            style={{
              padding: "24px",
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {!capturedImage ? (
              <>
                {isMobile && (
                  <button
                    onClick={switchCamera}
                    type="button"
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      borderRadius: "50%",
                      width: "50px",
                      height: "50px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "white",
                    }}
                  >
                    <RefreshCw size={24} />
                  </button>
                )}

                <button
                  onClick={capturePhoto}
                  type="button"
                  style={{
                    background: "white",
                    border: "4px solid #246E76",
                    borderRadius: "50%",
                    width: "70px",
                    height: "70px",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.95)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />

                {isMobile && <div style={{ width: "50px" }} />}
              </>
            ) : (
              <>
                <button
                  onClick={retakePhoto}
                  type="button"
                  style={{
                    background: "#f44336",
                    border: "none",
                    borderRadius: "50%",
                    width: "60px",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "white",
                  }}
                >
                  <X size={28} />
                </button>

                <button
                  onClick={confirmPhoto}
                  type="button"
                  style={{
                    background: "#246E76",
                    border: "none",
                    borderRadius: "50%",
                    width: "60px",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "white",
                  }}
                >
                  <Check size={28} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Close button - OUTSIDE and to the RIGHT of the modal */}
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            stopCamera();
            setCapturedImage(null);
            setIsLoading(true);
            onClose();
          }}
          style={{
            background: "#f44336",
            border: "3px solid white",
            borderRadius: "50%",
            marginTop: "50px",
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            transition: "transform 0.2s ease",
            userSelect: "none",
          }}
          role="button"
          aria-label="Close camera"
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <X size={40} strokeWidth={3} style={{ pointerEvents: "none" }} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Delete Confirmation Popup Component
function DeleteConfirmationPopup({
  isOpen,
  onClose,
  onConfirm,
  productTitle,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productTitle: string;
  loading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "18px",
          width: "90%",
          maxWidth: "480px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          animation: "slideUp 0.3s ease",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #f44336, #e53935)",
            padding: "24px",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading ? "not-allowed" : "pointer",
              color: "white",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <X size={18} />
          </button>

          <div
            style={{
              width: "64px",
              height: "64px",
              background: "rgba(255, 255, 255, 0.15)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              border: "3px solid rgba(255, 255, 255, 0.3)",
              fontSize: "32px",
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              color: "white",
              fontSize: "24px",
              fontWeight: "600",
              textAlign: "center",
              margin: "0",
            }}
          >
            Delete Product?
          </h2>
        </div>

        <div style={{ padding: "24px" }}>
          <p
            style={{
              color: "#666",
              fontSize: "16px",
              textAlign: "center",
              lineHeight: "1.6",
              margin: "0 0 8px",
            }}
          >
            Are you sure you want to delete
          </p>
          <p
            style={{
              color: "#246E76",
              fontSize: "18px",
              fontWeight: "600",
              textAlign: "center",
              margin: "0 0 16px",
            }}
          >
            "{productTitle}"
          </p>
          <p
            style={{
              color: "#999",
              fontSize: "14px",
              textAlign: "center",
              lineHeight: "1.5",
              margin: "0",
            }}
          >
            If this product has been purchased, it will be archived instead of
            deleted.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                color: "#666",
                border: "2px solid #ddd",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px",
                background: loading ? "#999" : "#f44336",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      display: "inline-block",
                    }}
                  ></span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function AdminProductManager({
  onProductAdded,
}: AdminProductManagerProps) {
  const [stage, setStage] = useState<"closed" | "edit" | "add" | "manage">(
    "closed"
  );
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({
    isOpen: false,
    product: null,
  });

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    price: "",
    thumbnailUrl: "",
    category: "LIGHTROOM_PRESET",
    featured: false,
    discountType: "NONE" as "NONE" | "PERCENT" | "FIXED",
    discountValue: "",
  });

  const convertFileToWebP = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
      if (
        file.type === "image/webp" ||
        file.name.toLowerCase().endsWith(".webp")
      ) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onerror = () =>
        reject(new Error("Failed to read image for WebP conversion"));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Could not create canvas context for conversion"));
            return;
          }

          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("WebP conversion failed"));
                return;
              }
              const baseName = file.name.replace(/\.[^.]+$/, "");
              resolve(
                new File([blob], `${baseName}.webp`, {
                  type: "image/webp",
                  lastModified: Date.now(),
                })
              );
            },
            "image/webp",
            0.9
          );
        };
        img.onerror = () =>
          reject(new Error("Unable to load image for conversion"));
        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    });

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      setError("");

      const webpFile = await convertFileToWebP(file);

      if (webpFile.size > 5 * 1024 * 1024) {
        setError("Converted image must be less than 5MB");
        return null;
      }

      const formData = new FormData();
      formData.append("file", webpFile);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload failed:", errorData);
        throw new Error(
          errorData.details || errorData.error || "Failed to upload image"
        );
      }

      const data = await response.json();

      setError(""); // Clear any previous errors
      return data.url;
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMessage = err.message || "Failed to upload image";
      setError(errorMessage);
      alert(`Upload failed: ${errorMessage}`); // Show alert for immediate feedback
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (stage === "manage") {
      fetchProducts();
    }
  }, [stage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch products");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openToEdit = () => {
    if (isAnimating || stage !== "closed") return;
    setIsAnimating(true);
    setStage("edit");
    setTimeout(() => {
      setShowContent(true);
      setIsAnimating(false);
    }, 350);
  };

  const goToAddProduct = () => {
    if (isAnimating || stage !== "edit") return;
    setIsAnimating(true);
    setShowContent(false);
    setTimeout(() => {
      setStage("add");
      setEditingProduct(null);
      setFormData({
        title: "",
        subtitle: "",
        description: "",
        price: "",
        thumbnailUrl: "",
        category: "LIGHTROOM_PRESET",
        featured: false,
        discountType: "NONE",
        discountValue: "",
      });
      setError("");
      setTimeout(() => {
        setShowContent(true);
        setIsAnimating(false);
      }, 350);
    }, 220);
  };

  const goToManageProducts = () => {
    if (isAnimating || stage !== "edit") return;
    setIsAnimating(true);
    setShowContent(false);
    setTimeout(() => {
      setStage("manage");
      setError("");
      setTimeout(() => {
        setShowContent(true);
        setIsAnimating(false);
      }, 350);
    }, 220);
  };

  const backToEdit = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowContent(false);
    setTimeout(() => {
      setStage("edit");
      setEditingProduct(null);
      setFormData({
        title: "",
        subtitle: "",
        description: "",
        price: "",
        thumbnailUrl: "",
        category: "LIGHTROOM_PRESET",
        featured: false,
        discountType: "NONE",
        discountValue: "",
      });
      setError("");
      setTimeout(() => {
        setShowContent(true);
        setIsAnimating(false);
      }, 350);
    }, 220);
  };

  const closeAll = () => {
    if (isAnimating || stage === "closed") return;
    setIsAnimating(true);
    setShowContent(false);
    setTimeout(() => {
      setStage("closed");
      setEditingProduct(null);
      setFormData({
        title: "",
        subtitle: "",
        description: "",
        price: "",
        thumbnailUrl: "",
        category: "LIGHTROOM_PRESET",
        featured: false,
        discountType: "NONE",
        discountValue: "",
      });
      setError("");
      setTimeout(() => {
        setIsAnimating(false);
      }, 350);
    }, 220);
  };

  const handleCameraCapture = async (imageFile: File) => {
    const uploadedUrl = await uploadImageToSupabase(imageFile);
    if (uploadedUrl) {
      setFormData({ ...formData, thumbnailUrl: uploadedUrl });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      const uploadedUrl = await uploadImageToSupabase(file);
      if (uploadedUrl) {
        setFormData({ ...formData, thumbnailUrl: uploadedUrl });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.thumbnailUrl
    ) {
      setError("Please fill in all required fields and upload an image");
      setLoading(false);
      return;
    }

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          imageUrls: [formData.thumbnailUrl],
          discountType: formData.discountType,
          discountValue:
            formData.discountType === "PERCENT"
              ? Math.min(100, Math.max(0, parseInt(formData.discountValue || "0")))
              : Math.max(0, parseInt(formData.discountValue || "0")),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to ${editingProduct ? "update" : "create"} product`
        );
      }

      onProductAdded(data);
      setTimeout(() => {
        backToEdit();
      }, 500);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      subtitle: product.subtitle || "",
      description: product.description,
      price: product.price.toString(),
      thumbnailUrl: product.thumbnailUrl,
      category: product.category,
      featured: product.featured,
      discountType: product.discountType || "NONE",
      discountValue:
        typeof product.discountValue === "number"
          ? product.discountValue.toString()
          : "",
    });

    setIsAnimating(true);
    setShowContent(false);
    setTimeout(() => {
      setStage("add");
      setTimeout(() => {
        setShowContent(true);
        setIsAnimating(false);
      }, 350);
    }, 220);
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteConfirm({ isOpen: true, product });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.product) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/products/${deleteConfirm.product.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete product");
      }

      setProducts(products.filter((p) => p.id !== deleteConfirm.product!.id));
      onProductAdded(null);
      setDeleteConfirm({ isOpen: false, product: null });
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStageHeight = () => {
    if (stage === "closed") return "40px";
    if (stage === "edit") return "180px";
    if (stage === "add") return "80vh";
    if (stage === "manage") return "600px";
    return "40px";
  };

  const getStageWidth = () => {
    if (stage === "closed") return "120px";
    if (stage === "edit") return "500px";
    if (stage === "add") return "820px";
    if (stage === "manage") return "780px";
    return "120px";
  };

  return (
    <>
      <div
        style={{
          display: "inline-block",
          position: "relative",
          width: "100%",
          maxWidth: "980px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            backgroundColor: stage === "closed" ? "#135D66" : "transparent",
            border: stage === "closed" ? "1px solid #e5e4e0" : "none",
            borderRadius: stage === "closed" ? "14px" : "18px",
            padding: stage === "closed" ? "10px 18px" : "0",
            color: stage === "closed" ? "#222" : "inherit",
            cursor: stage === "closed" ? "pointer" : "default",
            width: "100%",
          maxWidth: getStageWidth(),
          height: getStageHeight(),
          maxHeight: stage === "add" ? "80vh" : "none",
          display: "flex",
          alignItems: stage === "closed" ? "center" : "stretch",
          justifyContent: stage === "closed" ? "center" : "stretch",
          overflow: stage === "add" || stage === "manage" ? "hidden" : "visible",
            transition: isAnimating
              ? "all 0.36s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
            boxShadow:
              stage !== "closed"
                ? "0 10px 30px rgba(0, 0, 0, 0.08)"
                : "0 2px 6px rgba(0, 0, 0, 0.05)",
            background:
              stage === "add" || stage === "manage"
                ? "#ffffff"
                : stage === "edit"
                ? "#0f6d66"
                : "#135D66",
            margin: "0 auto",
          }}
          onClick={() => {
            if (stage === "closed") openToEdit();
          }}
        >
          {stage === "closed" && !isAnimating && (
            <span
              style={{ fontSize: "15px", color: "white", userSelect: "none" }}
            >
              Admin Utilities
            </span>
          )}

          {(stage === "edit" ||
            stage === "add" ||
            stage === "manage" ||
            isAnimating) && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  gap: "8px",
                  borderTopLeftRadius: "18px",
                  borderTopRightRadius: "18px",
                  background:
                    stage === "add" || stage === "manage"
                      ? "#0f6d66"
                      : "transparent",
                  color: "white",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      border: "2px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    <Edit3 size={20} />
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "500",
                      color: "inherit",
                    }}
                  >
                    {stage === "edit"
                      ? "Edit"
                      : stage === "manage"
                      ? "Manage Products"
                      : editingProduct
                      ? "Edit Product"
                      : "Add Product"}
                  </div>
                </div>

                <button
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "none",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeAll();
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {stage === "edit" && (
                <div
                  style={{
                    padding: "5px",
                    flex: 1,
                    display: showContent ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    background: "white",
                    animation: showContent
                      ? "contentFadeIn 0.28s ease forwards"
                      : "contentFadeOut 0.22s ease forwards",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                    }}
                  >
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 18px",
                        borderRadius: "28px",
                        background: "rgba(15,109,102,0.9)",
                        color: "white",
                        border: "none",
                        width: "90%",
                        maxWidth: "240px",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                      onClick={goToAddProduct}
                    >
                      <PlusCircle size={22} />
                      <span>Add Product</span>
                    </button>

                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 18px",
                        borderRadius: "28px",
                        background: "rgba(0,0,0,0.05)",
                        color: "#333",
                        border: "none",
                        width: "90%",
                        maxWidth: "240px",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                      onClick={goToManageProducts}
                    >
                      <Edit size={22} />
                      <span>Manage Products</span>
                    </button>
                  </div>
                </div>
              )}

              {stage === "manage" && (
                <div
                  style={{
                    display: showContent ? "flex" : "none",
                    flexDirection: "column",
                    padding: "14px",
                    gap: "12px",
                    animation: showContent
                      ? "contentFadeIn 0.28s ease forwards"
                      : "contentFadeOut 0.22s ease forwards",
                    overflowY: "auto",
                    maxHeight: "500px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        fontSize: "14px",
                      }}
                    />
                    <Search size={20} style={{ color: "#666" }} />
                  </div>

                  {error && (
                    <div
                      style={{
                        color: "#f44336",
                        fontSize: "13px",
                        padding: "8px",
                        background: "#ffebee",
                        borderRadius: "6px",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {loading && !deleteConfirm.isOpen ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#666",
                      }}
                    >
                      Loading...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#666",
                      }}
                    >
                      {searchQuery
                        ? "No products found matching your search"
                        : "No products available"}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px",
                            background: "#f9f9f9",
                            borderRadius: "8px",
                            border: "1px solid #eee",
                          }}
                        >
                          <img
                            src={product.thumbnailUrl}
                            alt={product.title}
                            style={{
                              width: "50px",
                              height: "50px",
                              objectFit: "cover",
                              borderRadius: "6px",
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: "600",
                                fontSize: "14px",
                                color: "#333",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {product.title}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              IDR {product.price.toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleEdit(product)}
                            disabled={loading}
                            style={{
                              background: "#0f6d66",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              cursor: loading ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              opacity: loading ? 0.5 : 1,
                            }}
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(product)}
                            disabled={loading}
                            style={{
                              background: "#f44336",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              cursor: loading ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              opacity: loading ? 0.5 : 1,
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={backToEdit}
                    disabled={loading}
                    style={{
                      marginTop: "12px",
                      padding: "8px 16px",
                      background: "transparent",
                      color: "#0f6d66",
                      border: "1px solid #0f6d66",
                      borderRadius: "8px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    Back
                  </button>
                </div>
              )}

              {stage === "add" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    overflow: "hidden",
                    gap: "12px",
                    padding: "6px 8px 12px",
                  }}
                >
                  <div
                    className="photo-row"
                    style={{
                      display: "flex",
                      gap: "16px",
                      justifyContent: "flex-start",
                      padding: "10px 12px",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      disabled={uploadingImage}
                      style={{
                        background: uploadingImage ? "#999" : "#0f6d66",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        width: "140px",
                        height: "80px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        cursor: uploadingImage ? "not-allowed" : "pointer",
                        opacity: uploadingImage ? 0.6 : 1,
                      }}
                    >
                      {uploadingImage ? (
                        <span>Uploading...</span>
                      ) : (
                        <>
                          <Camera size={24} />
                          <span style={{ fontSize: "14px" }}>Take Photo</span>
                        </>
                      )}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        background: uploadingImage ? "#999" : "#0f6d66",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        width: "140px",
                        height: "80px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        cursor: uploadingImage ? "not-allowed" : "pointer",
                        opacity: uploadingImage ? 0.6 : 1,
                      }}
                    >
                      {uploadingImage ? (
                        <span>Uploading...</span>
                      ) : (
                        <>
                          <FolderOpen size={24} />
                          <span style={{ fontSize: "14px" }}>Add Photo</span>
                        </>
                      )}
                    </button>

                    {formData.thumbnailUrl && (
                      <div
                        style={{
                          padding: "0 4px",
                          textAlign: "left",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={formData.thumbnailUrl}
                          alt="Preview"
                          style={{
                            width: "200px",
                            height: "130px",
                            borderRadius: "10px",
                            objectFit: "cover",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      padding: "4px 18px 16px 18px",
                      overflowY: "auto",
                      flex: 1,
                    }}
                  >
                    <input
                      style={{
                        background: "#f2f2f2",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      placeholder="Product Title *"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                    <input
                      style={{
                        background: "#f2f2f2",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      placeholder="Subtitle"
                      value={formData.subtitle}
                      onChange={(e) =>
                        setFormData({ ...formData, subtitle: e.target.value })
                      }
                      disabled={loading}
                    />

                    <textarea
                      style={{
                        gridColumn: "span 2",
                        background: "#f2f2f2",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px",
                        fontSize: "14px",
                        outline: "none",
                        minHeight: "80px",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                      placeholder="Description *"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      required
                      disabled={loading}
                    />

                    <input
                      style={{
                        background: "#f2f2f2",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      type="number"
                      placeholder="Price (IDR) *"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                      disabled={loading}
                    />

                    <select
                      style={{
                        background: "#f2f2f2",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      disabled={loading}
                    >
                      <option value="LIGHTROOM_PRESET">Lightroom Preset</option>
                      <option value="PHOTOSHOP_ACTION">
                        Photoshop Action
                      </option>
                      <option value="LUT">LUT</option>
                      <option value="TEMPLATE">Template</option>
                      <option value="BUNDLE">Bundle</option>
                      <option value="OTHER">Other</option>
                    </select>

                    <label
                      style={{
                        gridColumn: "span 2",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        color: "#333",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) =>
                          setFormData({ ...formData, featured: e.target.checked })
                        }
                        disabled={loading}
                      />
                      Feature this product (pin to top)
                    </label>

                    <select
                      style={{
                        background: "#f2f2f2",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value as "NONE" | "PERCENT" | "FIXED",
                          discountValue:
                            e.target.value === "NONE" ? "" : formData.discountValue,
                        })
                      }
                      disabled={loading}
                    >
                      <option value="NONE">No Discount</option>
                      <option value="PERCENT">Percent (%)</option>
                      <option value="FIXED">Fixed Amount (IDR)</option>
                    </select>

                    <input
                      style={{
                        background: "#f2f2f2",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      type="number"
                      min={0}
                      max={formData.discountType === "PERCENT" ? 100 : undefined}
                      placeholder={
                        formData.discountType === "PERCENT"
                          ? "Discount %"
                          : formData.discountType === "FIXED"
                          ? "Discount amount (IDR)"
                          : "Discount (optional)"
                      }
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: e.target.value })
                      }
                      disabled={loading || formData.discountType === "NONE"}
                    />

                    <input
                      style={{
                        gridColumn: "span 2",
                        background: "#f2f2f2",
                        border: "none",
                        borderRadius: "8px",
                        padding: "10px",
                        fontSize: "14px",
                        outline: "none",
                      }}
                      placeholder="Image URL *"
                      value={formData.thumbnailUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            thumbnailUrl: e.target.value,
                          })
                      }
                      required
                      disabled={loading}
                    />

                    {error && (
                      <div
                        style={{
                          gridColumn: "span 2",
                          color: "#f44336",
                          fontSize: "13px",
                          padding: "8px",
                          background: "#ffebee",
                          borderRadius: "6px",
                        }}
                      >
                        {error}
                      </div>
                    )}

                    <div
                      style={{
                        gridColumn: "span 2",
                        display: "flex",
                        gap: "10px",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: "6px",
                        paddingBottom: "10px",
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          background: "transparent",
                          color: "#777777",
                          border: "1px solid #ddd",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: "14px",
                          opacity: loading ? 0.5 : 1,
                        }}
                        onClick={backToEdit}
                        disabled={loading}
                      >
                        Back
                      </button>

                      <button
                        type="submit"
                        style={{
                          background: "#0f6d66",
                          color: "white",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "8px",
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.6 : 1,
                          fontSize: "14px",
                        }}
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading
                          ? editingProduct
                            ? "Updating..."
                            : "Adding..."
                          : editingProduct
                          ? "Update Product"
                          : "Add Product"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
          @keyframes contentFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes contentFadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(8px); }
          }
        `}</style>

      <DeleteConfirmationPopup
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          !loading && setDeleteConfirm({ isOpen: false, product: null })
        }
        onConfirm={confirmDelete}
        productTitle={deleteConfirm.product?.title || ""}
        loading={loading}
      />

      <CameraModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
}
