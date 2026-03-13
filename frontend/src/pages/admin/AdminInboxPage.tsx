import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Inbox, Mail, MailOpen, Reply, Trash2, Archive, Clock } from 'lucide-react'
import { inboxApi } from '@/lib/api'

export default function AdminInboxPage() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const data = await inboxApi.admin.getMessages()
      if (data) {
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkRead = async (message: any) => {
    try {
      await inboxApi.admin.updateMessageStatus(message.id, 'read')
      await loadMessages()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Inbox</h1>
          <p className="text-muted-foreground">Gerencie as mensagens recebidas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {/* TODO: Bulk mark as read */}}
            className="text-sm bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded-lg transition-colors"
          >
            Marcar todas como lidas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2">
          <div className="glass-card">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-muted-foreground mt-2">Carregando mensagens...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {messages.map((message: any, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      selectedMessage?.id === message.id ? 'bg-primary/5 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-1">
                        {message.status === 'unread' ? (
                          <Mail className="h-4 w-4 text-primary" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-medium truncate ${
                            message.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {message.name} ({message.email})
                          </h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        
                        {message.subject && (
                          <p className={`text-sm mb-1 ${
                            message.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {message.subject}
                          </p>
                        )}
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6">
            {selectedMessage ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Detalhes da Mensagem</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkRead(selectedMessage)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-primary"
                      title="Marcar como lida"
                    >
                      <MailOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {/* TODO: Archive */}}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Arquivar"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {/* TODO: Delete */}}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">De:</label>
                    <p className="font-medium">{selectedMessage.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                    {selectedMessage.phone && (
                      <p className="text-sm text-muted-foreground">{selectedMessage.phone}</p>
                    )}
                  </div>

                  {selectedMessage.subject && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Assunto:</label>
                      <p>{selectedMessage.subject}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mensagem:</label>
                    <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data:</label>
                    <p className="text-sm">{formatDate(selectedMessage.createdAt)}</p>
                  </div>

                  <button
                    onClick={() => {/* TODO: Reply form */}}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Reply className="h-4 w-4" />
                    Responder
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma mensagem para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}