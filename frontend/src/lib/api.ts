import axios from 'axios'

// Create axios instance
// Em dev local (VITE_API_URL não setado), usa localhost:3001.
// Em produção, o frontend chama diretamente o domínio do backend.
const DEFAULT_API_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api'
  : 'https://api.bsnsolution.com.br/api'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || DEFAULT_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bsn-auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('bsn-auth-token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

// API Types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  details?: any
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ===== Users / Permissions / Groups =====
export const usersAdminApi = {
  listUsers: async () => (await api.get('/admin/users')).data,
  getUser: async (id: string) => (await api.get(`/admin/users/${id}`)).data,
  createUser: async (data: any) => (await api.post('/admin/users', data)).data,
  updateUser: async (id: string, data: any) => (await api.put(`/admin/users/${id}`, data)).data,
  deleteUser: async (id: string) => (await api.delete(`/admin/users/${id}`)).data,
  listPermissions: async () => (await api.get('/admin/permissions')).data,
  listGroups: async () => (await api.get('/admin/groups')).data,
  createGroup: async (data: any) => (await api.post('/admin/groups', data)).data,
  updateGroup: async (id: string, data: any) => (await api.put(`/admin/groups/${id}`, data)).data,
  deleteGroup: async (id: string) => (await api.delete(`/admin/groups/${id}`)).data,
  getMyPermissions: async () => (await api.get('/admin/me/permissions')).data,
}

// ===== CMS extras (new layout) =====
export const homeExtrasApi = {
  getLiveCard: async () => (await api.get('/home/live-card')).data,
  getBrandPill: async () => (await api.get('/home/brand-pill')).data,
  getBand: async () => (await api.get('/home/band')).data,
  admin: {
    getLiveCard: async () => (await api.get('/admin/home/live-card')).data,
    saveLiveCard: async (data: any) => (await api.put('/admin/home/live-card', data)).data,
    getBrandPill: async () => (await api.get('/admin/home/brand-pill')).data,
    saveBrandPill: async (data: any) => (await api.put('/admin/home/brand-pill', data)).data,
    getBand: async () => (await api.get('/admin/home/band')).data,
    saveBand: async (data: any) => (await api.put('/admin/home/band', data)).data,
  },
}

export const stackApi = {
  getItems: async () => (await api.get('/stack')).data,
  admin: {
    getItems: async () => (await api.get('/admin/stack')).data,
    create: async (data: any) => (await api.post('/admin/stack', data)).data,
    update: async (id: string, data: any) => (await api.put(`/admin/stack/${id}`, data)).data,
    remove: async (id: string) => (await api.delete(`/admin/stack/${id}`)).data,
    toggle: async (id: string) => (await api.patch(`/admin/stack/${id}/toggle`)).data,
  },
}

export const aboutCardsApi = {
  getCards: async () => (await api.get('/about-cards')).data,
  admin: {
    getCards: async () => (await api.get('/admin/about-cards')).data,
    create: async (data: any) => (await api.post('/admin/about-cards', data)).data,
    update: async (id: string, data: any) => (await api.put(`/admin/about-cards/${id}`, data)).data,
    remove: async (id: string) => (await api.delete(`/admin/about-cards/${id}`)).data,
    toggle: async (id: string) => (await api.patch(`/admin/about-cards/${id}/toggle`)).data,
  },
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    localStorage.removeItem('bsn-auth-token')
    return response.data
  },

  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  },
}

// Home API
export const homeApi = {
  getSections: async () => {
    const response = await api.get('/home')
    return response.data
  },

  // Admin endpoints
  admin: {
    getSections: async () => {
      const response = await api.get('/admin/home')
      return response.data
    },

    updateSection: async (id: string, data: any) => {
      const response = await api.put(`/admin/home/${id}`, data)
      return response.data
    },

    createSection: async (data: any) => {
      const response = await api.post('/admin/home', data)
      return response.data
    },

    deleteSection: async (id: string) => {
      const response = await api.delete(`/admin/home/${id}`)
      return response.data
    },

    toggleSection: async (id: string) => {
      const response = await api.patch(`/admin/home/${id}/toggle`)
      return response.data
    },

    reorderSections: async (items: { id: string; order: number }[]) => {
      const response = await api.patch('/admin/home/reorder', { items })
      return response.data
    },
  },
}

