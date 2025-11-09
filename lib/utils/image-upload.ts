"use client"

import { createClient } from "@/lib/supabase/client"
import { validateImageFile } from "@/lib/validations/product-schemas"

export interface ImageUploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface ImageUploadOptions {
  bucket?: string
  folder?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
  generateUniqueName?: boolean
}

const DEFAULT_OPTIONS: Required<ImageUploadOptions> = {
  bucket: "product-images",
  folder: "variants",
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"],
  generateUniqueName: true,
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImage(file: File, options: ImageUploadOptions = {}): Promise<ImageUploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Validate file
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    }
  }

  try {
    const supabase = createClient()

    // Generate file path
    const fileName = opts.generateUniqueName ? generateUniqueFileName(file.name) : file.name
    const filePath = opts.folder ? `${opts.folder}/${fileName}` : fileName

    // Upload to storage
    const { data, error } = await supabase.storage.from(opts.bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Upload error:", error)
      return {
        success: false,
        error: parseStorageError(error),
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(opts.bucket).getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error("Unexpected upload error:", error)
    return {
      success: false,
      error: "Erro inesperado ao fazer upload da imagem",
    }
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  options: ImageUploadOptions = {},
): Promise<ImageUploadResult[]> {
  const uploadPromises = files.map((file) => uploadImage(file, options))
  return Promise.all(uploadPromises)
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(path: string, bucket: string = "product-images"): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("Delete error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected delete error:", error)
    return false
  }
}

/**
 * Delete multiple images
 */
export async function deleteImages(paths: string[], bucket: string = "product-images"): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucket).remove(paths)

    if (error) {
      console.error("Batch delete error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected batch delete error:", error)
    return false
  }
}

/**
 * Get public URL for a stored image
 */
export function getImageUrl(path: string, bucket: string = "product-images"): string {
  const supabase = createClient()
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}

/**
 * Generate unique file name
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split(".").pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "")

  // Sanitize name
  const sanitizedName = nameWithoutExt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50)

  return `${sanitizedName}-${timestamp}-${randomString}.${extension}`
}

/**
 * Parse Supabase Storage errors to user-friendly messages
 */
function parseStorageError(error: any): string {
  if (error.message?.includes("Duplicate")) {
    return "Já existe um arquivo com este nome. Por favor, renomeie o arquivo."
  }

  if (error.message?.includes("size")) {
    return "O arquivo é muito grande. O tamanho máximo é 5MB."
  }

  if (error.message?.includes("not found")) {
    return "O bucket de armazenamento não foi encontrado. Contacte o suporte."
  }

  if (error.message?.includes("permission")) {
    return "Você não tem permissão para fazer upload de arquivos."
  }

  return error.message || "Erro ao fazer upload do arquivo"
}

/**
 * Compress image before upload (client-side)
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {},
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.9 } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Não foi possível criar contexto do canvas"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Falha ao comprimir imagem"))
              return
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          file.type,
          quality,
        )
      }

      img.onerror = () => reject(new Error("Falha ao carregar imagem"))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error("Falha ao ler arquivo"))
    reader.readAsDataURL(file)
  })
}

/**
 * Upload with compression
 */
export async function uploadImageWithCompression(
  file: File,
  options: ImageUploadOptions & {
    compress?: boolean
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {},
): Promise<ImageUploadResult> {
  const { compress = true, maxWidth = 1920, maxHeight = 1920, quality = 0.9, ...uploadOptions } = options

  try {
    let fileToUpload = file

    // Compress if enabled and file is large
    if (compress && file.size > 500 * 1024) {
      // Compress if > 500KB
      fileToUpload = await compressImage(file, { maxWidth, maxHeight, quality })
    }

    return await uploadImage(fileToUpload, uploadOptions)
  } catch (error) {
    console.error("Compression error:", error)
    // Fallback to original file if compression fails
    return await uploadImage(file, uploadOptions)
  }
}

/**
 * Create image thumbnail
 */
export async function createThumbnail(
  file: File,
  size: number = 300,
): Promise<{ file: File; url: string } | null> {
  try {
    const compressedFile = await compressImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.8,
    })

    const url = URL.createObjectURL(compressedFile)

    return { file: compressedFile, url }
  } catch (error) {
    console.error("Thumbnail creation error:", error)
    return null
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }

      img.onerror = () => resolve(null)
      img.src = e.target?.result as string
    }

    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}
