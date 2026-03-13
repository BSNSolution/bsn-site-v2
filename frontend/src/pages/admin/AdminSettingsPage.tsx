import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Settings, Globe, Shield, Palette, Bell } from 'lucide-react'
import { settingsApi } from '@/lib/api'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const data = await settingsApi.admin.getSettings()
      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await settingsApi.admin.updateSettings(settings)
      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground mt-2">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do site</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Informações do Site</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Site</label>
              <input
                type="text"
                value={settings.siteName || ''}
                onChange={(e) => updateSetting('siteName', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="BSN Solution"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição do Site</label>
              <textarea
                value={settings.siteDescription || ''}
                onChange={(e) => updateSetting('siteDescription', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                placeholder="Desenvolvimento de soluções tecnológicas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email de Contato</label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => updateSetting('contactEmail', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="contato@bsnsolution.com.br"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => updateSetting('phone', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>
        </motion.div>

        {/* SEO Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">SEO</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Meta Title</label>
              <input
                type="text"
                value={settings.metaTitle || ''}
                onChange={(e) => updateSetting('metaTitle', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="BSN Solution - Desenvolvimento e Tecnologia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Meta Description</label>
              <textarea
                value={settings.metaDescription || ''}
                onChange={(e) => updateSetting('metaDescription', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                placeholder="Desenvolvimento de soluções web, mobile e desktop"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Meta Keywords</label>
              <input
                type="text"
                value={settings.metaKeywords || ''}
                onChange={(e) => updateSetting('metaKeywords', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="desenvolvimento, web, mobile, software"
              />
            </div>
          </div>
        </motion.div>

        {/* Social Media */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Redes Sociais</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input
                type="url"
                value={settings.instagram || ''}
                onChange={(e) => updateSetting('instagram', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="https://instagram.com/bsnsolution"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn</label>
              <input
                type="url"
                value={settings.linkedin || ''}
                onChange={(e) => updateSetting('linkedin', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="https://linkedin.com/company/bsnsolution"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Twitter</label>
              <input
                type="url"
                value={settings.twitter || ''}
                onChange={(e) => updateSetting('twitter', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="https://twitter.com/bsnsolution"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">GitHub</label>
              <input
                type="url"
                value={settings.github || ''}
                onChange={(e) => updateSetting('github', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="https://github.com/bsnsolution"
              />
            </div>
          </div>
        </motion.div>

        {/* Maintenance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Sistema</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Modo Manutenção</label>
                <p className="text-xs text-muted-foreground">Desabilita o site temporariamente</p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode || false}
                onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary/50 focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Formulário de Contato</label>
                <p className="text-xs text-muted-foreground">Habilita/desabilita o formulário de contato</p>
              </div>
              <input
                type="checkbox"
                checked={settings.contactFormEnabled !== false}
                onChange={(e) => updateSetting('contactFormEnabled', e.target.checked)}
                className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary/50 focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Google Analytics ID</label>
              <input
                type="text"
                value={settings.googleAnalyticsId || ''}
                onChange={(e) => updateSetting('googleAnalyticsId', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                placeholder="G-XXXXXXXXXX"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}