// Services API
export const servicesApi = {
  getServices: async () => {
    const response = await api.get('/services')
    return response.data
  },

  getService: async (id: string) => {
    const response = await api.get(`/services/${id}`)
    return response.data
  },

  // Detalhe público por slug — inclui blocks ordenados e hero/CTA
  getServiceBySlug: async (slug: string) => {
    const response = await api.get(`/services/slug/${slug}`)
    return response.data
  },

  // Admin endpoints
  admin: {
    getServices: async () => {
      const response = await api.get('/admin/services')
      return response.data
    },

    getService: async (id: string) => {
      const response = await api.get(`/admin/services/${id}`)
      return response.data
    },

    createService: async (data: any) => {
      const response = await api.post('/admin/services', data)
      return response.data
    },

    updateService: async (id: string, data: any) => {
      const response = await api.put(`/admin/services/${id}`, data)
      return response.data
    },

    deleteService: async (id: string) => {
      const response = await api.delete(`/admin/services/${id}`)
      return response.data
    },

    toggleService: async (id: string) => {
      const response = await api.patch(`/admin/services/${id}/toggle`)
      return response.data
    },

    reorderServices: async (items: { id: string; order: number }[]) => {
      const response = await api.patch('/admin/services/reorder', { items })
      return response.data
    },

    // ── Blocks de detalhe ──
    getBlocks: async (serviceId: string) => {
      const response = await api.get(`/admin/services/${serviceId}/blocks`)
      return response.data
    },
    createBlock: async (serviceId: string, data: any) => {
      const response = await api.post(`/admin/services/${serviceId}/blocks`, data)
      return response.data
    },
    updateBlock: async (serviceId: string, blockId: string, data: any) => {
      const response = await api.put(`/admin/services/${serviceId}/blocks/${blockId}`, data)
      return response.data
    },
    deleteBlock: async (serviceId: string, blockId: string) => {
      const response = await api.delete(`/admin/services/${serviceId}/blocks/${blockId}`)
      return response.data
    },
    toggleBlock: async (serviceId: string, blockId: string) => {
      const response = await api.patch(`/admin/services/${serviceId}/blocks/${blockId}/toggle`)
      return response.data
    },
    reorderBlocks: async (serviceId: string, items: { id: string; order: number }[]) => {
      const response = await api.patch(`/admin/services/${serviceId}/blocks/reorder`, { items })
      return response.data
    },
  },
}

// Solutions API
export const solutionsApi = {
  getSolutions: async () => {
    const response = await api.get('/solutions')
    return response.data
  },

  getFeaturedSolutions: async () => {
    const response = await api.get('/solutions/featured')
    return response.data
  },

  getSolution: async (id: string) => {
    const response = await api.get(`/solutions/${id}`)
    return response.data
  },

  // Admin endpoints
  admin: {
    getSolutions: async () => {
      const response = await api.get('/admin/solutions')
      return response.data
    },

    createSolution: async (data: any) => {
      const response = await api.post('/admin/solutions', data)
      return response.data
    },

    updateSolution: async (id: string, data: any) => {
      const response = await api.put(`/admin/solutions/${id}`, data)
      return response.data
    },

    deleteSolution: async (id: string) => {
      const response = await api.delete(`/admin/solutions/${id}`)
      return response.data
    },

    toggleSolution: async (id: string) => {
      const response = await api.patch(`/admin/solutions/${id}/toggle`)
      return response.data
    },

    toggleFeatured: async (id: string) => {
      const response = await api.patch(`/admin/solutions/${id}/toggle-featured`)
      return response.data
    },
  },
}

// Testimonials API
export const testimonialsApi = {
  getTestimonials: async () => {
    const response = await api.get('/testimonials')
    return response.data
  },

  // Admin endpoints
  admin: {
    getTestimonials: async () => {
      const response = await api.get('/admin/testimonials')
      return response.data
    },

    createTestimonial: async (data: any) => {
      const response = await api.post('/admin/testimonials', data)
      return response.data
    },

    updateTestimonial: async (id: string, data: any) => {
      const response = await api.put(`/admin/testimonials/${id}`, data)
      return response.data
    },

    deleteTestimonial: async (id: string) => {
      const response = await api.delete(`/admin/testimonials/${id}`)
      return response.data
    },

    toggleTestimonial: async (id: string) => {
      const response = await api.patch(`/admin/testimonials/${id}/toggle`)
      return response.data
    },
  },
}

// Contact API
export const contactApi = {
  sendMessage: async (data: {
    name: string
    email: string
    phone?: string
    subject?: string
    message: string
  }) => {
    const response = await api.post('/contact', data)
    return response.data
  },
}

