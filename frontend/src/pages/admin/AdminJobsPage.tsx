import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, EyeOff, FileText, Users } from 'lucide-react'
import { jobsApi } from '@/lib/api'

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const response = await jobsApi.admin.getJobs()
      if (response.data) {
        setJobs(response.data)
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Vagas</h1>
          <p className="text-muted-foreground">Gerencie as vagas de emprego</p>
        </div>
        <button
          onClick={() => {/* TODO: Implement form */}}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Vaga
        </button>
      </div>

      <div className="glass-card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-2">Carregando vagas...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhuma vaga encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map((job: any, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.department} • {job.type}</p>
                    {job.applications && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3 text-primary" />
                        <span className="text-xs text-primary">{job.applications} candidatos</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {/* TODO: View applications */}}
                      className="text-sm bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1 rounded-lg transition-colors"
                    >
                      Ver Candidatos
                    </button>
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}