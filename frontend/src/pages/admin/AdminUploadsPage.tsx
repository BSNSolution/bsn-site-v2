import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Trash2, Download, Image, FileText, Video } from 'lucide-react'
import { uploadApi } from '@/lib/api'

export default function AdminUploadsPage() {
  const [uploads, setUploads] = useState([])
  const [stats, setStats] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadUploads()
    loadStats()
  }, [])

  const loadUploads = async () => {
    try {
      setIsLoading(true)
      const data = await uploadApi.admin.getUploads()
      if (data) {
        setUploads(data.uploads || data.data || data || [])
      }
    } catch (error) {
      console.error('Error loading uploads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await uploadApi.admin.getStats()
      if (statsData) {
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      await uploadApi.uploadFile(file)
      await loadUploads()
      await loadStats()
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Erro ao fazer upload do arquivo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (upload: any) => {
    if (!confirm(`Tem certeza que deseja excluir "${upload.filename}"?`)) {
      return
    }

    try {
      await uploadApi.admin.deleteUpload(upload.id)
      await loadUploads()
      await loadStats()
    } catch (error) {
      console.error('Error deleting upload:', error)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />
    } else if (mimeType.startsWith('video/')) {
      return <Video className="h-6 w-6 text-purple-500" />
    } else {
      return <FileText className="h-6 w-6 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Uploads</h1>
          <p className="text-muted-foreground">Gerencie os arquivos enviados</p>
        </div>
        <label className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer">
          <Upload className="h-4 w-4" />
          {isUploading ? 'Enviando...' : 'Upload Arquivo'}
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total de Arquivos</p>
              <p className="text-lg font-semibold">{stats.totalFiles || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Imagens</p>
              <p className="text-lg font-semibold">{stats.totalImages || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Vídeos</p>
              <p className="text-lg font-semibold">{stats.totalVideos || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Espaço Usado</p>
              <p className="text-lg font-semibold">{formatFileSize(stats.totalSize || 0)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Files Grid */}
      <div className="glass-card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-2">Carregando arquivos...</p>
          </div>
        ) : uploads.length === 0 ? (
          <div className="p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhum arquivo encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {uploads.map((upload: any, index) => (
              <motion.div
                key={upload.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card-hover p-4"
              >
                {/* Preview */}
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {upload.mimeType?.startsWith('image/') ? (
                    <img 
                      src={upload.url} 
                      alt={upload.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling!.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`${upload.mimeType?.startsWith('image/') ? 'hidden' : ''}`}>
                    {getFileIcon(upload.mimeType || '')}
                  </div>
                </div>

                {/* File Info */}
                <div className="mb-3">
                  <p className="font-medium text-sm truncate" title={upload.filename}>
                    {upload.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(upload.size)} • {new Date(upload.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {upload.mimeType}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => window.open(upload.url, '_blank')}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-primary"
                    title="Visualizar/Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => navigator.clipboard.writeText(upload.url)}
                    className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded transition-colors"
                    title="Copiar URL"
                  >
                    Copiar URL
                  </button>
                  
                  <button
                    onClick={() => handleDelete(upload)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}