// Blog API
export const blogApi = {
  getPosts: async (params?: { page?: number; limit?: number; tag?: string; featured?: boolean }) => {
    const response = await api.get('/blog', { params })
    return response.data
  },

  getPost: async (slug: string) => {
    const response = await api.get(`/blog/${slug}`)
    return response.data
  },

  getTags: async () => {
    const response = await api.get('/blog/tags')
    return response.data
  },

  // Admin endpoints
  admin: {
    getPosts: async (params?: PaginationParams) => {
      const response = await api.get('/admin/blog', { params })
      return response.data
    },

    getPost: async (id: string) => {
      const response = await api.get(`/admin/blog/${id}`)
      return response.data
    },

    createPost: async (data: any) => {
      const response = await api.post('/admin/blog', data)
      return response.data
    },

    updatePost: async (id: string, data: any) => {
      const response = await api.put(`/admin/blog/${id}`, data)
      return response.data
    },

    deletePost: async (id: string) => {
      const response = await api.delete(`/admin/blog/${id}`)
      return response.data
    },

    togglePublished: async (id: string) => {
      const response = await api.patch(`/admin/blog/${id}/toggle-published`)
      return response.data
    },

    toggleFeatured: async (id: string) => {
      const response = await api.patch(`/admin/blog/${id}/toggle-featured`)
      return response.data
    },
  },
}

// Team API
export const teamApi = {
  getTeam: async () => {
    const response = await api.get('/team')
    return response.data
  },

  getMember: async (id: string) => {
    const response = await api.get(`/team/${id}`)
    return response.data
  },

  // Admin endpoints
  admin: {
    getTeam: async () => {
      const response = await api.get('/admin/team')
      return response.data
    },

    createMember: async (data: any) => {
      const response = await api.post('/admin/team', data)
      return response.data
    },

    updateMember: async (id: string, data: any) => {
      const response = await api.put(`/admin/team/${id}`, data)
      return response.data
    },

    deleteMember: async (id: string) => {
      const response = await api.delete(`/admin/team/${id}`)
      return response.data
    },

    toggleMember: async (id: string) => {
      const response = await api.patch(`/admin/team/${id}/toggle`)
      return response.data
    },
  },
}

// Clients API
export const clientsApi = {
  getClients: async () => {
    const response = await api.get('/clients')
    return response.data
  },

  // Admin endpoints
  admin: {
    getClients: async () => {
      const response = await api.get('/admin/clients')
      return response.data
    },

    createClient: async (data: any) => {
      const response = await api.post('/admin/clients', data)
      return response.data
    },

    updateClient: async (id: string, data: any) => {
      const response = await api.put(`/admin/clients/${id}`, data)
      return response.data
    },

    deleteClient: async (id: string) => {
      const response = await api.delete(`/admin/clients/${id}`)
      return response.data
    },

    toggleClient: async (id: string) => {
      const response = await api.patch(`/admin/clients/${id}/toggle`)
      return response.data
    },
  },
}

// Jobs API
export const jobsApi = {
  getJobs: async () => {
    const response = await api.get('/jobs')
    return response.data
  },

  getJob: async (id: string) => {
    const response = await api.get(`/jobs/${id}`)
    return response.data
  },

  applyToJob: async (jobId: string, data: any) => {
    const response = await api.post(`/jobs/${jobId}/apply`, data)
    return response.data
  },

  // Admin endpoints
  admin: {
    getJobs: async () => {
      const response = await api.get('/admin/jobs')
      return response.data
    },

    createJob: async (data: any) => {
      const response = await api.post('/admin/jobs', data)
      return response.data
    },

    updateJob: async (id: string, data: any) => {
      const response = await api.put(`/admin/jobs/${id}`, data)
      return response.data
    },

    deleteJob: async (id: string) => {
      const response = await api.delete(`/admin/jobs/${id}`)
      return response.data
    },

    getApplications: async (jobId: string, params?: PaginationParams) => {
      const response = await api.get(`/admin/jobs/${jobId}/applications`, { params })
      return response.data
    },

    updateApplicationStatus: async (applicationId: string, status: string) => {
      const response = await api.patch(`/admin/applications/${applicationId}/status`, { status })
      return response.data
    },
  },
}

// Upload API
export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  uploadResume: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Admin endpoints
  admin: {
    getUploads: async (params?: { page?: number; limit?: number; mimeType?: string }) => {
      const response = await api.get('/admin/uploads', { params })
      return response.data
    },

    deleteUpload: async (id: string) => {
      const response = await api.delete(`/admin/uploads/${id}`)
      return response.data
    },

    getStats: async () => {
      const response = await api.get('/admin/uploads/stats')
      return response.data
    },
  },
}

// Settings API
export const settingsApi = {
  getSettings: async () => {
    const response = await api.get('/settings')
    return response.data
  },

  // Admin endpoints
  admin: {
    getSettings: async () => {
      const response = await api.get('/admin/settings')
      return response.data
    },

    updateSettings: async (data: any) => {
      const response = await api.put('/admin/settings', data)
      return response.data
    },

    toggleMaintenance: async (enabled: boolean) => {
      const response = await api.patch('/admin/settings/maintenance', { enabled })
      return response.data
    },

    toggleContactForm: async (enabled: boolean) => {
      const response = await api.patch('/admin/settings/contact-form', { enabled })
      return response.data
    },

    backupSettings: async () => {
      const response = await api.get('/admin/settings/backup')
      return response.data
    },

    restoreSettings: async (data: any) => {
      const response = await api.post('/admin/settings/restore', data)
      return response.data
    },
  },
}

// Inbox API
export const inboxApi = {
  admin: {
    getMessages: async (params?: { page?: number; limit?: number; status?: string }) => {
      const response = await api.get('/admin/inbox', { params })
      return response.data
    },

    getMessage: async (id: string) => {
      const response = await api.get(`/admin/inbox/${id}`)
      return response.data
    },

    replyToMessage: async (id: string, content: string) => {
      const response = await api.post(`/admin/inbox/${id}/reply`, { content })
      return response.data
    },

    updateMessageStatus: async (id: string, status: string) => {
      const response = await api.patch(`/admin/inbox/${id}/status`, { status })
      return response.data
    },

    deleteMessage: async (id: string) => {
      const response = await api.delete(`/admin/inbox/${id}`)
      return response.data
    },

    getStats: async () => {
      const response = await api.get('/admin/inbox/stats')
      return response.data
    },

    bulkMarkRead: async (messageIds: string[]) => {
      const response = await api.patch('/admin/inbox/bulk/mark-read', { messageIds })
      return response.data
    },

    bulkArchive: async (messageIds: string[]) => {
      const response = await api.patch('/admin/inbox/bulk/archive', { messageIds })
      return response.data
    },
  },
}

// Analytics API
export const analyticsApi = {
  track: async (event: string, data?: any) => {
    try {
      await api.post('/analytics/track', {
        event,
        page: window.location.pathname,
        data,
      })
    } catch (error) {
      // Silently fail analytics
      console.debug('Analytics tracking failed:', error)
    }
  },

  // Admin endpoints
  admin: {
    getEvents: async (params?: {
      startDate?: string
      endDate?: string
      event?: string
      page?: string
      limit?: number
    }) => {
      const response = await api.get('/admin/analytics/events', { params })
      return response.data
    },

    getStats: async (params?: { startDate?: string; endDate?: string }) => {
      const response = await api.get('/admin/analytics/stats', { params })
      return response.data
    },

    getRecent: async () => {
      const response = await api.get('/admin/analytics/recent')
      return response.data
    },

    cleanup: async (daysToKeep?: number) => {
      const response = await api.delete('/admin/analytics/cleanup', {
        data: { daysToKeep },
      })
      return response.data
    },
  },
}

// AI page API (blocos da página /inteligencia-artificial)
export const aiApi = {
  getBlocks: async () => {
    const response = await api.get('/ai-blocks')
    return response.data
  },

  admin: {
    getBlocks: async () => {
      const response = await api.get('/admin/ai-blocks')
      return response.data
    },

    getBlock: async (id: string) => {
      const response = await api.get(`/admin/ai-blocks/${id}`)
      return response.data
    },

    createBlock: async (data: any) => {
      const response = await api.post('/admin/ai-blocks', data)
      return response.data
    },

    updateBlock: async (id: string, data: any) => {
      const response = await api.put(`/admin/ai-blocks/${id}`, data)
      return response.data
    },

    deleteBlock: async (id: string) => {
      const response = await api.delete(`/admin/ai-blocks/${id}`)
      return response.data
    },

    toggleBlock: async (id: string) => {
      const response = await api.patch(`/admin/ai-blocks/${id}/toggle`)
      return response.data
    },
  },
}

export default api